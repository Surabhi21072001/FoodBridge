/**
 * Property-Based Tests for CalendarService — disconnect behavior
 * Feature: google-calendar-integration
 *
 * Properties covered:
 *   P9 — Disconnect removes token and blocks calendar operations
 *        Validates: Requirements 1.4
 */

import * as fc from 'fast-check';

jest.mock('google-auth-library');
jest.mock('googleapis');

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { CalendarTokenRepository } from '../repositories/calendarTokenRepository';
import { CalendarService, CalendarEventInput } from './calendarService';

const MockOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;
const mockGoogle = google as jest.Mocked<typeof google>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): jest.Mocked<CalendarTokenRepository> {
  return {
    findByUserId: jest.fn(),
    updateAccessToken: jest.fn(),
    upsert: jest.fn(),
    deleteByUserId: jest.fn(),
  } as unknown as jest.Mocked<CalendarTokenRepository>;
}

function stubOAuth2Client() {
  MockOAuth2Client.mockImplementation(() => ({
    setCredentials: jest.fn(),
  } as unknown as OAuth2Client));
}

const userIdArb = fc.uuid();

const calendarEventInputArb: fc.Arbitrary<CalendarEventInput> = fc
  .record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    startMs: fc.integer({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    durationMs: fc.integer({ min: 15 * 60 * 1000, max: 4 * 60 * 60 * 1000 }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  })
  .map(({ title, startMs, durationMs, description }) => ({
    title,
    startTime: new Date(Date.now() + startMs),
    endTime: new Date(Date.now() + startMs + durationMs),
    description,
  }));

// ---------------------------------------------------------------------------
// P9 — Disconnect removes token and blocks calendar operations
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe('P9 — Disconnect removes token and blocks calendar operations', () => {
  beforeEach(() => {
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('isConnected returns false and createEvent never calls Google API after disconnect for any user', async () => {
    await fc.assert(
      fc.asyncProperty(userIdArb, calendarEventInputArb, async (userId, eventInput) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        const repo = makeRepo();

        // deleteByUserId removes the token
        repo.deleteByUserId.mockResolvedValue(undefined);

        // After disconnect, findByUserId returns null (token deleted)
        repo.findByUserId.mockResolvedValue(null);

        // Spy on Google API insert to verify it's never called
        const mockInsert = jest.fn();
        mockGoogle.calendar = jest.fn().mockReturnValue({
          events: { insert: mockInsert, delete: jest.fn() },
        }) as any;

        stubOAuth2Client();

        const svc = new CalendarService(repo);

        // Disconnect the user
        await svc.disconnectUser(userId);

        // Property: deleteByUserId was called
        if (repo.deleteByUserId.mock.calls.length !== 1) return false;

        // Property: isConnected returns false
        const connected = await svc.isConnected(userId);
        if (connected !== false) return false;

        // Property: createEvent does not call Google API
        const result = await svc.createEvent(userId, eventInput);
        if (mockInsert.mock.calls.length !== 0) return false;

        // Property: createEvent returns success:false (no token available)
        if (result.success !== false) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});
