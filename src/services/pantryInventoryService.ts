import { PantryInventoryRepository } from '../repositories/pantryInventoryRepository';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { PantryInventory } from '../types';

export class PantryInventoryService {
  private inventoryRepository: PantryInventoryRepository;

  constructor() {
    this.inventoryRepository = new PantryInventoryRepository();
  }

  async createItem(itemData: {
    item_name: string;
    category: string;
    quantity: number;
    unit?: string;
    expiration_date?: Date;
    dietary_tags?: string[];
    allergen_info?: string[];
    location?: string;
    reorder_threshold?: number;
  }): Promise<PantryInventory> {
    if (itemData.quantity < 0) {
      throw new BadRequestError('Quantity cannot be negative');
    }

    return await this.inventoryRepository.create(itemData);
  }

  async getItemById(id: string): Promise<PantryInventory> {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }
    return item;
  }

  async updateItem(
    id: string,
    updates: Partial<PantryInventory>
  ): Promise<PantryInventory> {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (updates.quantity !== undefined && updates.quantity < 0) {
      throw new BadRequestError('Quantity cannot be negative');
    }

    const updatedItem = await this.inventoryRepository.update(id, updates);
    if (!updatedItem) {
      throw new NotFoundError('Inventory item not found');
    }

    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    const deleted = await this.inventoryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Inventory item not found');
    }
  }

  async listItems(filters?: {
    category?: string;
    low_stock?: boolean;
    dietary_tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ items: PantryInventory[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    return await this.inventoryRepository.findAll({
      category: filters?.category,
      low_stock: filters?.low_stock,
      dietary_tags: filters?.dietary_tags,
      limit,
      offset,
    });
  }

  async adjustQuantity(id: string, quantityChange: number): Promise<PantryInventory> {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (item.quantity + quantityChange < 0) {
      throw new BadRequestError('Insufficient quantity available');
    }

    const updatedItem = await this.inventoryRepository.updateQuantity(id, quantityChange);
    if (!updatedItem) {
      throw new BadRequestError('Failed to update quantity');
    }

    return updatedItem;
  }

  async getLowStockItems(): Promise<PantryInventory[]> {
    const result = await this.inventoryRepository.findAll({
      low_stock: true,
      limit: 100,
    });
    return result.items;
  }
}
