import { Router } from 'express';
import { PantryAppointmentController } from '../controllers/pantryAppointmentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentIdSchema,
  listAppointmentsSchema,
} from '../validators/pantryAppointmentValidators';

const router = Router();
const appointmentController = new PantryAppointmentController();

// Student/Provider routes
router.post(
  '/',
  authenticate,
  authorize('student', 'provider'),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get(
  '/',
  authenticate,
  authorize('student', 'provider'),
  validate(listAppointmentsSchema),
  appointmentController.getUserAppointments
);

// Public/Student routes - get available slots (must come before /:id routes)
router.get('/slots', appointmentController.getAvailableSlots);

// Get appointments by student ID (admin/staff can view)
router.get(
  '/student/:id',
  authenticate,
  appointmentController.getAppointmentsByStudent
);

// cancel-by-datetime must come before /:id to avoid param capture
router.delete(
  '/cancel-by-datetime',
  authenticate,
  authorize('student', 'provider'),
  appointmentController.cancelAppointmentByDateTime
);

// ID-based routes (must come last)
router.get(
  '/:id',
  authenticate,
  authorize('student', 'provider'),
  validate(appointmentIdSchema),
  appointmentController.getAppointment
);

router.put(
  '/:id',
  authenticate,
  authorize('student', 'provider'),
  validate(appointmentIdSchema),
  validate(updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.delete(
  '/:id',
  authenticate,
  authorize('student', 'provider'),
  validate(appointmentIdSchema),
  appointmentController.cancelAppointment
);

// Admin routes
router.get(
  '/admin/all',
  authenticate,
  authorize('admin'),
  validate(listAppointmentsSchema),
  appointmentController.listAllAppointments
);

export default router;
