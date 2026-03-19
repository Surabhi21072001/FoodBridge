/**
 * Property-Based Tests for CalendarService — createEvent and deleteEvent
 * Feature: google-calendar-integration
 *
 * Properties covered:
 *   P1 — Booking with connected calendar always attempts event creation
 *        Validates: Requirements 2.1, 2.2, 2.3
 *   P2 — Calendar failure does not fail the booking
 *        Validates: Requirements 2.5
 *   P3 — Booking without connected calendar skips event creation
 *        Validates: Requirements 2.4
 *   P6 — Cancellation with connected calendar deletes event
 *        Validates: Requirements 4.1
 *   P7 — Calendar deletion failure does not fail cancellation
 *        Validates: Requirements 4.3
 */

import * as fc from 'fast-check';

// --- Mock google-auth-library before importing CalendarService ---
jest.mock('google-auth-library');
jest.mock('googleapis');

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { CalendarTokenRepository } from '../repositories/calendarTokenRepository';
import { CalendarService, CalendarEventInput } from './calendarService';

const MockOAuth2Client = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;
const mockGoogle = google as jest.Mocked<typeof google>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeRepo(): jest.Mocked<CalendarTokenRepository> {
  return {
    findByUserId: jest.fn(),
    updateAccessToken: jest.fn(),
    upsert: jest.fn(),
    deleteByUserId: jest.fn(),
  } as unknown as jest.Mocked<CalendarTokenRepository>;
}

/** A valid (non-expired, isConnected=true) token record for a given userId */
function validTokenRecord(userId: string) {
  return {
    userId,
    accessToken: 'valid-access-token',
    refreshToken: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    isConnected: true,
  };
}

/** Stub OAuth2Client so CalendarService.createOAuth2Client() works */
function stubOAuth2Client() {
  MockOAuth2Client.mockImplementation(() => ({
    setCredentials: jest.fn(),
  } as unknown as OAuth2Client));
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Arbitrary CalendarEventInput with valid date ordering */
const calendarEventInputArb: fc.Arbitrary<CalendarEventInput> = fc
  .record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    // startTime: a timestamp between now and 30 days from now
    startMs: fc.integer({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    // duration: 15 min to 4 hours in ms
    durationMs: fc.integer({ min: 15 * 60 * 1000, max: 4 * 60 * 60 * 1000 }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  })
  .map(({ title, startMs, durationMs, description }) => ({
    title,
    startTime: new Date(Date.now() + startMs),
    endTime: new Date(Date.now() + startMs + durationMs),
    description,
  }));

/** Arbitrary non-empty Google event ID string */
const googleEventIdArb = fc.string({ minLength: 5, maxLength: 64 }).filter((s) => s.trim().length > 0);

/** Arbitrary userId */
const userIdArb = fc.uuid();

// ---------------------------------------------------------------------------
// P1 — Booking with connected calendar always attempts event creation
// Validates: Requirements 2.1, 2.2, 2.3
// ---------------------------------------------------------------------------

describe('P1 — Booking with connected calendar always attempts event creation', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    repo = makeRepo();
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls Google API with matching title, startTime, endTime and returns success for any valid event input', async () => {
    await fc.assert(
      fc.asyncProperty(userIdArb, calendarEventInputArb, async (userId, eventInput) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns a valid connected token
        repo.findByUserId.mockResolvedValue(validTokenRecord(userId));

        // Set up googleapis mock
        const fakeEventId = 'fake-event-id-' + Math.random().toString(36).slice(2);
        const mockInsert = jest.fn().mockResolvedValue({ data: { id: fakeEventId } });
        const mockDelete = jest.fn();
        mockGoogle.calendar = jest.fn().mockReturnValue({
          events: { insert: mockInsert, delete: mockDelete },
        }) as any;

        stubOAuth2Client();

        const svc = new CalendarService(repo);
        const result = await svc.createEvent(userId, eventInput);

        // Property: result.success must be true
        if (!result.success) return false;

        // Property: Google API insert was called exactly once
        if (mockInsert.mock.calls.length !== 1) return false;

        const callArg = mockInsert.mock.calls[0][0];
        const body = callArg.requestBody;

        // Property: title (summary) matches
        if (body.summary !== eventInput.title) return false;

        // Property: startTime matches
        if (body.start.dateTime !== eventInput.startTime.toISOString()) return false;

        // Property: endTime matches
        if (body.end.dateTime !== eventInput.endTime.toISOString()) return false;

        // Property: description is passed through when present
        if (eventInput.description !== undefined && body.description !== eventInput.description) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// P2 — Calendar failure does not fail the booking
// Validates: Requirements 2.5
// ---------------------------------------------------------------------------

describe('P2 — Calendar failure does not fail the booking', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    repo = makeRepo();
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns success:false without throwing for any event input when Google API throws', async () => {
    await fc.assert(
      fc.asyncProperty(userIdArb, calendarEventInputArb, async (userId, eventInput) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns a valid connected token
        repo.findByUserId.mockResolvedValue(validTokenRecord(userId));

        // Google API throws an error
        const mockInsert = jest.fn().mockRejectedValue(new Error('Google API unavailable'));
        const mockDelete = jest.fn();
        mockGoogle.calendar = jest.fn().mockReturnValue({
          events: { insert: mockInsert, delete: mockDelete },
        }) as any;

        stubOAuth2Client();

        const svc = new CalendarService(repo);

        // Property: createEvent must not throw
        let result: Awaited<ReturnType<typeof svc.createEvent>>;
        try {
          result = await svc.createEvent(userId, eventInput);
        } catch {
          // If it throws, the property fails
          return false;
        }

        // Property: result.success must be false (not a thrown exception)
        if (result.success !== false) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// P3 — Booking without connected calendar skips event creation
// Validates: Requirements 2.4
// ---------------------------------------------------------------------------

describe('P3 — Booking without connected calendar skips event creation', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    repo = makeRepo();
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('never calls Google API insert and returns success:false for any event input when no token exists', async () => {
    await fc.assert(
      fc.asyncProperty(userIdArb, calendarEventInputArb, async (userId, eventInput) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns null — no token for this user
        repo.findByUserId.mockResolvedValue(null);

        // Set up googleapis spy to verify it's never called
        const mockInsert = jest.fn();
        const mockDelete = jest.fn();
        mockGoogle.calendar = jest.fn().mockReturnValue({
          events: { insert: mockInsert, delete: mockDelete },
        }) as any;

        stubOAuth2Client();

        const svc = new CalendarService(repo);
        const result = await svc.createEvent(userId, eventInput);

        // Property: result.success must be false
        if (result.success !== false) return false;

        // Property: Google API insert was never called
        if (mockInsert.mock.calls.length !== 0) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// P6 — Cancellation with connected calendar deletes event
// Validates: Requirements 4.1
// ---------------------------------------------------------------------------

describe('P6 — Cancellation with connected calendar deletes event', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    repo = makeRepo();
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls Google API delete with the correct eventId and returns success for any googleEventId', async () => {
    await fc.assert(
      fc.asyncProperty(userIdArb, googleEventIdArb, async (userId, googleEventId) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns a valid connected token
        repo.findByUserId.mockResolvedValue(validTokenRecord(userId));

        // Google API delete succeeds
        const mockInsert = jest.fn();
        const mockDelete = jest.fn().mockResolvedValue({});
        mockGoogle.calendar = jest.fn().mockReturnValue({
          events: { insert: mockInsert, delete: mockDelete },
        }) as any;

        stubOAuth2Client();

        const svc = new CalendarService(repo);
        const result = await svc.deleteEvent(userId, googleEventId);

        // Property: result.success must be true
        if (!result.success) return false;

        // Property: Google API delete was called exactly once
        if (mockDelete.mock.calls.length !== 1) return false;

        // Property: delete was called with the correct eventId
        const callArg = mockDelete.mock.calls[0][0];
        if (callArg.eventId !== googleEventId) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// P7 — Calendar deletion failure does not fail cancellation
// Validates: Requirements 4.3
// ---------------------------------------------------------------------------

describe('P7 — Calendar deletion failure does not fail cancellation', () => {
  let repo: jest.Mocked<CalendarTokenRepository>;

  beforeEach(() => {
    repo = makeRepo();
    MockOAuth2Client.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns success:false without throwing for any googleEventId when Google API delete throws a non-404 error', async () => {
    await fc.assert(
      fc.asyncProperty(userIdArb, googleEventIdArb, async (userId, googleEventId) => {
        jest.clearAllMocks();
        MockOAuth2Client.mockClear();

        // Repo returns a valid connected token
        repo.findByUserId.mockResolvedValue(validTokenRecord(userId));

        // Google API delete throws a non-404 error
        const mockInsert = jest.fn();
        const mockDelete = jest.fn().mockRejectedValue(new Error('Internal Server Error'));
        mockGoogle.calendar = jest.fn().mockReturnValue({
          events: { insert: mockInsert, delete: mockDelete },
        }) as any;

        stubOAuth2Client();

        const svc = new CalendarService(repo);

        // Property: deleteEvent must not throw
        let result: Awaited<ReturnType<typeof svc.deleteEvent>>;
        try {
          result = await svc.deleteEvent(userId, googleEventId);
        } catch {
          // If it throws, the property fails
          return false;
        }

        // Property: result.success must be false (not a thrown exception)
        if (result.success !== false) return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });
});
