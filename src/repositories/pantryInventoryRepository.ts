import { query } from '../config/database';
import { PantryInventory } from '../types';

export class PantryInventoryRepository {
  async findById(id: string): Promise<PantryInventory | null> {
    const result = await query('SELECT * FROM pantry_inventory WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(inventoryData: {
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
    const result = await query(
      `INSERT INTO pantry_inventory (
        item_name, category, quantity, unit, expiration_date,
        dietary_tags, allergen_info, location, reorder_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        inventoryData.item_name,
        inventoryData.category,
        inventoryData.quantity,
        inventoryData.unit || 'item',
        inventoryData.expiration_date,
        inventoryData.dietary_tags,
        inventoryData.allergen_info,
        inventoryData.location,
        inventoryData.reorder_threshold || 10,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, updates: Partial<PantryInventory>): Promise<PantryInventory | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE pantry_inventory SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM pantry_inventory WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  async findAll(filters?: {
    category?: string;
    low_stock?: boolean;
    dietary_tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ items: PantryInventory[]; total: number }> {
    let queryText = 'SELECT * FROM pantry_inventory WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.category) {
      queryText += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters?.low_stock) {
      queryText += ` AND quantity <= reorder_threshold`;
    }

    if (filters?.dietary_tags && filters.dietary_tags.length > 0) {
      queryText += ` AND dietary_tags && $${paramCount}`;
      params.push(filters.dietary_tags);
      paramCount++;
    }

    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ' ORDER BY item_name ASC';

    if (filters?.limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters?.offset) {
      queryText += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await query(queryText, params);

    return { items: result.rows, total };
  }

  async updateQuantity(id: string, quantityChange: number): Promise<PantryInventory | null> {
    const result = await query(
      `UPDATE pantry_inventory 
       SET quantity = quantity + $1
       WHERE id = $2 AND quantity + $1 >= 0
       RETURNING *`,
      [quantityChange, id]
    );

    return result.rows[0] || null;
  }
}
