/**
 * Property-Based Tests for CalendarTokenRepository
 * Feature: google-calendar-integration, Property 8: OAuth token storage round-trip
 *
 * Uses fast-check to verify that upsert then findByUserId returns equivalent data.
 *
 * Validates: Requirements 1.2
 */

import * as fc from 'fast-check';
import { CalendarTokenRepository, CalendarTokenRecord } from './calendarTokenRepository';

// --- Mock the database query function ---
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../config/database';
const mockQuery = query as jest.MockedFunction<typeof query>;

// Shared arbitrary: use integer timestamps to avoid NaN dates from fc.date() shrinking
const now = Date.now();
const tokenRecordArb = fc.record({
  userId: fc.uuid(),
  accessToken: fc.string({ minLength: 10 }),
  refreshToken: fc.string({ minLength: 10 }),
  expiresAt: fc
    .integer({ min: now, max: now + 365 * 24 * 60 * 60 * 1000 })
    .map((ts) => new Date(ts)),
  isConnected: fc.boolean(),
});

/**
 * P8 — OAuth token storage round-trip
 * Validates: Requirements 1.2
 *
 * For any valid token record, upsert then findByUserId should return equivalent data.
 */
describe('P8 — OAuth token storage round-trip', () => {
  let repo: CalendarTokenRepository;

  // In-memory store simulating the DB
  let store: Map<string, CalendarTokenRecord>;

  beforeEach(() => {
    repo = new CalendarTokenRepository();
    store = new Map();

    mockQuery.mockImplementation(async (sql: string, params?: any[]) => {
      const sqlNorm = sql.replace(/\s+/g, ' ').trim().toUpperCase();

      // INSERT ... ON CONFLICT ... DO UPDATE (upsert)
      if (sqlNorm.startsWith('INSERT INTO GOOGLE_CALENDAR_TOKENS')) {
        const [userId, accessToken, refreshToken, expiresAt, isConnected] = params!;
        store.set(String(userId), {
          userId: String(userId),
          accessToken: String(accessToken),
          refreshToken: String(refreshToken),
          expiresAt: expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
          isConnected: Boolean(isConnected),
        });
        return { rows: [], rowCount: 1 } as any;
      }

      // SELECT
      if (sqlNorm.startsWith('SELECT') && sqlNorm.includes('GOOGLE_CALENDAR_TOKENS')) {
        const userId = String(params![0]);
        const record = store.get(userId);
        if (!record) return { rows: [], rowCount: 0 } as any;
        return {
          rows: [{
            user_id: record.userId,
            access_token: record.accessToken,
            refresh_token: record.refreshToken,
            expires_at: record.expiresAt.toISOString(),
            is_connected: record.isConnected,
          }],
          rowCount: 1,
        } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('upsert then findByUserId returns equivalent data for any valid token record', async () => {
    await fc.assert(
      fc.asyncProperty(tokenRecordArb, async (record) => {
        store.clear();

        await repo.upsert(record);
        const retrieved = await repo.findByUserId(record.userId);

        if (retrieved === null) return false;

        return (
          retrieved.userId === record.userId &&
          retrieved.accessToken === record.accessToken &&
          retrieved.refreshToken === record.refreshToken &&
          retrieved.expiresAt.getTime() === record.expiresAt.getTime() &&
          retrieved.isConnected === record.isConnected
        );
      }),
      { numRuns: 20 }
    );
  });

  it('upsert is idempotent: upserting the same userId twice returns the latest record', async () => {
    await fc.assert(
      fc.asyncProperty(tokenRecordArb, tokenRecordArb, async (first, second) => {
        store.clear();

        const firstRecord = { ...first };
        const secondRecord = { ...second, userId: first.userId };

        await repo.upsert(firstRecord);
        await repo.upsert(secondRecord);

        const retrieved = await repo.findByUserId(first.userId);

        if (retrieved === null) return false;

        // Should reflect the second (latest) upsert
        return (
          retrieved.userId === secondRecord.userId &&
          retrieved.accessToken === secondRecord.accessToken &&
          retrieved.refreshToken === secondRecord.refreshToken &&
          retrieved.expiresAt.getTime() === secondRecord.expiresAt.getTime() &&
          retrieved.isConnected === secondRecord.isConnected
        );
      }),
      { numRuns: 20 }
    );
  });

  it('findByUserId returns null when no record exists for a userId', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        store.clear();
        const result = await repo.findByUserId(userId);
        return result === null;
      }),
      { numRuns: 10 }
    );
  });
});
