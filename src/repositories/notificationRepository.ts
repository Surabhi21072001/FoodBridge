import { query } from '../config/database';
import { Notification } from '../types';

export class NotificationRepository {
  async findById(id: string): Promise<Notification | null> {
    const result = await query('SELECT * FROM notifications WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(notificationData: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    related_entity_type?: string;
    related_entity_id?: string;
  }): Promise<Notification> {
    const result = await query(
      `INSERT INTO notifications (
        user_id, type, title, message, related_entity_type, related_entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        notificationData.user_id,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.related_entity_type,
        notificationData.related_entity_id,
      ]
    );
    return result.rows[0];
  }

  async findByUser(
    userId: string,
    filters?: {
      is_read?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    let queryText = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];
    let paramCount = 2;

    if (filters?.is_read !== undefined) {
      queryText += ` AND is_read = $${paramCount}`;
      params.push(filters.is_read);
      paramCount++;
    }

    if (filters?.type) {
      queryText += ` AND type = $${paramCount}`;
      params.push(filters.type);
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

    return { notifications: result.rows, total };
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const result = await query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return result.rowCount || 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM notifications WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}
