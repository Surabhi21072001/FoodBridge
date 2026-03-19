import { Router } from 'express';
import { VolunteerController } from '../controllers/volunteerController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { createOpportunitySchema, signupSchema } from '../validators/volunteerValidators';

const router = Router();
const volunteerController = new VolunteerController();

// Public routes - list all opportunities
router.get('/opportunities', volunteerController.listOpportunities);

// Admin routes - create opportunity
router.post(
  '/opportunities',
  authenticate,
  authorize('admin'),
  validate(createOpportunitySchema),
  volunteerController.createOpportunity
);

// Admin routes - get participants for an opportunity (specific route before generic :id)
router.get(
  '/opportunities/:opportunityId/participants',
  authenticate,
  authorize('admin'),
  volunteerController.getOpportunityParticipants
);

// Public routes - get specific opportunity (generic route after specific routes)
router.get('/opportunities/:id', volunteerController.getOpportunity);

// Admin routes - update opportunity
router.put(
  '/opportunities/:id',
  authenticate,
  authorize('admin'),
  volunteerController.updateOpportunity
);

// Student routes - signup for opportunity
router.post(
  '/signup',
  authenticate,
  authorize('student'),
  validate(signupSchema),
  volunteerController.signupForOpportunity
);

// Student routes - cancel signup
router.delete(
  '/signup/:id',
  authenticate,
  authorize('student'),
  volunteerController.cancelSignup
);

// Student routes - get participation history
router.get(
  '/participation/:studentId',
  authenticate,
  volunteerController.getStudentParticipation
);

export default router;
