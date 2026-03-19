import { PantryAppointmentRepository } from '../repositories/pantryAppointmentRepository';
import { PantryOrderRepository } from '../repositories/pantryOrderRepository';
import { PantryInventoryRepository } from '../repositories/pantryInventoryRepository';
import { NotificationService } from './notificationService';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { PantryAppointment, PantryInventory } from '../types';

export class PantryAppointmentService {
  private appointmentRepository: PantryAppointmentRepository;
  private orderRepository: PantryOrderRepository;
  private inventoryRepository: PantryInventoryRepository;
  private notificationService: NotificationService;

  constructor() {
    this.appointmentRepository = new PantryAppointmentRepository();
    this.orderRepository = new PantryOrderRepository();
    this.inventoryRepository = new PantryInventoryRepository();
    this.notificationService = new NotificationService();
  }

  async createAppointment(
    userId: string,
    appointmentData: {
      appointment_time: Date;
      duration_minutes?: number;
      notes?: string;
    }
  ): Promise<PantryAppointment> {
    const appointmentTime = new Date(appointmentData.appointment_time);
    const durationMinutes = appointmentData.duration_minutes || 30;

    // Validate appointment is in the future (add a small buffer to avoid race conditions)
    const bufferMs = 60 * 1000; // 1 minute buffer
    if (appointmentTime.getTime() < Date.now() - bufferMs) {
      throw new BadRequestError('Appointment time must be in the future');
    }

    // Check for conflicting appointments
    const hasConflict = await this.appointmentRepository.checkConflictingAppointment(
      appointmentTime,
      durationMinutes
    );

    if (hasConflict) {
      throw new ConflictError('This time slot is already booked');
    }

    const appointment = await this.appointmentRepository.create({
      user_id: userId,
      appointment_time: appointmentTime,
      duration_minutes: durationMinutes,
      notes: appointmentData.notes,
    });

    // Trigger notification asynchronously
    setImmediate(async () => {
      try {
        await this.notificationService.notifyAppointmentBooked(
          userId,
          appointment.id,
          appointmentTime
        );
      } catch (error) {
        console.error('Failed to send appointment notification:', error);
      }
    });

    return appointment;
  }

  async getAppointmentById(id: string, userId: string): Promise<PantryAppointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.user_id !== userId) {
      throw new NotFoundError('Appointment not found');
    }

    return appointment;
  }

  async getUserAppointments(
    userId: string,
    filters?: {
      status?: string;
      upcoming?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ appointments: PantryAppointment[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.appointmentRepository.findByUser(userId, {
      status: filters?.status,
      upcoming: filters?.upcoming,
      limit,
      offset,
    });
  }

  async updateAppointment(
    id: string,
    userId: string,
    updates: Partial<PantryAppointment>
  ): Promise<PantryAppointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.user_id !== userId) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      throw new BadRequestError('Cannot update completed or cancelled appointment');
    }

    // If updating time, check for conflicts
    if (updates.appointment_time) {
      const newTime = new Date(updates.appointment_time);
      if (newTime <= new Date()) {
        throw new BadRequestError('Appointment time must be in the future');
      }

      const durationMinutes = updates.duration_minutes || appointment.duration_minutes;
      const hasConflict = await this.appointmentRepository.checkConflictingAppointment(
        newTime,
        durationMinutes,
        id
      );

      if (hasConflict) {
        throw new ConflictError('This time slot is already booked');
      }
    }

    const updatedAppointment = await this.appointmentRepository.update(id, updates);
    if (!updatedAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    return updatedAppointment;
  }

  async cancelAppointment(id: string, userId: string): Promise<PantryAppointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.user_id !== userId) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new BadRequestError('Appointment is already cancelled');
    }

    if (appointment.status === 'completed') {
      throw new BadRequestError('Cannot cancel a completed appointment');
    }

    const updatedAppointment = await this.appointmentRepository.update(id, {
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    if (!updatedAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    return updatedAppointment;
  }

  async cancelAppointmentByDateTime(
    userId: string,
    date: string,
    time: string
  ): Promise<PantryAppointment> {
    // Parse date (YYYY-MM-DD) and time (HH:MM)
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Find appointment matching the date, time, and user
    const { appointments } = await this.appointmentRepository.findByUser(userId, {
      limit: 1000, // Get enough to search through
    });

    // Find matching appointment with flexible time matching (within 1 minute tolerance)
    const appointment = appointments.find((apt) => {
      const aptTime = new Date(apt.appointment_time);
      
      // Compare date components
      const dateMatch =
        aptTime.getUTCFullYear() === year &&
        aptTime.getUTCMonth() === month - 1 &&
        aptTime.getUTCDate() === day;

      // Compare time components with 1-minute tolerance
      const aptHours = aptTime.getUTCHours();
      const aptMinutes = aptTime.getUTCMinutes();
      const timeMatch =
        aptHours === hours &&
        (Math.abs(aptMinutes - minutes) <= 1);

      return dateMatch && timeMatch;
    });

    if (!appointment) {
      // Provide more helpful error message
      const availableAppointments = appointments
        .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed')
        .slice(0, 3)
        .map(apt => {
          const t = new Date(apt.appointment_time);
          return `${t.toISOString().split('T')[0]} at ${t.getUTCHours().toString().padStart(2, '0')}:${t.getUTCMinutes().toString().padStart(2, '0')}`;
        });

      const errorMsg = availableAppointments.length > 0
        ? `No appointment found for ${date} at ${time}. Your upcoming appointments are: ${availableAppointments.join(', ')}`
        : `No appointment found for ${date} at ${time}`;

      throw new NotFoundError(errorMsg);
    }

    if (appointment.status === 'cancelled') {
      throw new BadRequestError('Appointment is already cancelled');
    }

    if (appointment.status === 'completed') {
      throw new BadRequestError('Cannot cancel a completed appointment');
    }

    const updatedAppointment = await this.appointmentRepository.update(appointment.id, {
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    if (!updatedAppointment) {
      throw new NotFoundError('Appointment not found');
    }

    return updatedAppointment;
  }

  async listAllAppointments(filters?: {
    status?: string;
    date?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ appointments: PantryAppointment[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.appointmentRepository.findAll({
      status: filters?.status,
      date: filters?.date,
      limit,
      offset,
    });
  }

  async getAvailableSlots(date: Date): Promise<{ time: string; available: boolean }[]> {
    // Generate time slots for the day (9 AM to 5 PM, 30-minute intervals)
    const slots: { time: string; available: boolean }[] = [];
    const targetDate = new Date(date);
    targetDate.setHours(9, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(17, 0, 0, 0);

    const now = new Date();
    // Only filter out past slots when the requested date is today
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    while (targetDate < endTime) {
      const slotTime = new Date(targetDate);
      const hasConflict = await this.appointmentRepository.checkConflictingAppointment(
        slotTime,
        30
      );

      const notInPast = isToday ? slotTime > now : true;

      slots.push({
        time: slotTime.toISOString(),
        available: !hasConflict && notInPast,
      });

      targetDate.setMinutes(targetDate.getMinutes() + 30);
    }

    return slots;
  }

  async getAppointmentsByStudent(
    studentId: string,
    filters?: {
      status?: string;
      upcoming?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ appointments: PantryAppointment[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.appointmentRepository.findByUser(studentId, {
      status: filters?.status,
      upcoming: filters?.upcoming,
      limit,
      offset,
    });
  }

  async generateSmartCart(userId: string, maxItems: number = 10): Promise<PantryInventory[]> {
    // Get user's order history to find frequently ordered items
    const { orders } = await this.orderRepository.findByUser(userId, {
      status: 'picked_up',
      limit: 50, // Look at last 50 orders
    });

    // Count frequency of each inventory item across all orders
    const itemFrequency = new Map<string, { count: number; inventoryId: string }>();

    for (const order of orders) {
      const items = await this.orderRepository.getOrderItems(order.id);
      for (const item of items) {
        const current = itemFrequency.get(item.inventory_id) || { count: 0, inventoryId: item.inventory_id };
        itemFrequency.set(item.inventory_id, {
          count: current.count + item.quantity,
          inventoryId: item.inventory_id,
        });
      }
    }

    // Sort by frequency (most frequent first)
    const sortedItems = Array.from(itemFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxItems);

    // Fetch current inventory for these items and filter by availability
    const recommendations: PantryInventory[] = [];

    for (const { inventoryId } of sortedItems) {
      const inventoryItem = await this.inventoryRepository.findById(inventoryId);
      
      // Only include items that are currently in stock
      if (inventoryItem && inventoryItem.quantity > 0) {
        recommendations.push(inventoryItem);
      }
    }

    // If user has no history or not enough recommendations, add popular items
    if (recommendations.length < maxItems) {
      const { items: availableItems } = await this.inventoryRepository.findAll({
        limit: maxItems - recommendations.length,
      });

      // Add items not already in recommendations
      const existingIds = new Set(recommendations.map(r => r.id));
      for (const item of availableItems) {
        if (!existingIds.has(item.id) && item.quantity > 0) {
          recommendations.push(item);
          if (recommendations.length >= maxItems) break;
        }
      }
    }

    return recommendations;
  }
}

