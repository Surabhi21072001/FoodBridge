import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PreferenceService } from '../services/preferenceService';
import { sendSuccess, sendError } from '../utils/response';

export class PreferenceController {
  private preferenceService: PreferenceService;

  constructor() {
    this.preferenceService = new PreferenceService();
  }

  getUserPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own preferences or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const preferences = await this.preferenceService.getUserPreferences(userId);
      sendSuccess(res, 200, 'Preferences retrieved', { preferences });
    } catch (error) {
      next(error);
    }
  };

  updateUserPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Verify user is updating their own preferences or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const preferences = await this.preferenceService.updateUserPreferences(userId, updates);
      sendSuccess(res, 200, 'Preferences updated', { preferences });
    } catch (error) {
      next(error);
    }
  };

  trackPantrySelection = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { inventory_id, quantity } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 401, 'Unauthorized');
      }

      await this.preferenceService.trackPantrySelection(userId, inventory_id, quantity);
      sendSuccess(res, 201, 'Pantry selection tracked');
    } catch (error) {
      next(error);
    }
  };

  trackReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { provider_id, listing_title, category } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 401, 'Unauthorized');
      }

      await this.preferenceService.trackReservation(userId, provider_id, listing_title, category);
      sendSuccess(res, 201, 'Reservation tracked');
    } catch (error) {
      next(error);
    }
  };

  trackFilterApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filters = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 401, 'Unauthorized');
      }

      await this.preferenceService.trackFilterApplication(userId, filters);
      sendSuccess(res, 201, 'Filter application tracked');
    } catch (error) {
      next(error);
    }
  };

  getFrequentItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify user is accessing their own data or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const items = await this.preferenceService.getFrequentItems(userId, limit);
      sendSuccess(res, 200, 'Frequent items retrieved', { items });
    } catch (error) {
      next(error);
    }
  };

  getFrequentProviders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      // Verify user is accessing their own data or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const providers = await this.preferenceService.getFrequentProviders(userId, limit);
      sendSuccess(res, 200, 'Frequent providers retrieved', { providers });
    } catch (error) {
      next(error);
    }
  };

  getRecommendations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const maxItems = parseInt(req.query.max_items as string) || 10;

      // Verify user is accessing their own data or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const recommendations = await this.preferenceService.getRecommendations(userId, maxItems);
      sendSuccess(res, 200, 'Recommendations retrieved', { recommendations });
    } catch (error) {
      next(error);
    }
  };

  getPreferenceHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const eventType = req.query.event_type as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Verify user is accessing their own data or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const result = await this.preferenceService.getPreferenceHistory(userId, eventType, limit, offset);
      sendSuccess(res, 200, 'Preference history retrieved', {
        events: result.events,
        pagination: {
          total: result.total,
          page,
          limit,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
