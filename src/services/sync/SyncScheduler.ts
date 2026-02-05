/**
 * Seasonal Sync Scheduler
 *
 * Determines sync frequency based on the football calendar.
 * During high-activity periods (transfer windows, end of season),
 * syncs weekly to capture award announcements and transfers.
 * During quieter periods, syncs monthly as a heartbeat.
 *
 * Replaces the hardcoded 7-day throttle in SyncService.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage key for last sync check timestamp */
const LAST_SYNC_CHECK_KEY = '@elite_index_last_sync_check';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Weekly sync interval (7 days) */
const WEEKLY_MS = 7 * DAY_MS;

/** Monthly sync interval (30 days) */
const MONTHLY_MS = 30 * DAY_MS;

export type SyncPeriod = 'weekly' | 'monthly';

/**
 * Determine the current sync period based on the football calendar.
 *
 * Weekly (high-activity):
 * - May 1 – June 30: Season end, awards season (Ballon d'Or, league finishes)
 * - January: Winter transfer window
 * - August: Summer transfer window, season openers
 *
 * Monthly (heartbeat):
 * - All other months (Feb-Apr, Jul, Sep-Dec)
 */
export function getSyncPeriod(date: Date = new Date()): SyncPeriod {
  const month = date.getMonth() + 1; // 1-based

  // May-June: Season end + awards
  if (month >= 5 && month <= 6) return 'weekly';

  // January: Winter transfer window
  if (month === 1) return 'weekly';

  // August: Summer transfer window
  if (month === 8) return 'weekly';

  return 'monthly';
}

/**
 * Get the sync interval in milliseconds for the current date.
 *
 * @param date - Date to check (defaults to now)
 * @returns Interval in milliseconds (7 days or 30 days)
 */
export function getSyncIntervalMs(date: Date = new Date()): number {
  return getSyncPeriod(date) === 'weekly' ? WEEKLY_MS : MONTHLY_MS;
}

/**
 * Check if an Elite Index sync check is due based on the seasonal schedule.
 *
 * Reads the last check timestamp from AsyncStorage and compares against
 * the current sync interval determined by the football calendar.
 *
 * @returns true if a sync check should be performed
 */
export async function isSyncCheckDue(): Promise<boolean> {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_SYNC_CHECK_KEY);
    if (!lastCheck) return true;

    const now = new Date();
    const elapsed = now.getTime() - new Date(lastCheck).getTime();
    return elapsed >= getSyncIntervalMs(now);
  } catch {
    return true; // Default to checking if AsyncStorage fails
  }
}

/**
 * Record that a sync check was performed.
 * Stores the current timestamp in AsyncStorage.
 */
export async function recordSyncCheck(): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_CHECK_KEY, new Date().toISOString());
}
