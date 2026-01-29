/**
 * Elite Index Sync Service
 *
 * Handles periodic delta sync of the player database.
 * Checks server version against local version and downloads
 * new/updated players when an update is available.
 *
 * Runs non-blocking in the background on app mount.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  getEliteIndexVersion,
  setEliteIndexVersion,
  upsertPlayerCache,
} from '@/lib/database';

/** AsyncStorage key for last sync check timestamp */
const LAST_SYNC_CHECK_KEY = '@elite_index_last_sync_check';

/** Minimum interval between sync checks (7 days in ms) */
const SYNC_CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SyncResult {
  success: boolean;
  updatedCount: number;
  serverVersion: number;
  error?: string;
}

/**
 * Check if an Elite Index sync check is due.
 * Throttled to once per 7 days to avoid unnecessary network calls.
 */
export async function isSyncCheckDue(): Promise<boolean> {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_SYNC_CHECK_KEY);
    if (lastCheck) {
      const elapsed = Date.now() - new Date(lastCheck).getTime();
      if (elapsed < SYNC_CHECK_INTERVAL_MS) {
        return false;
      }
    }
    return true;
  } catch {
    return true; // Default to checking if AsyncStorage fails
  }
}

/**
 * Sync Elite Index delta from server.
 * Downloads new/updated players and upserts them into local cache.
 *
 * Non-blocking — safe to call from app mount without awaiting.
 *
 * @returns SyncResult with success status and updated count
 */
export async function syncEliteIndex(): Promise<SyncResult> {
  try {
    // Throttle: skip if checked recently
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
    await AsyncStorage.setItem(LAST_SYNC_CHECK_KEY, new Date().toISOString());

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

    // Parse and upsert delta players
    const players = (result.updated_players ?? []) as Array<{
      id: string;
      name: string;
      search_name: string;
      scout_rank: number;
      birth_year: number | null;
      position_category: string | null;
      nationality_code: string | null;
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
