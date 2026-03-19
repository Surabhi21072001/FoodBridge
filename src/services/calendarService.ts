import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { CalendarTokenRepository } from '../repositories/calendarTokenRepository';
import logger from '../utils/logger';

export interface CalendarEventInput {
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export interface CreateEventResult {
  success: boolean;
  googleEventId?: string;
  error?: string;
}

export class CalendarService {
  private repo: CalendarTokenRepository;

  constructor(repo?: CalendarTokenRepository) {
    this.repo = repo ?? new CalendarTokenRepository();
  }

  private createOAuth2Client(): OAuth2Client {
    return new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async isConnected(userId: string): Promise<boolean> {
    const record = await this.repo.findByUserId(userId);
    return record?.isConnected ?? false;
  }

  async disconnectUser(userId: string): Promise<void> {
    await this.repo.deleteByUserId(userId);
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const record = await this.repo.findByUserId(userId);

    if (!record) {
      return null;
    }

    if (!record.isConnected) {
      return null;
    }

    // Token still valid — return as-is
    if (record.expiresAt > new Date()) {
      return record.accessToken;
    }

    // Token expired — attempt refresh
    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: record.refreshToken });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newAccessToken = credentials.access_token!;
      const newExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await this.repo.updateAccessToken(userId, newAccessToken, newExpiresAt);
      return newAccessToken;
    } catch (err) {
      logger.error('Failed to refresh Google Calendar access token', { userId, err });
      // Mark as disconnected so we don't keep retrying with a revoked token
      await this.repo.updateAccessToken(userId, record.accessToken, record.expiresAt, false);
      return null;
    }
  }

  async createEvent(userId: string, event: CalendarEventInput): Promise<CreateEventResult> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime.toISOString() },
          end: { dateTime: event.endTime.toISOString() },
        },
      });

      return { success: true, googleEventId: response.data.id ?? undefined };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to create Google Calendar event', { userId, err });
      return { success: false, error: message };
    }
  }

  async deleteEvent(userId: string, googleEventId: string): Promise<{ success: boolean; error?: string }> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      return { success: false, error: 'No valid access token' };
    }

    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      return { success: true };
    } catch (err: unknown) {
      // Treat 404 as success — event is already gone
      const status = (err as { code?: number; status?: number })?.code ?? (err as { code?: number; status?: number })?.status;
      if (status === 404) {
        logger.warn('Google Calendar event not found during delete (treating as success)', { userId, googleEventId });
        return { success: true };
      }

      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to delete Google Calendar event', { userId, googleEventId, err });
      return { success: false, error: message };
    }
  }
}
