import { useEffect, useMemo, useRef, useState } from 'react';
import { usePuzzleContext } from '../context/PuzzleContext';
import { GameMode, UsePuzzleResult } from '../types/puzzle.types';
import { fetchAndSavePuzzle } from '../services/puzzleSyncService';

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * List of valid game modes for type checking.
 */
const GAME_MODES: GameMode[] = [
  'career_path',
  'career_path_pro',
  'the_grid',
  'the_chain',
  'the_thread',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'topical_quiz',
  'top_tens',
  'starting_xi',
  'connections',
  'timeline',
  'who_am_i',
];

/**
 * Check if a string is a valid game mode.
 */
function isGameMode(value: string): value is GameMode {
  return GAME_MODES.includes(value as GameMode);
}

/**
 * Hook to get a puzzle by game mode (today's puzzle) or by puzzle ID.
 *
 * Supports two usage patterns:
 * 1. `usePuzzle('career_path')` - Get today's puzzle for a game mode
 * 2. `usePuzzle('uuid-here')` - Get a specific puzzle by ID (for archive/history)
 *
 * When looking up by puzzle ID, if the puzzle is not found locally
 * (e.g. ad-unlocked archive puzzles outside the sync window),
 * it will attempt a single on-demand fetch from Supabase.
 *
 * @param gameModeOrPuzzleId - Either a GameMode or a puzzle UUID
 * @returns Object containing puzzle, loading state, and refetch function
 */
export function usePuzzle(gameModeOrPuzzleId: GameMode | string): UsePuzzleResult {
  const { puzzles, hasHydrated, syncPuzzles, refreshLocalPuzzles } = usePuzzleContext();
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const fetchAttemptedRef = useRef<string | null>(null);

  const today = useMemo(() => getTodayDate(), []);
  const isPuzzleIdLookup = !isGameMode(gameModeOrPuzzleId);

  const puzzle = useMemo(() => {
    if (!isPuzzleIdLookup) {
      // Game mode lookup: find today's puzzle for this mode
      return (
        puzzles.find(
          (p) => p.puzzle_date === today && p.game_mode === gameModeOrPuzzleId
        ) ?? null
      );
    } else {
      // Puzzle ID lookup: find puzzle by ID directly
      return puzzles.find((p) => p.id === gameModeOrPuzzleId) ?? null;
    }
  }, [puzzles, today, gameModeOrPuzzleId, isPuzzleIdLookup]);

  // On-demand fetch: when looking up by puzzle ID, puzzle is not found locally,
  // and we haven't already tried fetching this ID
  useEffect(() => {
    if (
      isPuzzleIdLookup &&
      hasHydrated &&
      puzzle === null &&
      fetchAttemptedRef.current !== gameModeOrPuzzleId
    ) {
      fetchAttemptedRef.current = gameModeOrPuzzleId;
      setIsFetchingRemote(true);

      fetchAndSavePuzzle(gameModeOrPuzzleId)
        .then((result) => {
          if (result) {
            // Puzzle saved to SQLite — refresh context to pick it up
            refreshLocalPuzzles();
          }
        })
        .catch((err) => {
          console.warn('[usePuzzle] On-demand fetch failed:', err);
        })
        .finally(() => {
          setIsFetchingRemote(false);
        });
    }
  }, [isPuzzleIdLookup, hasHydrated, puzzle, gameModeOrPuzzleId, refreshLocalPuzzles]);

  // Show loading when:
  // 1. Haven't hydrated local data yet AND puzzle not found
  // 2. Actively fetching from remote for a missing puzzle ID
  const isLoading = (!hasHydrated && puzzle === null) || isFetchingRemote;

  return {
    puzzle,
    isLoading,
    refetch: syncPuzzles,
  };
}
