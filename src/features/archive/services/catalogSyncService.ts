/**
 * Catalog Sync Service
 *
 * Handles syncing puzzle catalog (metadata only) from Supabase to SQLite.
 * Uses an RPC function that bypasses RLS, allowing all users to see
 * what puzzles exist (for showing "locked" placeholders).
 */

import { supabase } from '@/lib/supabase';
import { saveCatalogEntries } from '@/lib/database';
import { LocalCatalogEntry } from '@/types/database';
import { CatalogSyncResult } from '../types/archive.types';

/**
 * Raw catalog entry from Supabase RPC function.
 */
interface SupabaseCatalogEntry {
  id: string;
  game_mode: string;
  puzzle_date: string;
  difficulty: string | null;
}

/**
 * Sync puzzle catalog from Supabase to local SQLite.
 *
 * Calls the get_puzzle_catalog() RPC function which bypasses RLS,
 * returning metadata for all published puzzles. This allows the
 * Archive screen to show locked placeholders for premium content.
 *
 * @returns CatalogSyncResult with success status and count of synced entries
 */
export async function syncCatalogFromSupabase(): Promise<CatalogSyncResult> {
  try {
    // Call RPC function that bypasses RLS
    // The function returns array of {id, game_mode, puzzle_date, difficulty}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_puzzle_catalog');

    if (error) {
      console.error('Catalog sync error:', error);
      return {
        success: false,
        error: error as Error,
        syncedCount: 0,
      };
    }

    // Cast to expected type - RPC returns unknown type
    const entries = data as SupabaseCatalogEntry[] | null;

    if (!entries || entries.length === 0) {
      return {
        success: true,
        syncedCount: 0,
      };
    }

    // Transform and save entries to SQLite
    const localEntries = entries.map(transformSupabaseCatalogToLocal);
    await saveCatalogEntries(localEntries);

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
  };
}
