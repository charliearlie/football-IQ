/**
 * Catalog Sync Service
 *
 * Handles syncing puzzle catalog (metadata only) from Supabase to SQLite.
 * Uses an RPC function that bypasses RLS, allowing all users to see
 * what puzzles exist (for showing "locked" placeholders).
 *
 * Supports incremental sync - only fetches new entries since last sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { saveCatalogEntries, getAllLocalCatalogIds, deleteCatalogByIds } from '@/lib/database';
import { LocalCatalogEntry } from '@/types/database';
import { CatalogSyncResult } from '../types/archive.types';

/** AsyncStorage key for tracking last catalog sync timestamp */
const CATALOG_LAST_SYNC_KEY = '@catalog_last_synced_at';

/**
 * Get the timestamp of the last successful catalog sync.
 * @returns ISO timestamp string or null if never synced
 */
export async function getLastCatalogSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CATALOG_LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the timestamp of a successful catalog sync.
 */
async function setLastCatalogSyncTime(timestamp: string): Promise<void> {
  await AsyncStorage.setItem(CATALOG_LAST_SYNC_KEY, timestamp);
}

/**
 * Raw catalog entry from Supabase RPC function.
 */
interface SupabaseCatalogEntry {
  id: string;
  game_mode: string;
  puzzle_date: string;
  difficulty: string | null;
  is_special: boolean | null;
}

/**
 * Sync puzzle catalog from Supabase to local SQLite.
 *
 * Calls the get_puzzle_catalog() RPC function which bypasses RLS,
 * returning metadata for all published puzzles. This allows the
 * Archive screen to show locked placeholders for premium content.
 *
 * Always performs a full sync to enable orphan detection - removes
 * local catalog entries that no longer exist on the server.
 *
 * @param since - Ignored (kept for backward compatibility, always does full sync)
 * @returns CatalogSyncResult with success status and count of synced entries
 */
export async function syncCatalogFromSupabase(
  since?: string | null
): Promise<CatalogSyncResult> {
  try {
    // Always do full sync (pass null) to enable orphan detection
    const { data: entries, error } = await supabase.rpc('get_puzzle_catalog', {
      since_timestamp: undefined,
    });

    if (error) {
      console.error('Catalog sync error:', error);
      return {
        success: false,
        error: error,
        syncedCount: 0,
      };
    }

    if (!entries) {
      return {
        success: true,
        syncedCount: 0,
      };
    }

    // Get local catalog IDs BEFORE saving new ones
    const localCatalogIds = await getAllLocalCatalogIds();
    const serverCatalogIds = new Set((entries as SupabaseCatalogEntry[]).map((e) => e.id));

    // Find orphans (local entries not on server)
    const orphanIds = localCatalogIds.filter((id) => !serverCatalogIds.has(id));

    // Delete orphaned catalog entries
    if (orphanIds.length > 0) {
      const deletedCount = await deleteCatalogByIds(orphanIds);
      console.log(`[CatalogSync] Deleted ${deletedCount} orphaned catalog entries`);
    }

    // Transform and save entries to SQLite
    const localEntries = (entries as SupabaseCatalogEntry[]).map(transformSupabaseCatalogToLocal);
    await saveCatalogEntries(localEntries);

    // Update last sync timestamp on success
    await setLastCatalogSyncTime(new Date().toISOString());

    return {
      success: true,
      syncedCount: entries.length,
    };
  } catch (error) {
    console.error('Catalog sync exception:', error);
    return {
      success: false,
      error: error as Error,
      syncedCount: 0,
    };
  }
}

/**
 * Transform a Supabase catalog entry to local SQLite format.
 */
function transformSupabaseCatalogToLocal(
  entry: SupabaseCatalogEntry
): LocalCatalogEntry {
  return {
    id: entry.id,
    game_mode: entry.game_mode,
    puzzle_date: entry.puzzle_date,
    difficulty: entry.difficulty,
    synced_at: null, // Will be set by saveCatalogEntries
    is_special: entry.is_special ? 1 : 0,
  };
}
