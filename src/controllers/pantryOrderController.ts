import { Response, NextFunction } from 'express';
import { PantryOrderService } from '../services/pantryOrderService';
import { AuthRequest } from '../middleware/auth';
import { successResponse, paginatedResponse } from '../utils/response';

export class PantryOrderController {
  private orderService: PantryOrderService;

  constructor() {
    this.orderService = new PantryOrderService();
  }

  getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await this.orderService.getCart(userId);
      successResponse(res, result, 'Cart retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  addItemToCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { inventory_id, quantity } = req.body;
      const result = await this.orderService.addItemToCart(userId, inventory_id, quantity);
      successResponse(res, result, 'Item added to cart successfully');
    } catch (error) {
      next(error);
    }
  };

  updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { inventory_id } = req.params;
      const { quantity } = req.body;
      const result = await this.orderService.updateCartItemQuantity(userId, inventory_id, quantity);
      successResponse(res, result, 'Cart item updated successfully');
    } catch (error) {
      next(error);
    }
  };

  removeCartItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { inventory_id } = req.params;
      const result = await this.orderService.removeItemFromCart(userId, inventory_id);
      successResponse(res, result, 'Item removed from cart successfully');
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await this.orderService.clearCart(userId);
      successResponse(res, null, 'Cart cleared successfully');
    } catch (error) {
      next(error);
    }
  };

  submitOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const order = await this.orderService.submitOrder(userId);
      successResponse(res, order, 'Order submitted successfully');
    } catch (error) {
      next(error);
    }
  };

  getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await this.orderService.getOrderById(id, userId);
      successResponse(res, result, 'Order retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { status, page = 1, limit = 20 } = req.query;

      const result = await this.orderService.getUserOrders(userId, {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
      });

      paginatedResponse(res, result.orders, Number(page), Number(limit), result.total);
    } catch (error) {
      next(error);
    }
  };
}
