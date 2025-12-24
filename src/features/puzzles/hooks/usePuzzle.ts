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
 * Hook to get the puzzle for today's date and specified game mode.
 *
 * @param gameMode - The game mode to get the puzzle for
 * @returns Object containing puzzle, loading state, and refetch function
 *
 * @example
 * ```tsx
 * function CareerPathGame() {
 *   const { puzzle, isLoading, refetch } = usePuzzle('career_path');
 *
 *   if (isLoading) return <Text>Downloading Puzzles...</Text>;
 *   if (!puzzle) return <Text>No puzzle available</Text>;
 *
 *   return <PuzzleScreen puzzle={puzzle} />;
 * }
 * ```
 */
export function usePuzzle(gameMode: GameMode): UsePuzzleResult {
  const { puzzles, syncStatus, syncPuzzles } = usePuzzleContext();

  const today = useMemo(() => getTodayDate(), []);

  const puzzle = useMemo(() => {
    return (
      puzzles.find(
        (p) => p.puzzle_date === today && p.game_mode === gameMode
      ) ?? null
    );
  }, [puzzles, today, gameMode]);

  return {
    puzzle,
    isLoading: syncStatus === 'syncing',
    refetch: syncPuzzles,
  };
}
