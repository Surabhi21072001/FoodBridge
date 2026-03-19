import { Response, NextFunction } from 'express';
import { ReservationService } from '../services/reservationService';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';

export class ReservationController {
  private reservationService: ReservationService;

  constructor() {
    this.reservationService = new ReservationService();
  }

  createReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const reservation = await this.reservationService.createReservation(userId, req.body);
      successResponse(res, reservation, 'Reservation created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const reservation = await this.reservationService.getReservationById(id, userId);
      successResponse(res, reservation, 'Reservation retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await this.reservationService.getUserReservations(userId, {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.reservations, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  cancelReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const reservation = await this.reservationService.cancelReservation(id, userId);
      successResponse(res, reservation, 'Reservation cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  confirmPickup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { confirmation_code } = req.body;
      const reservation = await this.reservationService.confirmPickup(id, confirmation_code);
      successResponse(res, reservation, 'Pickup confirmed successfully');
    } catch (error) {
      next(error);
    }
  };

  getProviderReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const providerId = req.user!.id;
      const { status, date, page = 1, limit = 20 } = req.query;
      const result = await this.reservationService.getReservationsByProvider(providerId, {
        status: status as string,
        date: date as string,
        page: Number(page),
        limit: Number(limit),
      });
      paginatedResponse(res, result.reservations, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  getReservationsByListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reservations = await this.reservationService.getReservationsByListing(id);
      successResponse(res, reservations, 'Reservations retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getReservationsByStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await this.reservationService.getReservationsByStudent(id, {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.reservations, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };
}

