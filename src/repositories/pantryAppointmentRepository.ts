import { query } from '../config/database';
import { PantryAppointment } from '../types';

export class PantryAppointmentRepository {
  async findById(id: string): Promise<PantryAppointment | null> {
    const result = await query('SELECT * FROM pantry_appointments WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(appointmentData: {
    user_id: string;
    appointment_time: Date;
    duration_minutes?: number;
    notes?: string;
  }): Promise<PantryAppointment> {
    const result = await query(
      `INSERT INTO pantry_appointments (
        user_id, appointment_time, duration_minutes, notes, status
      ) VALUES ($1, $2, $3, $4, 'scheduled')
      RETURNING *`,
      [
        appointmentData.user_id,
        appointmentData.appointment_time,
        appointmentData.duration_minutes || 30,
        appointmentData.notes,
      ]
    );
    return result.rows[0];
  }

  async update(id: string, updates: Partial<PantryAppointment>): Promise<PantryAppointment | null> {
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
      `UPDATE pantry_appointments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async findByUser(
    userId: string,
    filters?: {
      status?: string;
      upcoming?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ appointments: PantryAppointment[]; total: number }> {
    let queryText = 'SELECT * FROM pantry_appointments WHERE user_id = $1';
    const params: any[] = [userId];
    let paramCount = 2;

    if (filters?.status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.upcoming) {
      queryText += ` AND appointment_time > NOW()`;
    }

    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ' ORDER BY appointment_time ASC';

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

    return { appointments: result.rows, total };
  }

  async checkConflictingAppointment(
    appointmentTime: Date,
    durationMinutes: number,
    excludeId?: string
  ): Promise<boolean> {
    const endTime = new Date(appointmentTime.getTime() + durationMinutes * 60000);
    
    let queryText = `
      SELECT id FROM pantry_appointments
      WHERE status IN ('scheduled', 'confirmed')
      AND (
        (appointment_time <= $1 AND appointment_time + (duration_minutes || ' minutes')::INTERVAL > $1)
        OR (appointment_time < $2 AND appointment_time + (duration_minutes || ' minutes')::INTERVAL >= $2)
        OR (appointment_time >= $1 AND appointment_time < $2)
      )
    `;
    
    const params: any[] = [appointmentTime, endTime];

    if (excludeId) {
      queryText += ' AND id != $3';
      params.push(excludeId);
    }

    const result = await query(queryText, params);
    return result.rows.length > 0;
  }

  async findAll(filters?: {
    status?: string;
    date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: PantryAppointment[]; total: number }> {
    let queryText = 'SELECT * FROM pantry_appointments WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      queryText += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters?.date) {
      queryText += ` AND DATE(appointment_time) = $${paramCount}`;
      params.push(filters.date);
      paramCount++;
    }

    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ' ORDER BY appointment_time ASC';

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

    return { appointments: result.rows, total };
  }
}
