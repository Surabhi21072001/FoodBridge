/**
 * Smart Pantry Cart Controller
 * Handles smart pantry cart generation and management endpoints
 */

import { Request, Response } from 'express';
import { SmartPantryCartService } from '../services/smartPantryCartService';

export class SmartPantryCartController {
  private cartService: SmartPantryCartService;

  constructor() {
    this.cartService = new SmartPantryCartService();
  }

  /**
   * Generate a smart pantry cart
   * GET /api/pantry/cart/generate
   */
  generateSmartCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const includeFrequent = req.query.include_frequent !== 'false';
      const respectPreferences = req.query.respect_preferences !== 'false';
      const maxItems = parseInt(req.query.max_items as string) || 10;

      const result = await this.cartService.generateSmartCart(userId, {
        include_frequent: includeFrequent,
        respect_preferences: respectPreferences,
        max_items: maxItems,
      });

      // Transform CartRecommendation to PantryItem format
      const items = result.recommendedItems.map((rec: any) => ({
        item_id: rec.item_id,
        item_name: rec.item_name,
        category: rec.category,
        quantity: rec.quantity,
        in_stock: true,
        unit: rec.unit,
        dietary_tags: [],
        allergen_info: [],
      }));

      res.status(200).json({
        success: true,
        data: {
          items,
          totalItems: result.totalItems,
          generatedAt: result.generatedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate smart cart',
      });
    }
  };

  /**
   * Generate a smart pantry cart and add items to cart
   * POST /api/pantry/cart/generate-and-add
   */
  generateAndAddToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { include_frequent, respect_preferences, max_items } = req.body;

      const result = await this.cartService.generateAndAddToCart(userId, {
        include_frequent: include_frequent !== false,
        respect_preferences: respect_preferences !== false,
        max_items: max_items || 10,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Added ${result.totalItems} items to your cart`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate and add items to cart',
      });
    }
  };

  /**
   * Get user's usual pantry items
   * GET /api/pantry/cart/usual-items
   */
  getUserUsualItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;

      const items = await this.cartService.getUserUsualItems(userId, limit);

      res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get usual items',
      });
    }
  };

  /**
   * Get preference-based recommendations
   * GET /api/pantry/cart/preference-based
   */
  getPreferenceBasedRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;

      const items = await this.cartService.getPreferenceBasedRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get preference-based recommendations',
      });
    }
  };

  /**
   * Get popular pantry items
   * GET /api/pantry/cart/popular
   */
  getPopularItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const items = await this.cartService.getPopularItems(limit);

      res.status(200).json({
        success: true,
        data: {
          items,
          count: items.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get popular items',
      });
    }
  };

  /**
   * Get cart generation suggestion
   * GET /api/pantry/cart/suggestion
   */
  getCartSuggestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const suggestion = await this.cartService.getCartSuggestion(userId);

      res.status(200).json({
        success: true,
        data: {
          suggestion,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get cart suggestion',
      });
    }
  };
}
