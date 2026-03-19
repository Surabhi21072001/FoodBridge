import { query } from '../config/database';
import { PantryOrder, PantryOrderItem } from '../types';
import { PoolClient } from 'pg';

export class PantryOrderRepository {
  async findById(id: string): Promise<PantryOrder | null> {
    const result = await query('SELECT * FROM pantry_orders WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(orderData: {
    user_id: string;
    appointment_id?: string;
  }): Promise<PantryOrder> {
    const result = await query(
      `INSERT INTO pantry_orders (user_id, appointment_id, status)
       VALUES ($1, $2, 'cart')
       RETURNING *`,
      [orderData.user_id, orderData.appointment_id]
    );
    return result.rows[0];
  }

  async update(
    id: string,
    updates: Partial<PantryOrder>,
    client?: PoolClient
  ): Promise<PantryOrder | null> {
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
    const queryText = `UPDATE pantry_orders SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = client
      ? await client.query(queryText, values)
      : await query(queryText, values);

    return result.rows[0] || null;
  }

  async findByUser(
    userId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ orders: PantryOrder[]; total: number }> {
    let queryText = 'SELECT * FROM pantry_orders WHERE user_id = $1';
    const params: any[] = [userId];
    let paramCount = 2;

    if (filters?.status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ' ORDER BY created_at DESC';

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

    return { orders: result.rows, total };
  }

  async getActiveCart(userId: string): Promise<PantryOrder | null> {
    const result = await query(
      `SELECT * FROM pantry_orders 
       WHERE user_id = $1 AND status = 'cart'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  // Order Items
  async addItem(
    orderId: string,
    inventoryId: string,
    quantity: number,
    client?: PoolClient
  ): Promise<PantryOrderItem> {
    const queryText = `
      INSERT INTO pantry_order_items (order_id, inventory_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (order_id, inventory_id) 
      DO UPDATE SET quantity = pantry_order_items.quantity + $3
      RETURNING *
    `;

    const result = client
      ? await client.query(queryText, [orderId, inventoryId, quantity])
      : await query(queryText, [orderId, inventoryId, quantity]);

    return result.rows[0];
  }

  async getOrderItems(orderId: string): Promise<PantryOrderItem[]> {
    const result = await query(
      `SELECT poi.*, pi.item_name, pi.category, pi.unit
       FROM pantry_order_items poi
       JOIN pantry_inventory pi ON poi.inventory_id = pi.id
       WHERE poi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  }

  async removeItem(orderId: string, inventoryId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM pantry_order_items WHERE order_id = $1 AND inventory_id = $2',
      [orderId, inventoryId]
    );
    return (result.rowCount || 0) > 0;
  }

  async updateItemQuantity(
    orderId: string,
    inventoryId: string,
    quantity: number
  ): Promise<PantryOrderItem | null> {
    const result = await query(
      `UPDATE pantry_order_items 
       SET quantity = $3
       WHERE order_id = $1 AND inventory_id = $2
       RETURNING *`,
      [orderId, inventoryId, quantity]
    );
    return result.rows[0] || null;
  }

  async clearCart(orderId: string): Promise<void> {
    await query('DELETE FROM pantry_order_items WHERE order_id = $1', [orderId]);
  }
}
