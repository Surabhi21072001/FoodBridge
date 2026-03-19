import { query } from '../config/database';

export interface UserPreference {
  id: string;
  user_id: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  favorite_cuisines?: string[];
  preferred_providers?: string[];
  notification_preferences?: Record<string, boolean>;
  created_at: Date;
  updated_at: Date;
}

export interface PreferenceHistory {
  id: string;
  user_id: string;
  event_type: string; // 'pantry_selection', 'reservation', 'filter_applied'
  event_data: Record<string, any>;
  created_at: Date;
}

export class PreferenceRepository {
  async findByUserId(userId: string): Promise<UserPreference | null> {
    const result = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async create(data: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference> {
    const result = await query(
      `INSERT INTO user_preferences (user_id, dietary_restrictions, allergies, favorite_cuisines, preferred_providers, notification_preferences)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.dietary_restrictions || [],
        data.allergies || [],
        data.favorite_cuisines || [],
        data.preferred_providers || [],
        JSON.stringify(data.notification_preferences || {}),
      ]
    );
    return result.rows[0];
  }

  async update(userId: string, updates: Partial<UserPreference>): Promise<UserPreference | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.dietary_restrictions !== undefined) {
      fields.push('dietary_restrictions = $' + paramCount++);
      values.push(updates.dietary_restrictions);
    }
    if (updates.allergies !== undefined) {
      fields.push('allergies = $' + paramCount++);
      values.push(updates.allergies);
    }
    if (updates.favorite_cuisines !== undefined) {
      fields.push('favorite_cuisines = $' + paramCount++);
      values.push(updates.favorite_cuisines);
    }
    if (updates.preferred_providers !== undefined) {
      fields.push('preferred_providers = $' + paramCount++);
      values.push(updates.preferred_providers);
    }
    if (updates.notification_preferences !== undefined) {
      fields.push('notification_preferences = $' + paramCount++);
      values.push(JSON.stringify(updates.notification_preferences));
    }

    if (fields.length === 0) {
      return this.findByUserId(userId);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const result = await query(
      'UPDATE user_preferences SET ' + fields.join(', ') + ' WHERE user_id = $' + paramCount + ' RETURNING *',
      values
    );

    return result.rows[0] || null;
  }

  async recordEvent(event: Omit<PreferenceHistory, 'id' | 'created_at'>): Promise<PreferenceHistory> {
    const result = await query(
      `INSERT INTO preference_history (user_id, event_type, event_data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [event.user_id, event.event_type, JSON.stringify(event.event_data)]
    );
    return result.rows[0];
  }

  async getFrequentItems(userId: string, limit: number = 10): Promise<any[]> {
    const result = await query(
      `SELECT 
         ph.event_data->>'inventory_id' as inventory_id,
         COALESCE(pi.item_name, ph.event_data->>'item_name', 'Unknown Item') as item_name,
         pi.category,
         COUNT(*) as frequency
       FROM preference_history ph
       LEFT JOIN pantry_inventory pi ON pi.id = (ph.event_data->>'inventory_id')::uuid
       WHERE ph.user_id = $1 AND ph.event_type = 'pantry_selection'
       GROUP BY ph.event_data->>'inventory_id', pi.item_name, ph.event_data->>'item_name', pi.category
       ORDER BY frequency DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async getFrequentProviders(userId: string, limit: number = 5): Promise<any[]> {
    const result = await query(
      `SELECT 
         event_data->>'provider_id' as provider_id,
         COUNT(*) as frequency
       FROM preference_history
       WHERE user_id = $1 AND event_type = 'reservation'
       GROUP BY event_data->>'provider_id'
       ORDER BY frequency DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async getUserPreferenceHistory(
    userId: string,
    eventType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ events: PreferenceHistory[]; total: number }> {
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (eventType) {
      whereClause += ' AND event_type = $2';
      params.push(eventType);
    }

    const countResult = await query(
      'SELECT COUNT(*) as total FROM preference_history ' + whereClause,
      params
    );

    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const result = await query(
      'SELECT * FROM preference_history ' + whereClause + ' ORDER BY created_at DESC LIMIT $' + limitParam + ' OFFSET $' + offsetParam,
      [...params, limit, offset]
    );

    return {
      events: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }
}
