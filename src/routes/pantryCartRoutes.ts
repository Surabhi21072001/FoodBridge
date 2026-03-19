/**
 * Pantry Cart Routes
 * Endpoints for smart pantry cart generation and management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SmartPantryCartController } from '../controllers/smartPantryCartController';

const router = Router();
const controller = new SmartPantryCartController();

/**
 * GET /api/pantry/cart/generate
 * Generate a smart pantry cart based on user history and preferences
 * Query params:
 *   - include_frequent: boolean (default: true)
 *   - respect_preferences: boolean (default: true)
 *   - max_items: number (default: 10)
 */
router.get('/generate', authenticate, controller.generateSmartCart);

/**
 * POST /api/pantry/cart/generate-and-add
 * Generate a smart pantry cart and add items to the user's cart
 * Body:
 *   - include_frequent: boolean (default: true)
 *   - respect_preferences: boolean (default: true)
 *   - max_items: number (default: 10)
 */
router.post('/generate-and-add', authenticate, controller.generateAndAddToCart);

/**
 * GET /api/pantry/cart/usual-items
 * Get user's usual pantry items
 * Query params:
 *   - limit: number (default: 10)
 */
router.get('/usual-items', authenticate, controller.getUserUsualItems);

/**
 * GET /api/pantry/cart/preference-based
 * Get recommendations based on user preferences
 * Query params:
 *   - limit: number (default: 10)
 */
router.get('/preference-based', authenticate, controller.getPreferenceBasedRecommendations);

/**
 * GET /api/pantry/cart/popular
 * Get popular pantry items
 * Query params:
 *   - limit: number (default: 10)
 */
router.get('/popular', authenticate, controller.getPopularItems);

/**
 * GET /api/pantry/cart/suggestion
 * Get a suggestion for cart generation
 */
router.get('/suggestion', authenticate, controller.getCartSuggestion);

export default router;
