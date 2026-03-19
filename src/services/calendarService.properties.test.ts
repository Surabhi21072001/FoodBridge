/**
 * Property-Based Tests for CalendarService — Token Refresh
 * Feature: google-calendar-integration, Property 4: Token refresh preserves access
 *
 * Validates: Requirements 3.1, 3.2
 *
 * For any user whose access token has expired but whose refresh token is valid,
 * calling getValidAccessToken should return a non-null token and the new access
 * token should be persisted to the database.
 */

import * as fc from 'fast-check';

// --- Mock google-auth-library before importing CalendarService ---
jest.mock('google-auth-library');

import { OAuth2Client } from 'google-auth-library';
import { CalendarTokenRepository } from '../repositories/calendarTokenRepository';
import { CalendarService } from './calendarService';

const MockOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

// Arbitrary: expired token records (expiresAt in the past, isConnected: true)
const now = Date.now();
const expiredTokenRecordArb = fc.record({
  userId: fc.uuid(),
  accessToken: fc.string({ minLength: 10 }),
  refreshToken: fc.string({ minLength: 10 }),
  // expiresAt is always in the past (1ms to 30 days ago)
  expiresAt: fc
    .integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 })
    .map((offset) => new Date(now - offset)),
  isConnected: fc.constant(true),
});

// Arbitrary: a new access token returned by Google after refresh
const newAccessTokenArb = fc.string({ minLength: 20 });

/**
 * P4 — Token refresh preserves access
 * Validates: Requirements 3.1, 3.2
 *
 * For any expired-but-refreshable token, getValidAccessToken returns non-null
 * and persists the new access token via repo.updateAccessToken.
 */
describe('P4 — Token refresh preserves access', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    // Create a fully mocked repository
    repo = {
      findByUserId: jest.fn(),
      updateAccessToken: jest.fn(),
      upsert: jest.fn(),
      deleteByUserId: jest.fn(),
    } as unknown as jest.Mocked<CalendarTokenRepository>;

    // Reset OAuth2Client mock before each run
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a non-null token and persists the new token for any expired-but-refreshable record', async () => {
    await fc.assert(
      fc.asyncProperty(expiredTokenRecordArb, newAccessTokenArb, async (record, newToken) => {
        // Reset mocks for each iteration
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns the expired record
        repo.findByUserId.mockResolvedValue(record);
        repo.updateAccessToken.mockResolvedValue(undefined);

        // New expiry returned by Google (1 hour from now)
        const newExpiryMs = now + 3600 * 1000;

        // Mock the OAuth2Client instance methods
        const mockSetCredentials = jest.fn();
        const mockRefreshAccessToken = jest.fn().mockResolvedValue({
          credentials: {
            access_token: newToken,
            expiry_date: newExpiryMs,
          },
        });

        MockOAuth2Client.mockImplementation(() => ({
          setCredentials: mockSetCredentials,
          refreshAccessToken: mockRefreshAccessToken,
        } as unknown as OAuth2Client));

        // Re-create service so it picks up the new mock instance
        const svc = new CalendarService(repo);

        const result = await svc.getValidAccessToken(record.userId);

        // Property: result must be non-null (the new access token)
        if (result === null) return false;
        if (result !== newToken) return false;

        // Property: updateAccessToken must have been called with the new token
        if (repo.updateAccessToken.mock.calls.length !== 1) return false;

        const [calledUserId, calledToken, calledExpiry] = repo.updateAccessToken.mock.calls[0];
        if (calledUserId !== record.userId) return false;
        if (calledToken !== newToken) return false;
        if (!(calledExpiry instanceof Date)) return false;
        if (calledExpiry.getTime() !== newExpiryMs) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });

  it('persists a fallback expiry when Google does not return expiry_date', async () => {
    await fc.assert(
      fc.asyncProperty(expiredTokenRecordArb, newAccessTokenArb, async (record, newToken) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        repo.findByUserId.mockResolvedValue(record);
        repo.updateAccessToken.mockResolvedValue(undefined);

        // Google returns no expiry_date
        const mockRefreshAccessToken = jest.fn().mockResolvedValue({
          credentials: {
            access_token: newToken,
            // expiry_date intentionally omitted
          },
        });

        MockOAuth2Client.mockImplementation(() => ({
          setCredentials: jest.fn(),
          refreshAccessToken: mockRefreshAccessToken,
        } as unknown as OAuth2Client));

        const svc = new CalendarService(repo);
        const beforeCall = Date.now();
        const result = await svc.getValidAccessToken(record.userId);
        const afterCall = Date.now();

        if (result === null) return false;
        if (result !== newToken) return false;

        if (repo.updateAccessToken.mock.calls.length !== 1) return false;

        const [, , calledExpiry] = repo.updateAccessToken.mock.calls[0];
        if (!(calledExpiry instanceof Date)) return false;

        // Fallback expiry should be ~1 hour from now (within a 5-second window)
        const expectedMin = beforeCall + 3600 * 1000 - 5000;
        const expectedMax = afterCall + 3600 * 1000 + 5000;
        if (calledExpiry.getTime() < expectedMin || calledExpiry.getTime() > expectedMax) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});

/**
 * Property-Based Tests for CalendarService — Revoked Refresh Token
 * Feature: google-calendar-integration, Property 5: Revoked refresh token disconnects user
 *
 * Validates: Requirements 3.3
 *
 * For any user whose refresh token has been revoked, calling getValidAccessToken
 * should return null and the user's is_connected flag should be set to false.
 */

// Arbitrary: expired token records with isConnected: true (refresh will be attempted)
const expiredConnectedTokenArb = fc.record({
  userId: fc.uuid(),
  accessToken: fc.string({ minLength: 10 }),
  refreshToken: fc.string({ minLength: 10 }),
  // expiresAt is always in the past so refresh is triggered
  expiresAt: fc
    .integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 })
    .map((offset) => new Date(now - offset)),
  isConnected: fc.constant(true),
});

/**
 * P5 — Revoked refresh token disconnects user
 * Validates: Requirements 3.3
 *
 * For any expired token record where the Google token endpoint returns an error
 * (simulating a revoked/invalid refresh token), getValidAccessToken should:
 *   1. Return null
 *   2. Call repo.updateAccessToken with isConnected = false (4th argument)
 */
describe('P5 — Revoked refresh token disconnects user', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    repo = {
      findByUserId: jest.fn(),
      updateAccessToken: jest.fn(),
      upsert: jest.fn(),
      deleteByUserId: jest.fn(),
    } as unknown as jest.Mocked<CalendarTokenRepository>;

    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null and sets is_connected = false for any revoked refresh token', async () => {
    await fc.assert(
      fc.asyncProperty(expiredConnectedTokenArb, async (record) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns the expired, connected record
        repo.findByUserId.mockResolvedValue(record);
        repo.updateAccessToken.mockResolvedValue(undefined);

        // Mock refreshAccessToken to throw (simulating 400 / revoked token)
        const mockRefreshAccessToken = jest.fn().mockRejectedValue(
          new Error('Token has been expired or revoked.')
        );

        MockOAuth2Client.mockImplementation(() => ({
          setCredentials: jest.fn(),
          refreshAccessToken: mockRefreshAccessToken,
        } as unknown as OAuth2Client));

        const svc = new CalendarService(repo);
        const result = await svc.getValidAccessToken(record.userId);

        // Property: result must be null
        if (result !== null) return false;

        // Property: updateAccessToken must have been called once
        if (repo.updateAccessToken.mock.calls.length !== 1) return false;

        // Property: 4th argument (isConnected) must be false
        const callArgs = repo.updateAccessToken.mock.calls[0];
        const isConnectedArg = callArgs[3];
        if (isConnectedArg !== false) return false;

        // Property: userId must match
        if (callArgs[0] !== record.userId) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});
