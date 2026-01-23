/**
 * Puzzle Sync Service
 *
 * Handles syncing puzzles from Supabase (cloud) to SQLite (local).
 * RLS on the Supabase side automatically filters puzzles based on user tier:
 * - Anonymous: Today's puzzle only
 * - Free: Last 7 days
 * - Premium: Full archive
 */

import { supabase } from '@/lib/supabase';
import { savePuzzle, getAllLocalPuzzleIds, deletePuzzlesByIds } from '@/lib/database';
import { LocalPuzzle } from '@/types/database';
import { SupabasePuzzle, SyncResult, PuzzleSyncOptions } from '../types/puzzle.types';

/**
 * Sync puzzles from Supabase to local SQLite.
 *
 * Fetches all puzzles the user has access to (RLS-filtered) and:
 * 1. Detects orphaned local puzzles (deleted from server)
 * 2. Removes orphans from local SQLite
 * 3. Saves/updates all puzzles from server
 *
 * @param options - Sync options including user info and last sync timestamp
 * @returns SyncResult with success status and count of synced puzzles
 */
export async function syncPuzzlesFromSupabase(
  options: PuzzleSyncOptions
): Promise<SyncResult> {
  // Note: options.isPremium and options.lastSyncedAt are available but we
  // always do a full sync to enable orphan detection

  try {
    // Fetch ALL puzzles - RLS will filter based on user's access tier
    // We don't use incremental sync anymore to enable orphan detection
    const { data: puzzles, error } = await supabase
      .from('daily_puzzles')
      .select('*');

    if (error) {
      return {
        success: false,
        error: error as Error,
        syncedCount: 0,
      };
    }

    if (!puzzles) {
      return {
        success: true,
        syncedCount: 0,
      };
    }

    // Get local puzzle IDs BEFORE saving new ones
    const localPuzzleIds = await getAllLocalPuzzleIds();
    const serverPuzzleIds = new Set(puzzles.map((p) => p.id));

    // Find orphans (local puzzles not on server)
    const orphanIds = localPuzzleIds.filter((id) => !serverPuzzleIds.has(id));

    // Delete orphaned puzzles
    if (orphanIds.length > 0) {
      const deletedCount = await deletePuzzlesByIds(orphanIds);
      console.log(`[PuzzleSync] Deleted ${deletedCount} orphaned puzzles`);
    }

    // Transform and save each puzzle to SQLite
    for (const puzzle of puzzles) {
      const localPuzzle = transformSupabasePuzzleToLocal(puzzle as SupabasePuzzle);
      await savePuzzle(localPuzzle);
    }

    return {
      success: true,
      syncedCount: puzzles.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      syncedCount: 0,
    };
  }
}

/**
 * Transform a Supabase puzzle to local SQLite format.
 *
 * Key transformations:
 * - JSON content is stringified for SQLite storage
 * - synced_at is set to current timestamp
 */
export function transformSupabasePuzzleToLocal(puzzle: SupabasePuzzle): LocalPuzzle {
  return {
    id: puzzle.id,
    game_mode: puzzle.game_mode,
    puzzle_date: puzzle.puzzle_date,
    content: JSON.stringify(puzzle.content),
    difficulty: puzzle.difficulty,
    synced_at: new Date().toISOString(),
    updated_at: puzzle.updated_at, // Preserve server timestamp for staleness detection
  };
}

/**
 * Fetch a specific puzzle from Supabase and save it locally.
 * Used as a fallback when a puzzle is missing from local storage
 * (e.g. ad-unlocked archive puzzles).
 *
 * Uses a SECURITY DEFINER RPC to bypass RLS for free users who
 * have triggered a valid unlock action (like watching an ad).
 *
 * @param id - The UUID of the puzzle to fetch
 * @returns The parsed local puzzle if found, null otherwise
 */
export async function fetchAndSavePuzzle(
  id: string
): Promise<LocalPuzzle | null> {
  try {
    // Use RPC to bypass RLS (same as in ad fetch service)
    const { data, error } = await supabase
      .rpc('get_puzzle_by_id', { puzzle_id: id })
      .maybeSingle();

    if (error || !data) {
      console.warn('[fetchAndSavePuzzle] Failed to fetch puzzle:', error);
      return null;
    }

    const localPuzzle = transformSupabasePuzzleToLocal(data as SupabasePuzzle);
    await savePuzzle(localPuzzle);
    return localPuzzle;
  } catch (error) {
    console.error('[fetchAndSavePuzzle] Error:', error);
    return null;
  }
}
