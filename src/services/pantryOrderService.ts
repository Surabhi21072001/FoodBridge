import { PantryOrderRepository } from '../repositories/pantryOrderRepository';
import { PantryInventoryRepository } from '../repositories/pantryInventoryRepository';
import { transaction } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { PantryOrder, PantryOrderItem } from '../types';

export class PantryOrderService {
  private orderRepository: PantryOrderRepository;
  private inventoryRepository: PantryInventoryRepository;

  constructor() {
    this.orderRepository = new PantryOrderRepository();
    this.inventoryRepository = new PantryInventoryRepository();
  }

  async getOrCreateCart(userId: string, appointmentId?: string): Promise<PantryOrder> {
    let cart = await this.orderRepository.getActiveCart(userId);
    
    if (!cart) {
      cart = await this.orderRepository.create({
        user_id: userId,
        appointment_id: appointmentId,
      });
    }

    return cart;
  }

  async getCart(userId: string): Promise<{ order: PantryOrder; items: PantryOrderItem[] }> {
    const cart = await this.orderRepository.getActiveCart(userId);
    if (!cart) {
      throw new NotFoundError('No active cart found');
    }

    const items = await this.orderRepository.getOrderItems(cart.id);

    return { order: cart, items };
  }

  async addItemToCart(
    userId: string,
    inventoryId: string,
    quantity: number
  ): Promise<{ order: PantryOrder; items: PantryOrderItem[] }> {
    if (quantity <= 0) {
      throw new BadRequestError('Quantity must be positive');
    }

    const item = await this.inventoryRepository.findById(inventoryId);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (item.quantity < quantity) {
      throw new BadRequestError(`Only ${item.quantity} ${item.unit}(s) available`);
    }

    const cart = await this.getOrCreateCart(userId);

    await this.orderRepository.addItem(cart.id, inventoryId, quantity);

    // Update total items count
    const items = await this.orderRepository.getOrderItems(cart.id);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    await this.orderRepository.update(cart.id, { total_items: totalItems });

    return { order: cart, items };
  }

  async removeItemFromCart(
    userId: string,
    inventoryId: string
  ): Promise<{ order: PantryOrder; items: PantryOrderItem[] }> {
    const cart = await this.orderRepository.getActiveCart(userId);
    if (!cart) {
      throw new NotFoundError('No active cart found');
    }

    await this.orderRepository.removeItem(cart.id, inventoryId);

    // Update total items count
    const items = await this.orderRepository.getOrderItems(cart.id);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    await this.orderRepository.update(cart.id, { total_items: totalItems });

    return { order: cart, items };
  }

  async updateCartItemQuantity(
    userId: string,
    inventoryId: string,
    quantity: number
  ): Promise<{ order: PantryOrder; items: PantryOrderItem[] }> {
    if (quantity <= 0) {
      throw new BadRequestError('Quantity must be positive');
    }

    const cart = await this.orderRepository.getActiveCart(userId);
    if (!cart) {
      throw new NotFoundError('No active cart found');
    }

    const item = await this.inventoryRepository.findById(inventoryId);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (item.quantity < quantity) {
      throw new BadRequestError(`Only ${item.quantity} ${item.unit}(s) available`);
    }

    await this.orderRepository.updateItemQuantity(cart.id, inventoryId, quantity);

    // Update total items count
    const items = await this.orderRepository.getOrderItems(cart.id);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    await this.orderRepository.update(cart.id, { total_items: totalItems });

    return { order: cart, items };
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.orderRepository.getActiveCart(userId);
    if (!cart) {
      throw new NotFoundError('No active cart found');
    }

    await this.orderRepository.clearCart(cart.id);
    await this.orderRepository.update(cart.id, { total_items: 0 });
  }

  async submitOrder(userId: string): Promise<PantryOrder> {
    return await transaction(async (client) => {
      const cart = await this.orderRepository.getActiveCart(userId);
      if (!cart) {
        throw new NotFoundError('No active cart found');
      }

      const items = await this.orderRepository.getOrderItems(cart.id);
      if (items.length === 0) {
        throw new BadRequestError('Cart is empty');
      }

      // Validate and deduct inventory
      for (const item of items) {
        const inventoryItem = await this.inventoryRepository.findById(item.inventory_id);
        if (!inventoryItem) {
          throw new NotFoundError(`Inventory item ${item.inventory_id} not found`);
        }

        if (inventoryItem.quantity < item.quantity) {
          throw new BadRequestError(
            `Insufficient quantity for ${inventoryItem.item_name}. Available: ${inventoryItem.quantity}`
          );
        }

        // Deduct from inventory
        const updated = await this.inventoryRepository.updateQuantity(
          item.inventory_id,
          -item.quantity
        );

        if (!updated) {
          throw new BadRequestError(`Failed to update inventory for ${inventoryItem.item_name}`);
        }
      }

      // Update order status
      const submittedOrder = await this.orderRepository.update(
        cart.id,
        {
          status: 'submitted',
          submitted_at: new Date(),
        },
        client
      );

      if (!submittedOrder) {
        throw new NotFoundError('Order not found');
      }

      return submittedOrder;
    });
  }

  async getOrderById(id: string, userId: string): Promise<{ order: PantryOrder; items: PantryOrderItem[] }> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.user_id !== userId) {
      throw new NotFoundError('Order not found');
    }

    const items = await this.orderRepository.getOrderItems(id);

    return { order, items };
  }

  async getUserOrders(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ orders: PantryOrder[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.orderRepository.findByUser(userId, {
      status: filters?.status,
      limit,
      offset,
    });
  }
}
