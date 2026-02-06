import { useMemo } from 'react';
import { usePuzzleContext } from '../context/PuzzleContext';
import { GameMode, UsePuzzleResult } from '../types/puzzle.types';

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
  'guess_the_transfer',
  'guess_the_goalscorers',
  'topical_quiz',
  'top_tens',
  'starting_xi',
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
 * @param gameModeOrPuzzleId - Either a GameMode or a puzzle UUID
 * @returns Object containing puzzle, loading state, and refetch function
 *
 * @example
 * ```tsx
 * // Get today's Career Path puzzle
 * function TodaysGame() {
 *   const { puzzle, isLoading } = usePuzzle('career_path');
 *   // ...
 * }
 *
 * // Get a specific puzzle by ID (from archive or route param)
 * function ArchiveGame({ puzzleId }: { puzzleId: string }) {
 *   const { puzzle, isLoading } = usePuzzle(puzzleId);
 *   // ...
 * }
 * ```
 */
export function usePuzzle(gameModeOrPuzzleId: GameMode | string): UsePuzzleResult {
  const { puzzles, hasHydrated, syncPuzzles } = usePuzzleContext();

  const today = useMemo(() => getTodayDate(), []);

  const puzzle = useMemo(() => {
    if (isGameMode(gameModeOrPuzzleId)) {
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
  }, [puzzles, today, gameModeOrPuzzleId]);

  // Only show loading when we haven't hydrated local data yet AND don't have the puzzle
  // Once hydrated, background syncs don't trigger loading state
  const isLoading = !hasHydrated && puzzle === null;

  return {
    puzzle,
    isLoading,
    refetch: syncPuzzles,
  };
}
