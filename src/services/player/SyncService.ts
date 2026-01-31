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
