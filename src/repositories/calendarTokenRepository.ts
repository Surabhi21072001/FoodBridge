import { query } from '../config/database';

export interface CalendarTokenRecord {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  isConnected: boolean;
}

export class CalendarTokenRepository {
  async upsert(record: CalendarTokenRecord): Promise<void> {
    await query(
      `INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, expires_at, is_connected)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         is_connected = EXCLUDED.is_connected,
         updated_at = NOW()`,
      [record.userId, record.accessToken, record.refreshToken, record.expiresAt, record.isConnected]
    );
  }

  async findByUserId(userId: string): Promise<CalendarTokenRecord | null> {
    const result = await query(
      `SELECT user_id, access_token, refresh_token, expires_at, is_connected
       FROM google_calendar_tokens
       WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: new Date(row.expires_at),
      isConnected: row.is_connected,
    };
  }

  async updateAccessToken(
    userId: string,
    accessToken: string,
    expiresAt: Date,
    isConnected?: boolean
  ): Promise<void> {
    const fields = ['access_token = $2', 'expires_at = $3', 'updated_at = NOW()'];
    const params: any[] = [userId, accessToken, expiresAt];

    if (isConnected !== undefined) {
      fields.push(`is_connected = $${params.length + 1}`);
      params.push(isConnected);
    }

    await query(
      `UPDATE google_calendar_tokens SET ${fields.join(', ')} WHERE user_id = $1`,
      params
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await query(
      `DELETE FROM google_calendar_tokens WHERE user_id = $1`,
      [userId]
    );
  }
}
