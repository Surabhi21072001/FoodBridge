import { Router } from 'express';
import { PreferenceController } from '../controllers/preferenceController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { updatePreferencesSchema } from '../validators/preferenceValidators';

const router = Router();
const preferenceController = new PreferenceController();

// Get user preferences
router.get('/user/:userId', authenticate, preferenceController.getUserPreferences);

// Update user preferences
router.put('/user/:userId', authenticate, validate(updatePreferencesSchema), preferenceController.updateUserPreferences);

// Track pantry selection
router.post('/track/pantry-selection', authenticate, preferenceController.trackPantrySelection);

// Track reservation
router.post('/track/reservation', authenticate, preferenceController.trackReservation);

// Track filter application
router.post('/track/filter', authenticate, preferenceController.trackFilterApplication);

// Get frequent items
router.get('/frequent-items/:userId', authenticate, preferenceController.getFrequentItems);

// Get frequent providers
router.get('/frequent-providers/:userId', authenticate, preferenceController.getFrequentProviders);

// Get recommendations
router.get('/recommendations/:userId', authenticate, preferenceController.getRecommendations);

// Get preference history
router.get('/history/:userId', authenticate, preferenceController.getPreferenceHistory);

export default router;
