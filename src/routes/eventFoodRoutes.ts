/**
 * Event Food Routes
 * Endpoints for discovering and managing event food listings
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { EventFoodController } from '../controllers/eventFoodController';

const router = Router();
const controller = new EventFoodController();

/**
 * GET /api/event-food
 * Get event food listings
 * Query params:
 *   - available_now: boolean
 *   - dietary_filters: string[] (comma-separated)
 *   - page: number
 *   - limit: number
 */
router.get('/', authenticate, controller.getEventFood);

/**
 * GET /api/event-food/today
 * Get event food available today
 */
router.get('/today', authenticate, controller.getEventFoodToday);

/**
 * GET /api/event-food/upcoming
 * Get upcoming event food
 * Query params:
 *   - days: number (default: 7)
 */
router.get('/upcoming', authenticate, controller.getUpcomingEventFood);

/**
 * GET /api/event-food/provider/:providerId
 * Get event food from a specific provider
 * Must come before /:id to avoid route conflicts
 */
router.get('/provider/:providerId', authenticate, controller.getProviderEventFood);

/**
 * GET /api/event-food/:id
 * Get event food details
 */
router.get('/:id', authenticate, controller.getEventFoodDetails);

export default router;
