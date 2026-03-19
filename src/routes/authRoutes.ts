import { Router, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { UserController } from '../controllers/userController';
import { validate } from '../middleware/validator';
import { registerSchema, loginSchema } from '../validators/userValidators';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CalendarTokenRepository } from '../repositories/calendarTokenRepository';
import { CalendarService } from '../services/calendarService';

const router = Router();
const userController = new UserController();
const calendarTokenRepo = new CalendarTokenRepository();
const calendarService = new CalendarService(calendarTokenRepo);

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Auth routes
router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);

// GET /api/auth/google/calendar — initiate OAuth flow
router.get(
  '/google/calendar',
  authenticate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

      const oauth2Client = createOAuth2Client();
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [GOOGLE_CALENDAR_SCOPE],
        state,
      });

      res.redirect(authUrl);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/google/calendar/callback — handle OAuth callback
router.get(
  '/google/calendar/callback',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { code, state, error } = req.query as Record<string, string>;

      if (error) {
        return res.status(400).json({
          error: 'OAuth authorization failed',
          details: error,
        });
      }

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      let userId: string;
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        userId = decoded.userId;
      } catch {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      const oauth2Client = createOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);

      await calendarTokenRepo.upsert({
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
        isConnected: true,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/profile?calendar=connected`);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/auth/google/calendar — disconnect Google Calendar
router.delete(
  '/google/calendar',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await calendarService.disconnectUser(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/google/calendar/status — check connection status
router.get(
  '/google/calendar/status',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const connected = await calendarService.isConnected(userId);
      res.json({ connected });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/google/calendar/events — create a calendar event directly
router.post(
  '/google/calendar/events',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { title, start_time, end_time, description } = req.body;

      if (!title || !start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'title, start_time, and end_time are required' });
      }

      const result = await calendarService.createEvent(userId, {
        title,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        description,
      });

      if (!result.success) {
        // If not connected, return a specific status so the agent can handle it
        if (result.error === 'No valid access token') {
          return res.status(403).json({ success: false, message: 'Google Calendar not connected', not_connected: true });
        }
        return res.status(500).json({ success: false, message: result.error });
      }

      return res.status(201).json({ success: true, data: { google_event_id: result.googleEventId } });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
