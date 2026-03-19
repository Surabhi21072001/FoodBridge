import { NotificationRepository } from '../repositories/notificationRepository';
import { query } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { Notification, FoodListing } from '../types';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createNotification(notificationData: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    related_entity_type?: string;
    related_entity_id?: string;
  }): Promise<Notification> {
    return await this.notificationRepository.create(notificationData);
  }

  async getUserNotifications(
    userId: string,
    filters?: {
      is_read?: boolean;
      type?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number; unread_count: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const result = await this.notificationRepository.findByUser(userId, {
      is_read: filters?.is_read,
      type: filters?.type,
      limit,
      offset,
    });

    const unread_count = await this.notificationRepository.getUnreadCount(userId);

    return {
      ...result,
      unread_count,
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new NotFoundError('Notification not found');
    }

    const updatedNotification = await this.notificationRepository.markAsRead(id);
    if (!updatedNotification) {
      throw new NotFoundError('Notification not found');
    }

    return updatedNotification;
  }

  async markAllAsRead(userId: string): Promise<number> {
    return await this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.user_id !== userId) {
      throw new NotFoundError('Notification not found');
    }

    await this.notificationRepository.delete(id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId);
  }

  // Helper methods for creating specific notification types
  async notifyReservationConfirmed(
    userId: string,
    reservationId: string,
    listingTitle: string,
    confirmationCode: string
  ): Promise<Notification> {
    return await this.createNotification({
      user_id: userId,
      type: 'reservation_confirmed',
      title: 'Reservation Confirmed',
      message: `Your reservation for "${listingTitle}" has been confirmed. Pickup code: ${confirmationCode}`,
      related_entity_type: 'reservation',
      related_entity_id: reservationId,
    });
  }

  async notifyAppointmentReminder(
    userId: string,
    appointmentId: string,
    appointmentTime: Date
  ): Promise<Notification> {
    return await this.createNotification({
      user_id: userId,
      type: 'appointment_reminder',
      title: 'Pantry Appointment Reminder',
      message: `Your pantry appointment is scheduled for ${appointmentTime.toLocaleString()}`,
      related_entity_type: 'appointment',
      related_entity_id: appointmentId,
    });
  }

  async notifyNewListing(
    userId: string,
    listingId: string,
    listingTitle: string,
    providerName: string
  ): Promise<Notification> {
    return await this.createNotification({
      user_id: userId,
      type: 'new_listing',
      title: 'New Food Available',
      message: `${providerName} has posted new surplus food: ${listingTitle}`,
      related_entity_type: 'listing',
      related_entity_id: listingId,
    });
  }

  async notifyMatchingUsers(listing: FoodListing, providerName: string): Promise<number> {
    // Find users whose preferences match this listing
    const matchingUsers = await this.findUsersMatchingListing(listing);
    
    let notificationCount = 0;
    for (const userId of matchingUsers) {
      try {
        await this.notifyNewListing(userId, listing.id, listing.title, providerName);
        notificationCount++;
      } catch (error) {
        // Log error but continue notifying other users
        console.error(`Failed to notify user ${userId}:`, error);
      }
    }

    return notificationCount;
  }

  private async findUsersMatchingListing(listing: FoodListing): Promise<string[]> {
    // Query user_preferences to find matching users
    const result = await query(
      `SELECT DISTINCT up.user_id
       FROM user_preferences up
       JOIN users u ON up.user_id = u.id
       WHERE u.role = 'student' 
         AND u.is_active = true
         AND (
           -- Match dietary tags
           (up.dietary_restrictions IS NULL OR up.dietary_restrictions = '{}' OR up.dietary_restrictions && $1)
           -- Match favorite cuisines
           OR (up.favorite_cuisines IS NULL OR up.favorite_cuisines = '{}' OR $2 = ANY(up.favorite_cuisines))
           -- Match preferred providers
           OR (up.preferred_providers IS NULL OR up.preferred_providers = '{}' OR $3 = ANY(up.preferred_providers))
         )
         -- Exclude users with allergen conflicts
         AND (up.allergens IS NULL OR up.allergens = '{}' OR NOT (up.allergens && $4))
       LIMIT 100`,
      [
        listing.dietary_tags || [],
        listing.cuisine_type || '',
        listing.provider_id,
        listing.allergen_info || [],
      ]
    );

    return result.rows.map(row => row.user_id);
  }

  async notifyReservationCancelled(
    userId: string,
    reservationId: string,
    listingTitle: string
  ): Promise<Notification> {
    return await this.createNotification({
      user_id: userId,
      type: 'reservation_cancelled',
      title: 'Reservation Cancelled',
      message: `Your reservation for "${listingTitle}" has been cancelled.`,
      related_entity_type: 'reservation',
      related_entity_id: reservationId,
    });
  }

  async notifyPickupConfirmed(
    userId: string,
    reservationId: string,
    listingTitle: string
  ): Promise<Notification> {
    return await this.createNotification({
      user_id: userId,
      type: 'pickup_confirmed',
      title: 'Pickup Confirmed',
      message: `Your pickup for "${listingTitle}" has been confirmed. Thank you!`,
      related_entity_type: 'reservation',
      related_entity_id: reservationId,
    });
  }

  async notifyAppointmentBooked(
    userId: string,
    appointmentId: string,
    appointmentTime: Date
  ): Promise<Notification> {
    return await this.createNotification({
      user_id: userId,
      type: 'appointment_booked',
      title: 'Pantry Appointment Booked',
      message: `Your pantry appointment has been scheduled for ${appointmentTime.toLocaleString()}`,
      related_entity_type: 'appointment',
      related_entity_id: appointmentId,
    });
  }
}
