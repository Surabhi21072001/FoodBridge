/**
 * Seed Listings Date Refresher
 *
 * Every hour, resets available_from / available_until for seed listings so
 * they always show today's date with their original time-of-day window.
 *
 * Strategy: strip the date part and replace it with today's date, keeping
 * the original clock time (hour + minute) intact.
 *
 * e.g. a listing originally set to 11:00–14:00 will always show as
 *      TODAY 11:00 – TODAY 14:00, regardless of what day it is.
 *
 * Seed provider IDs (hardcoded — these are fixed UUIDs in the seed data):
 *   - 66666666-6666-6666-6666-666666666666  (seedListings.ts)
 */

import { query } from '../config/database';

const SEED_PROVIDER_IDS = [
  '66666666-6666-6666-6666-666666666666',  // seedListings.ts
  'b6c1b408-47ed-47e8-b146-42be74bcbc6c',  // dininghall@university.edu
];

export async function refreshSeedListingDates(): Promise<void> {
  try {
    // Replace just the date portion with today, keeping the original HH:MM:SS
    const result = await query(
      `UPDATE food_listings
       SET
         available_from  = (CURRENT_DATE + available_from::time),
         available_until = (CURRENT_DATE + available_until::time),
         updated_at      = NOW()
       WHERE provider_id = ANY($1::uuid[])
         AND status != 'cancelled'
       RETURNING id`,
      [SEED_PROVIDER_IDS]
    );

    console.log(
      `[SeedRefresh] Refreshed ${result.rowCount} seed listing(s) at ${new Date().toISOString()}`
    );
  } catch (err) {
    console.error('[SeedRefresh] Failed to refresh seed listing dates:', err);
  }
}

export function startSeedListingsRefreshJob(intervalMs = 60 * 60 * 1000): NodeJS.Timeout {
  console.log(`[SeedRefresh] Starting hourly seed listing date refresh`);

  // Run immediately on startup
  refreshSeedListingDates();

  return setInterval(refreshSeedListingDates, intervalMs);
}
