import { Response, NextFunction } from 'express';
import { PantryAppointmentService } from '../services/pantryAppointmentService';
import { CalendarService } from '../services/calendarService';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';
import logger from '../utils/logger';

export class PantryAppointmentController {
  private appointmentService: PantryAppointmentService;
  private calendarService: CalendarService;

  constructor() {
    this.appointmentService = new PantryAppointmentService();
    this.calendarService = new CalendarService();
  }

  createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const appointment = await this.appointmentService.createAppointment(userId, req.body);

      // Attempt to create a Google Calendar event — non-blocking
      try {
        const appointmentTime = new Date(appointment.appointment_time);
        const endTime = new Date(appointmentTime.getTime() + appointment.duration_minutes * 60 * 1000);
        const calResult = await this.calendarService.createEvent(userId, {
          title: 'FoodBridge Pantry Appointment',
          startTime: appointmentTime,
          endTime,
          description: appointment.notes,
        });
        if (calResult.success && calResult.googleEventId) {
          await this.appointmentService.updateAppointment(appointment.id, userId, {
            google_event_id: calResult.googleEventId,
          });
          appointment.google_event_id = calResult.googleEventId;
        }
      } catch (calError) {
        logger.error('Calendar event creation failed after booking', { userId, appointmentId: appointment.id, calError });
      }

      successResponse(res, appointment, 'Appointment created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const appointment = await this.appointmentService.getAppointmentById(id, userId);
      successResponse(res, appointment, 'Appointment retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, upcoming, page = 1, limit = 20 } = req.query;

      const result = await this.appointmentService.getUserAppointments(userId, {
        status: status as string,
        upcoming: upcoming === 'true',
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.appointments, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const appointment = await this.appointmentService.updateAppointment(id, userId, req.body);
      successResponse(res, appointment, 'Appointment updated successfully');
    } catch (error) {
      next(error);
    }
  };

  cancelAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const appointment = await this.appointmentService.cancelAppointment(id, userId);
      successResponse(res, appointment, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  cancelAppointmentByDateTime = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { date, time } = req.query;
      const userId = req.user!.id;

      if (!date || !time) {
        return res.status(400).json({
          success: false,
          message: 'date and time query parameters are required (format: date=YYYY-MM-DD, time=HH:MM)',
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD (e.g., 2026-03-20)',
        });
      }

      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(time as string)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:MM in 24-hour format (e.g., 14:30)',
        });
      }

      // Fetch the appointment first to capture google_event_id before cancellation
      const { appointments } = await this.appointmentService.getUserAppointments(userId, { limit: 1000 });
      const [year, month, day] = (date as string).split('-').map(Number);
      const [hours, minutes] = (time as string).split(':').map(Number);
      const existing = appointments.find((apt) => {
        const t = new Date(apt.appointment_time);
        return (
          t.getUTCFullYear() === year &&
          t.getUTCMonth() === month - 1 &&
          t.getUTCDate() === day &&
          t.getUTCHours() === hours &&
          Math.abs(t.getUTCMinutes() - minutes) <= 1
        );
      });
      const googleEventId = existing?.google_event_id;

      const appointment = await this.appointmentService.cancelAppointmentByDateTime(
        userId,
        date as string,
        time as string
      );

      // Attempt to delete the Google Calendar event — non-blocking
      if (googleEventId) {
        try {
          const delResult = await this.calendarService.deleteEvent(userId, googleEventId);
          if (!delResult.success) {
            logger.error('Calendar event deletion failed after cancellation', { userId, googleEventId, error: delResult.error });
          }
        } catch (calError) {
          logger.error('Calendar event deletion threw after cancellation', { userId, googleEventId, calError });
        }
      }

      return successResponse(res, appointment, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  listAllAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, date, page = 1, limit = 20 } = req.query;

      const result = await this.appointmentService.listAllAppointments({
        status: status as string,
        date: date ? new Date(date as string) : undefined,
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.appointments, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  getAvailableSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { date } = req.query;
      let targetDate: Date;
      if (date) {
        // Extract YYYY-MM-DD portion only (handles both "2026-03-17" and "2026-03-17T16:30:00")
        const datePart = (date as string).substring(0, 10);
        const [year, month, day] = datePart.split('-').map(Number);
        if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
          return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
        }
        targetDate = new Date(year, month - 1, day);
      } else {
        targetDate = new Date();
      }
      const slots = await this.appointmentService.getAvailableSlots(targetDate);
      return successResponse(res, slots, 'Available slots retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getAppointmentsByStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, upcoming, page = 1, limit = 20 } = req.query;

      const result = await this.appointmentService.getAppointmentsByStudent(id, {
        status: status as string,
        upcoming: upcoming === 'true',
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.appointments, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };
}

