/**
 * useNextPuzzle - Session chaining hook
 *
 * Finds the next unplayed daily puzzle and returns navigation helpers
 * so result modals can offer a "Next Puzzle" button without routing
 * the user back to the home screen.
 *
 * Usage:
 *   const nextPuzzle = useNextPuzzle(showNextPuzzle);
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useDailyPuzzles } from '@/features/home/hooks/useDailyPuzzles';
import { useDailyProgress } from '@/features/home/hooks/useDailyProgress';
import { getGameRoute } from '@/lib/gameRoutes';

export interface UseNextPuzzleResult {
  /** Whether there is at least one unplayed puzzle remaining */
  hasNext: boolean;
  /** Navigate to the next unplayed puzzle using router.replace */
  goToNext: () => void;
  /** Button label, e.g. "Next Puzzle (3 of 5)" or "Final Puzzle (5 of 5)". Null when no next puzzle. */
  buttonLabel: string | null;
  /** True when every puzzle for today is completed */
  allDone: boolean;
  /** How many puzzles have been completed today */
  completedCount: number;
  /** Total number of daily puzzles today */
  totalCount: number;
}

/**
 * Returns navigation helpers for moving to the next unplayed daily puzzle.
 *
 * @param enabled - When false (e.g. in review mode) returns safe no-op defaults.
 */
export function useNextPuzzle(enabled: boolean = true): UseNextPuzzleResult {
  const router = useRouter();
  const { cards, isLoading } = useDailyPuzzles();
  const progress = useDailyProgress(cards);

  const nextCard = enabled && !isLoading
    ? cards.find((c) => c.status === 'play' || c.status === 'resume') ?? null
    : null;

  const goToNext = useCallback(() => {
    if (!nextCard) return;
    router.replace(getGameRoute(nextCard.gameMode, nextCard.puzzleId) as never);
  }, [router, nextCard]);

  if (!enabled || isLoading) {
    return {
      hasNext: false,
      goToNext,
      buttonLabel: null,
      allDone: false,
      completedCount: 0,
      totalCount: 0,
    };
  }

  const { completedCount, totalCount, isComplete } = progress;

  // Count unplayed cards to distinguish "next" from "final"
  const unplayedCount = cards.filter(
    (c) => c.status === 'play' || c.status === 'resume',
  ).length;

  let buttonLabel: string | null = null;
  if (nextCard !== null) {
    buttonLabel = unplayedCount === 1 ? 'Final Puzzle' : 'Next Puzzle';
  }

  return {
    hasNext: nextCard !== null,
    goToNext,
    buttonLabel,
    allDone: isComplete,
    completedCount,
    totalCount,
  };
}
