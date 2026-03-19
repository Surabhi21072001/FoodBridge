import { query } from '../config/database';
import { Reservation } from '../types';
import { PoolClient } from 'pg';

export class ReservationRepository {
  async findById(id: string): Promise<Reservation | null> {
    const result = await query('SELECT * FROM reservations WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(
    reservationData: {
      listing_id: string;
      user_id: string;
      quantity: number;
      pickup_time?: Date;
      notes?: string;
    },
    client: PoolClient
  ): Promise<Reservation> {
    const confirmationCode = this.generateConfirmationCode();
    const result = await client.query(
      `INSERT INTO reservations (
        listing_id, user_id, quantity, pickup_time, notes, confirmation_code, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
      RETURNING *`,
      [
        reservationData.listing_id,
        reservationData.user_id,
        reservationData.quantity,
        reservationData.pickup_time,
        reservationData.notes,
        confirmationCode,
      ]
    );
    return result.rows[0];
  }

  async update(
    id: string,
    updates: Partial<Reservation>,
    client?: PoolClient
  ): Promise<Reservation | null> {
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
    const queryText = `UPDATE reservations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = client
      ? await client.query(queryText, values)
      : await query(queryText, values);

    return result.rows[0] || null;
  }

  async findByUser(
    userId: string,
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<{ reservations: Reservation[]; total: number }> {
    const params: any[] = [userId];
    let paramCount = 2;
    let whereExtra = '';

    if (filters?.status) {
      whereExtra += ` AND r.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM reservations r WHERE r.user_id = $1${whereExtra}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    let queryText = `SELECT r.*, fl.title AS listing_title FROM reservations r LEFT JOIN food_listings fl ON fl.id = r.listing_id WHERE r.user_id = $1${whereExtra} ORDER BY r.created_at DESC`;

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
    return { reservations: result.rows, total };
  }

  async findByListing(listingId: string): Promise<Reservation[]> {
    const result = await query(
      'SELECT * FROM reservations WHERE listing_id = $1 ORDER BY created_at DESC',
      [listingId]
    );
    return result.rows;
  }

  async findByProvider(
    providerId: string,
    filters?: { status?: string; date?: string; limit?: number; offset?: number }
  ): Promise<{ reservations: any[]; total: number }> {
    const params: any[] = [providerId];
    let paramCount = 2;
    let whereExtra = '';

    if (filters?.status) {
      whereExtra += ` AND r.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.date) {
      whereExtra += ` AND r.created_at::date = $${paramCount}`;
      params.push(filters.date);
      paramCount++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM reservations r
       JOIN food_listings fl ON r.listing_id = fl.id
       WHERE fl.provider_id = $1${whereExtra}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    let queryText = `
      SELECT r.*, fl.title AS listing_title, fl.category,
             u.first_name, u.last_name, u.email AS student_email
      FROM reservations r
      JOIN food_listings fl ON r.listing_id = fl.id
      JOIN users u ON r.user_id = u.id
      WHERE fl.provider_id = $1${whereExtra}
      ORDER BY r.created_at DESC`;

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
    return { reservations: result.rows, total };
  }

  async checkDuplicateReservation(userId: string, listingId: string): Promise<boolean> {
    const result = await query(
      `SELECT id FROM reservations
       WHERE user_id = $1 AND listing_id = $2
       AND status IN ('pending', 'confirmed')`,
      [userId, listingId]
    );
    return result.rows.length > 0;
  }

  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
