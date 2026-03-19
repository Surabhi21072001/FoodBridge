/**
 * Unit Tests for OAuth Calendar Routes
 * Feature: google-calendar-integration
 *
 * Tests:
 * - Callback stores tokens correctly
 * - Callback with error param returns 400 (Property 10: OAuth failure leaves status unchanged)
 * - Disconnect calls disconnectUser and returns 204
 * - Status endpoint returns correct connected value
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5
 */

import request from 'supertest';
import express, { Application } from 'express';

// Mock dependencies before importing anything that uses them
jest.mock('google-auth-library');
jest.mock('../config/database', () => ({ query: jest.fn() }));

import { OAuth2Client } from 'google-auth-library';
import { CalendarTokenRepository } from '../repositories/calendarTokenRepository';
import { CalendarService } from '../services/calendarService';
import authRouter from './authRoutes';

const MockOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

// Fake user injected by mocked authenticate middleware
const FAKE_USER = { id: 'test-user-id', email: 'test@example.com', role: 'student' as const };

// JWT that will pass the real authenticate middleware
import jwt from 'jsonwebtoken';
const FAKE_TOKEN = jwt.sign(FAKE_USER, process.env.JWT_SECRET || 'your_jwt_secret');

function buildApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
}

function encodeState(userId: string): string {
  return Buffer.from(JSON.stringify({ userId })).toString('base64');
}

describe('OAuth Calendar Routes', () => {
  let app: Application;
  let upsertSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;
  let isConnectedSpy: jest.SpyInstance;
  let getTokenMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on prototype methods so the module-level instances are affected
    upsertSpy = jest.spyOn(CalendarTokenRepository.prototype, 'upsert').mockResolvedValue(undefined);
    disconnectSpy = jest.spyOn(CalendarService.prototype, 'disconnectUser').mockResolvedValue(undefined);
    isConnectedSpy = jest.spyOn(CalendarService.prototype, 'isConnected').mockResolvedValue(false);

    // Mock OAuth2Client
    getTokenMock = jest.fn().mockResolvedValue({
      tokens: {
        access_token: 'at',
        refresh_token: 'rt',
        expiry_date: Date.now() + 3600000,
      },
    });
    MockOAuth2Client.mockImplementation(() => ({
      generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock'),
      getToken: getTokenMock,
    } as unknown as OAuth2Client));

    app = buildApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Test 1: Callback stores tokens correctly ────────────────────────────────

  describe('GET /api/auth/google/calendar/callback — success', () => {
    it('calls upsert with correct userId, accessToken, refreshToken and redirects', async () => {
      const state = encodeState('test-user-id');
      const expiryDate = Date.now() + 3600000;

      getTokenMock.mockResolvedValue({
        tokens: { access_token: 'at', refresh_token: 'rt', expiry_date: expiryDate },
      });

      const res = await request(app)
        .get(`/api/auth/google/calendar/callback?code=valid_code&state=${state}`)
        .expect(302);

      expect(upsertSpy).toHaveBeenCalledTimes(1);
      const upsertArg = upsertSpy.mock.calls[0][0];
      expect(upsertArg.userId).toBe('test-user-id');
      expect(upsertArg.accessToken).toBe('at');
      expect(upsertArg.refreshToken).toBe('rt');
      expect(upsertArg.isConnected).toBe(true);
      expect(res.headers.location).toContain('/profile?calendar=connected');
    });

    it('uses a fallback expiry when expiry_date is not provided', async () => {
      const state = encodeState('test-user-id');

      getTokenMock.mockResolvedValue({
        tokens: { access_token: 'at', refresh_token: 'rt' },
      });

      await request(app)
        .get(`/api/auth/google/calendar/callback?code=valid_code&state=${state}`)
        .expect(302);

      expect(upsertSpy).toHaveBeenCalledTimes(1);
      const upsertArg = upsertSpy.mock.calls[0][0];
      expect(upsertArg.expiresAt).toBeInstanceOf(Date);
    });
  });

  // ─── Test 2: Callback with error param returns 400 (Property 10) ─────────────

  /**
   * Property 10: OAuth failure leaves status unchanged
   * Validates: Requirements 1.5
   */
  describe('GET /api/auth/google/calendar/callback — error param (Property 10)', () => {
    it('returns 400 when error query param is present', async () => {
      const state = encodeState('test-user-id');
      const res = await request(app)
        .get(`/api/auth/google/calendar/callback?error=access_denied&state=${state}`)
        .expect(400);
      expect(res.body.error).toBeDefined();
    });

    it('does NOT call upsert when error param is present (status unchanged)', async () => {
      const state = encodeState('test-user-id');
      await request(app)
        .get(`/api/auth/google/calendar/callback?error=access_denied&state=${state}`);
      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for various OAuth error values', async () => {
      for (const errorVal of ['access_denied', 'invalid_scope', 'server_error']) {
        const state = encodeState('test-user-id');
        await request(app)
          .get(`/api/auth/google/calendar/callback?error=${errorVal}&state=${state}`)
          .expect(400);
        expect(upsertSpy).not.toHaveBeenCalled();
      }
    });

    it('returns 400 when both code and error are present (error takes precedence)', async () => {
      const state = encodeState('test-user-id');
      await request(app)
        .get(`/api/auth/google/calendar/callback?code=some_code&error=access_denied&state=${state}`)
        .expect(400);
      expect(upsertSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Test 3: Disconnect calls disconnectUser and returns 204 ─────────────────

  describe('DELETE /api/auth/google/calendar — disconnect', () => {
    it('calls disconnectUser with the authenticated userId and returns 204', async () => {
      await request(app)
        .delete('/api/auth/google/calendar')
        .set('Authorization', `Bearer ${FAKE_TOKEN}`)
        .expect(204);

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalledWith(FAKE_USER.id);
    });
  });

  // ─── Test 4: Status endpoint returns correct connected value ─────────────────

  describe('GET /api/auth/google/calendar/status — connection status', () => {
    it('returns { connected: true } when user is connected', async () => {
      isConnectedSpy.mockResolvedValue(true);

      const res = await request(app)
        .get('/api/auth/google/calendar/status')
        .set('Authorization', `Bearer ${FAKE_TOKEN}`)
        .expect(200);

      expect(res.body).toEqual({ connected: true });
      expect(isConnectedSpy).toHaveBeenCalledWith(FAKE_USER.id);
    });

    it('returns { connected: false } when user is not connected', async () => {
      isConnectedSpy.mockResolvedValue(false);

      const res = await request(app)
        .get('/api/auth/google/calendar/status')
        .set('Authorization', `Bearer ${FAKE_TOKEN}`)
        .expect(200);

      expect(res.body).toEqual({ connected: false });
      expect(isConnectedSpy).toHaveBeenCalledWith(FAKE_USER.id);
    });
  });
});
