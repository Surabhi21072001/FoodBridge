import { Router } from 'express';
import { ReservationController } from '../controllers/reservationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  createReservationSchema,
  confirmPickupSchema,
  reservationIdSchema,
  listReservationsSchema,
} from '../validators/reservationValidators';

const router = Router();
const reservationController = new ReservationController();

// Student routes
router.post(
  '/',
  authenticate,
  authorize('student'),
  validate(createReservationSchema),
  reservationController.createReservation
);

router.get(
  '/',
  authenticate,
  authorize('student'),
  validate(listReservationsSchema),
  reservationController.getUserReservations
);

// Get reservations by student ID (admin/provider can view)
router.get(
  '/student/:id',
  authenticate,
  reservationController.getReservationsByStudent
);

// Get all reservations for the authenticated provider
router.get(
  '/provider/all',
  authenticate,
  authorize('provider'),
  reservationController.getProviderReservations
);

// Get reservations by listing ID (provider can view their listing's reservations)
router.get(
  '/listing/:id',
  authenticate,
  reservationController.getReservationsByListing
);

router.get(
  '/:id',
  authenticate,
  authorize('student'),
  validate(reservationIdSchema),
  reservationController.getReservation
);

router.delete(
  '/:id',
  authenticate,
  authorize('student'),
  validate(reservationIdSchema),
  reservationController.cancelReservation
);

// Provider/Student route for pickup confirmation
router.post(
  '/:id/confirm-pickup',
  authenticate,
  validate(confirmPickupSchema),
  reservationController.confirmPickup
);

export default router;
