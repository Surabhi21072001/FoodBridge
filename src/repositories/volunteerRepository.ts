import { query } from '../config/database';

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description?: string;
  max_volunteers: number;
  current_volunteers: number;
  event_date: Date;
  status: 'open' | 'closed' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface VolunteerParticipation {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: 'signed_up' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export class VolunteerRepository {
  async findOpportunityById(id: string): Promise<VolunteerOpportunity | null> {
    const result = await query(
      `SELECT id as opportunity_id, title, description, 
        slots_available as max_volunteers, slots_filled as current_volunteers, 
        shift_date as event_date,
        CASE WHEN slots_filled >= slots_available THEN 'closed' ELSE 'open' END as status,
        created_at, updated_at 
       FROM volunteer_shifts WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createOpportunity(data: Omit<VolunteerOpportunity, 'id' | 'created_at' | 'updated_at' | 'current_volunteers'>): Promise<VolunteerOpportunity> {
    const result = await query(
      `INSERT INTO volunteer_shifts (title, description, slots_available, shift_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id as opportunity_id, title, description, slots_available as max_volunteers, slots_filled as current_volunteers, shift_date as event_date, CASE WHEN slots_filled >= slots_available THEN 'closed' ELSE 'open' END as status, created_at, updated_at`,
      [data.title, data.description, data.max_volunteers, data.event_date]
    );
    return result.rows[0];
  }

  async updateOpportunity(id: string, updates: Partial<VolunteerOpportunity>): Promise<VolunteerOpportunity | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.max_volunteers !== undefined) {
      fields.push(`slots_available = $${paramCount++}`);
      values.push(updates.max_volunteers);
    }

    if (fields.length === 0) {
      return this.findOpportunityById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE volunteer_shifts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id as opportunity_id, title, description, slots_available as max_volunteers, slots_filled as current_volunteers, shift_date as event_date, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async findAllOpportunities(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ opportunities: VolunteerOpportunity[]; total: number }> {
    // Note: status filtering is not supported as the database doesn't have a status column
    const countResult = await query(
      `SELECT COUNT(*) as total FROM volunteer_shifts`
    );

    const result = await query(
      `SELECT id as opportunity_id, title, description, 
        slots_available as max_volunteers, slots_filled as current_volunteers, 
        shift_date as event_date,
        CASE WHEN slots_filled >= slots_available THEN 'closed' ELSE 'open' END as status,
        created_at, updated_at 
       FROM volunteer_shifts ORDER BY shift_date DESC LIMIT $1 OFFSET $2`,
      [filters?.limit || 20, filters?.offset || 0]
    );

    return {
      opportunities: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async createParticipation(data: Omit<VolunteerParticipation, 'id' | 'created_at' | 'updated_at'>): Promise<VolunteerParticipation> {
    const result = await query(
      `INSERT INTO volunteer_signups (shift_id, user_id, status)
       VALUES ($1, $2, $3)
       RETURNING id as participation_id, shift_id as opportunity_id, user_id as student_id, status, created_at, updated_at`,
      [data.opportunity_id, data.student_id, data.status || 'signed_up']
    );
    return result.rows[0];
  }

  async findParticipationById(id: string): Promise<VolunteerParticipation | null> {
    const result = await query(
      'SELECT id as participation_id, shift_id as opportunity_id, user_id as student_id, status, created_at, updated_at FROM volunteer_signups WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findParticipationByOpportunityAndStudent(opportunityId: string, studentId: string): Promise<VolunteerParticipation | null> {
    const result = await query(
      'SELECT id as participation_id, shift_id as opportunity_id, user_id as student_id, status, created_at, updated_at FROM volunteer_signups WHERE shift_id = $1 AND user_id = $2',
      [opportunityId, studentId]
    );
    return result.rows[0] || null;
  }

  async findParticipationsByStudent(studentId: string, filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ participations: VolunteerParticipation[]; total: number }> {
    let whereClause = 'WHERE vs.user_id = $1';
    const params: any[] = [studentId];
    let paramIndex = 2;

    if (filters?.status) {
      whereClause += ` AND vs.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM volunteer_signups vs ${whereClause}`,
      params
    );

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const result = await query(
      `SELECT vs.id as participation_id, vs.shift_id as opportunity_id, vs.user_id as student_id,
        vs.status, vs.created_at, vs.updated_at,
        vsh.title as opp_title, vsh.description as opp_description,
        vsh.slots_available as opp_max_volunteers, vsh.slots_filled as opp_current_volunteers,
        vsh.shift_date as opp_event_date,
        CASE WHEN vsh.slots_filled >= vsh.slots_available THEN 'closed' ELSE 'open' END as opp_status
       FROM volunteer_signups vs
       LEFT JOIN volunteer_shifts vsh ON vs.shift_id = vsh.id
       ${whereClause} ORDER BY vs.created_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, filters?.limit || 20, filters?.offset || 0]
    );

    const participations = result.rows.map((row: any) => ({
      participation_id: row.participation_id,
      opportunity_id: row.opportunity_id,
      student_id: row.student_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      opportunity: row.opp_title ? {
        opportunity_id: row.opportunity_id,
        title: row.opp_title,
        description: row.opp_description,
        max_volunteers: row.opp_max_volunteers,
        current_volunteers: row.opp_current_volunteers,
        event_date: row.opp_event_date,
        status: row.opp_status,
        created_at: row.created_at,
      } : undefined,
    }));

    return {
      participations,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async findParticipationsByOpportunity(opportunityId: string): Promise<VolunteerParticipation[]> {
    const result = await query(
      'SELECT id as participation_id, shift_id as opportunity_id, user_id as student_id, status, created_at, updated_at FROM volunteer_signups WHERE shift_id = $1 ORDER BY created_at DESC',
      [opportunityId]
    );
    return result.rows;
  }

  async updateParticipation(id: string, updates: Partial<VolunteerParticipation>): Promise<VolunteerParticipation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return this.findParticipationById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE volunteer_signups SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id as participation_id, shift_id as opportunity_id, user_id as student_id, status, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteParticipation(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM volunteer_signups WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  }

  async incrementVolunteerCount(opportunityId: string): Promise<void> {
    await query(
      'UPDATE volunteer_shifts SET slots_filled = slots_filled + 1 WHERE id = $1',
      [opportunityId]
    );
  }

  async decrementVolunteerCount(opportunityId: string): Promise<void> {
    await query(
      'UPDATE volunteer_shifts SET slots_filled = GREATEST(0, slots_filled - 1) WHERE id = $1',
      [opportunityId]
    );
  }
}
