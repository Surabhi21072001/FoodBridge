import { Response, NextFunction } from 'express';
import { PantryInventoryService } from '../services/pantryInventoryService';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';

export class PantryInventoryController {
  private inventoryService: PantryInventoryService;

  constructor() {
    this.inventoryService = new PantryInventoryService();
  }

  createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const item = await this.inventoryService.createItem(req.body);
      successResponse(res, item, 'Inventory item created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.inventoryService.getItemById(id);
      successResponse(res, item, 'Inventory item retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.inventoryService.updateItem(id, req.body);
      successResponse(res, item, 'Inventory item updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.inventoryService.deleteItem(id);
      successResponse(res, null, 'Inventory item deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  listItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { category, low_stock, dietary_tags, page = 1, limit = 50 } = req.query;

      const result = await this.inventoryService.listItems({
        category: category as string,
        low_stock: low_stock === 'true',
        dietary_tags: dietary_tags as string[],
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.items, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };

  adjustQuantity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { quantity_change } = req.body;
      const item = await this.inventoryService.adjustQuantity(id, quantity_change);
      successResponse(res, item, 'Quantity adjusted successfully');
    } catch (error) {
      next(error);
    }
  };

  getLowStockItems = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = await this.inventoryService.getLowStockItems();
      successResponse(res, items, 'Low stock items retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
