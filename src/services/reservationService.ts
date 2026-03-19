import { ReservationRepository } from '../repositories/reservationRepository';
import { ListingRepository } from '../repositories/listingRepository';
import { NotificationService } from './notificationService';
import { transaction } from '../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { Reservation } from '../types';

export class ReservationService {
  private reservationRepository: ReservationRepository;
  private listingRepository: ListingRepository;
  private notificationService: NotificationService;

  constructor() {
    this.reservationRepository = new ReservationRepository();
    this.listingRepository = new ListingRepository();
    this.notificationService = new NotificationService();
  }

  async createReservation(
    userId: string,
    reservationData: {
      listing_id: string;
      quantity: number;
      pickup_time?: Date;
      notes?: string;
    }
  ): Promise<Reservation> {
    // Check for duplicate reservation
    const hasDuplicate = await this.reservationRepository.checkDuplicateReservation(
      userId,
      reservationData.listing_id
    );

    if (hasDuplicate) {
      throw new ConflictError('You already have an active reservation for this listing');
    }

    // Use transaction to ensure atomicity
    return await transaction(async (client) => {
      // Get listing and lock row
      const listingResult = await client.query(
        'SELECT * FROM food_listings WHERE id = $1 FOR UPDATE',
        [reservationData.listing_id]
      );

      const listing = listingResult.rows[0];
      if (!listing) {
        throw new NotFoundError('Listing not found');
      }

      if (listing.status !== 'active') {
        throw new BadRequestError('Listing is not available for reservation');
      }

      const availableQuantity = listing.quantity_available - listing.quantity_reserved;
      if (availableQuantity < reservationData.quantity) {
        throw new BadRequestError(
          `Only ${availableQuantity} items available, requested ${reservationData.quantity}`
        );
      }

      // Check if listing availability window has already passed
      const now = new Date();
      if (now > new Date(listing.available_until)) {
        throw new BadRequestError('Listing is no longer available — the pickup window has passed');
      }

      // Update reserved quantity
      const updatedListing = await this.listingRepository.updateReservedQuantity(
        reservationData.listing_id,
        reservationData.quantity,
        client
      );

      if (!updatedListing) {
        throw new BadRequestError('Failed to reserve quantity');
      }

      // Create reservation
      const reservation = await this.reservationRepository.create(
        {
          ...reservationData,
          user_id: userId,
        },
        client
      );

      // Trigger notification asynchronously (don't block transaction)
      setImmediate(async () => {
        try {
          await this.notificationService.notifyReservationConfirmed(
            userId,
            reservation.id,
            listing.title,
            reservation.confirmation_code || ''
          );
        } catch (error) {
          console.error('Failed to send reservation notification:', error);
        }
      });

      return reservation;
    });
  }

  async getReservationById(id: string, userId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.user_id !== userId) {
      throw new NotFoundError('Reservation not found');
    }

    return reservation;
  }

  async getUserReservations(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ reservations: Reservation[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.reservationRepository.findByUser(userId, {
      status: filters?.status,
      limit,
      offset,
    });
  }

  async cancelReservation(id: string, userId: string): Promise<Reservation> {
    return await transaction(async (client) => {
      const reservationResult = await client.query(
        'SELECT * FROM reservations WHERE id = $1 FOR UPDATE',
        [id]
      );

      const reservation = reservationResult.rows[0];
      if (!reservation) {
        throw new NotFoundError('Reservation not found');
      }

      if (reservation.user_id !== userId) {
        throw new NotFoundError('Reservation not found');
      }

      if (reservation.status === 'cancelled') {
        throw new BadRequestError('Reservation is already cancelled');
      }

      if (reservation.status === 'picked_up') {
        throw new BadRequestError('Cannot cancel a picked up reservation');
      }

      // Return reserved quantity to listing
      await this.listingRepository.updateReservedQuantity(
        reservation.listing_id,
        -reservation.quantity,
        client
      );

      // Update reservation status
      const updatedReservation = await this.reservationRepository.update(
        id,
        {
          status: 'cancelled',
          cancelled_at: new Date(),
        },
        client
      );

      if (!updatedReservation) {
        throw new NotFoundError('Reservation not found');
      }

      // Trigger notification asynchronously
      setImmediate(async () => {
        try {
          const listing = await this.listingRepository.findById(reservation.listing_id);
          if (listing) {
            await this.notificationService.notifyReservationCancelled(
              userId,
              id,
              listing.title
            );
          }
        } catch (error) {
          console.error('Failed to send cancellation notification:', error);
        }
      });

      return updatedReservation;
    });
  }

  async confirmPickup(id: string, confirmationCode: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    if (reservation.confirmation_code !== confirmationCode) {
      throw new BadRequestError('Invalid confirmation code');
    }

    if (reservation.status !== 'confirmed') {
      throw new BadRequestError('Reservation cannot be picked up');
    }

    const updatedReservation = await this.reservationRepository.update(id, {
      status: 'picked_up',
      picked_up_at: new Date(),
    });

    if (!updatedReservation) {
      throw new NotFoundError('Reservation not found');
    }

    // Check if all reservations for this listing are picked up
    await this.checkAndCompleteListingIfAllPickedUp(reservation.listing_id);

    // Trigger notification asynchronously
    setImmediate(async () => {
      try {
        const listing = await this.listingRepository.findById(reservation.listing_id);
        if (listing) {
          await this.notificationService.notifyPickupConfirmed(
            reservation.user_id,
            id,
            listing.title
          );
        }
      } catch (error) {
        console.error('Failed to send pickup confirmation notification:', error);
      }
    });

    return updatedReservation;
  }

  private async checkAndCompleteListingIfAllPickedUp(listingId: string): Promise<void> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      return;
    }

    // Get all reservations for this listing
    const reservations = await this.reservationRepository.findByListing(listingId);
    
    // Check if there are any reservations
    if (reservations.length === 0) {
      return;
    }

    // Check if all reservations are picked up
    const allPickedUp = reservations.every(r => r.status === 'picked_up');
    
    // Check if all available quantity is reserved
    const allReserved = listing.quantity_reserved >= listing.quantity_available;

    if (allPickedUp && allReserved) {
      await this.listingRepository.update(listingId, { status: 'completed' });
    }
  }

  async getReservationsByProvider(
    providerId: string,
    filters?: { status?: string; date?: string; page?: number; limit?: number }
  ): Promise<{ reservations: any[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    return await this.reservationRepository.findByProvider(providerId, {
      status: filters?.status,
      date: filters?.date,
      limit,
      offset,
    });
  }

  async getReservationsByListing(listingId: string): Promise<Reservation[]> {
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    return await this.reservationRepository.findByListing(listingId);
  }

  async getReservationsByStudent(
    studentId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ reservations: Reservation[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.reservationRepository.findByUser(studentId, {
      status: filters?.status,
      limit,
      offset,
    });
  }
}

