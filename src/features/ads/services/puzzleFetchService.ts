/**
 * Puzzle Fetch Service
 *
 * Fetches individual puzzles from Supabase on-demand.
 * Used when unlocking archive puzzles via ads - fetches the full puzzle
 * content and saves it to local SQLite for offline access.
 */

import { supabase } from '@/lib/supabase';
import { getPuzzle, savePuzzle } from '@/lib/database';
import { transformSupabasePuzzleToLocal } from '@/features/puzzles/services/puzzleSyncService';
import { SupabasePuzzle } from '@/features/puzzles/types/puzzle.types';

/**
 * Fetch a puzzle from Supabase and save it to local SQLite.
 *
 * This is used when a free user unlocks an archive puzzle via ad.
 * The puzzle may not exist locally (free users only sync 7 days),
 * so we fetch it directly from Supabase.
 *
 * @param puzzleId - The UUID of the puzzle to fetch
 * @throws Error if puzzle not found or fetch fails
 */
export async function fetchAndSavePuzzle(puzzleId: string): Promise<void> {
  // Check if puzzle already exists locally
  const existing = await getPuzzle(puzzleId);
  if (existing) {
    return;
  }

  // Fetch from Supabase using RPC that bypasses RLS
  // Free users can't access old puzzles via direct query (RLS blocks them),
  // so we use a SECURITY DEFINER function that runs with elevated privileges
  const { data, error } = await supabase
    .rpc('get_puzzle_by_id', { puzzle_id: puzzleId })
    .maybeSingle();

  if (error) {
    console.error('[puzzleFetchService] Failed to fetch puzzle:', error);
    throw error;
  }

  if (!data) {
    throw new Error(`Puzzle not found: ${puzzleId}`);
  }

  // Transform and save to local SQLite
  const localPuzzle = transformSupabasePuzzleToLocal(data as SupabasePuzzle);
  await savePuzzle(localPuzzle);
}
