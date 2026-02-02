/**
 * Elite Index Sync Service
 *
 * Handles periodic delta sync of the player database.
 * Checks server version against local version and downloads
 * new/updated players when an update is available.
 *
 * Uses SyncScheduler for calendar-aware sync frequency:
 * - Weekly during transfer windows and awards season (Jan, May-Jun, Aug)
 * - Monthly heartbeat during quieter periods
 *
 * Runs non-blocking in the background on app mount.
 */

import { supabase } from '@/lib/supabase';
import {
  getEliteIndexVersion,
  setEliteIndexVersion,
  upsertPlayerCache,
  recalculateEliteStatus,
  upsertClubColors,
} from '@/lib/database';
import {
  isSyncCheckDue,
  recordSyncCheck,
} from '@/services/sync/SyncScheduler';

export interface SyncResult {
  success: boolean;
  updatedCount: number;
  serverVersion: number;
  error?: string;
}

// Re-export scheduler utilities for consumers that need them
export { getSyncPeriod, getSyncIntervalMs } from '@/services/sync/SyncScheduler';

/**
 * Sync Elite Index delta from server.
 * Downloads new/updated players and upserts them into local cache.
 * Includes stats_cache for pre-calculated achievement totals.
 *
 * Non-blocking — safe to call from app mount without awaiting.
 *
 * @returns SyncResult with success status and updated count
 */
export async function syncEliteIndex(): Promise<SyncResult> {
  try {
    // Throttle: skip if checked recently (calendar-aware frequency)
    const due = await isSyncCheckDue();
    if (!due) {
      return { success: true, updatedCount: 0, serverVersion: 0 };
    }

    const localVersion = await getEliteIndexVersion();
    console.log(`[SyncService] Checking for updates (local v${localVersion})`);

    const { data, error } = await supabase.rpc('get_elite_index_delta', {
      client_version: localVersion,
    });

    // Record check timestamp regardless of outcome
    await recordSyncCheck();

    if (error) {
      console.error('[SyncService] RPC failed:', error.message);
      return {
        success: false,
        updatedCount: 0,
        serverVersion: localVersion,
        error: error.message,
      };
    }

    const result = data?.[0];
    if (!result?.has_updates) {
      console.log('[SyncService] Already up to date');
      return {
        success: true,
        updatedCount: 0,
        serverVersion: result?.server_version ?? localVersion,
      };
    }

    // Parse and upsert delta players (now includes stats_cache)
    const players = (result.updated_players ?? []) as Array<{
      id: string;
      name: string;
      search_name: string;
      scout_rank: number;
      birth_year: number | null;
      position_category: string | null;
      nationality_code: string | null;
      stats_cache?: Record<string, number> | null;
    }>;

    await upsertPlayerCache(players);
    await recalculateEliteStatus(players.map((p) => p.id));
    await setEliteIndexVersion(result.server_version);

    console.log(
      `[SyncService] Synced ${players.length} players (v${localVersion} → v${result.server_version})`
    );

    return {
      success: true,
      updatedCount: players.length,
      serverVersion: result.server_version,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SyncService] Sync failed:', message);
    return {
      success: false,
      updatedCount: 0,
      serverVersion: 0,
      error: message,
    };
  }
}

/**
 * Sync club colors from server.
 * One-time fetch — club colors rarely change.
 * Stores results in local club_colors SQLite table.
 */
export async function syncClubColors(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    // RPC not yet in generated Supabase types — use type assertion
    const { data, error } = await (supabase.rpc as CallableFunction)('get_club_colors');

    if (error) {
      console.error('[SyncService] Club colors RPC failed:', (error as { message: string }).message);
      return { success: false, count: 0, error: (error as { message: string }).message };
    }

    const clubs = ((data as unknown) ?? []) as Array<{
      id: string;
      name: string;
      primary_color: string;
      secondary_color: string;
    }>;

    if (clubs.length === 0) {
      console.log('[SyncService] No club colors returned');
      return { success: true, count: 0 };
    }

    await upsertClubColors(clubs);
    console.log(`[SyncService] Synced ${clubs.length} club colors`);

    return { success: true, count: clubs.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SyncService] Club color sync failed:', message);
    return { success: false, count: 0, error: message };
  }
}
