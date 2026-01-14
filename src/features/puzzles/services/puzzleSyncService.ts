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
import { savePuzzle } from '@/lib/database';
import { LocalPuzzle } from '@/types/database';
import { SupabasePuzzle, SyncResult, PuzzleSyncOptions } from '../types/puzzle.types';

/**
 * Sync puzzles from Supabase to local SQLite.
 *
 * @param options - Sync options including user info and last sync timestamp
 * @returns SyncResult with success status and count of synced puzzles
 */
export async function syncPuzzlesFromSupabase(
  options: PuzzleSyncOptions
): Promise<SyncResult> {
  const { isPremium, lastSyncedAt } = options;

  try {
    // Build query - RLS will filter based on user's access tier
    let query = supabase.from('daily_puzzles').select('*');

    // For premium users with a last sync timestamp, do incremental sync
    if (isPremium && lastSyncedAt) {
      query = query.gt('updated_at', lastSyncedAt);
    }

    const { data: puzzles, error } = await query;

    if (error) {
      return {
        success: false,
        error: error as Error,
        syncedCount: 0,
      };
    }

    if (!puzzles || puzzles.length === 0) {
      return {
        success: true,
        syncedCount: 0,
      };
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
