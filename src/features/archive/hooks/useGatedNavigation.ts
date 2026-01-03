/**
 * useGatedNavigation Hook
 *
 * Centralizes premium gating logic for navigation actions.
 * Returns a function that either navigates to the puzzle
 * or triggers the paywall modal based on premium status.
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { isPuzzleLocked } from '../utils/dateGrouping';
import { ArchivePuzzle, GameMode } from '../types/archive.types';

/**
 * Route map for each game mode.
 */
const ROUTE_MAP: Record<GameMode, string> = {
  career_path: 'career-path',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  tic_tac_toe: 'tic-tac-toe',
  topical_quiz: 'topical-quiz',
};

/**
 * Options for useGatedNavigation hook.
 */
interface UseGatedNavigationOptions {
  /**
   * Callback when a puzzle should show the paywall.
   * Called with the puzzle that triggered the paywall.
   */
  onShowPaywall: (puzzle: ArchivePuzzle) => void;
}

/**
 * Return type for useGatedNavigation hook.
 */
interface UseGatedNavigationResult {
  /**
   * Navigate to a puzzle, checking premium status first.
   * If the user doesn't have access, triggers onShowPaywall instead.
   */
  navigateToPuzzle: (puzzle: ArchivePuzzle) => void;
  /**
   * Whether the current user has premium access.
   */
  isPremium: boolean;
}

/**
 * Hook that provides gated navigation for archive puzzles.
 *
 * Checks if the user has access to a puzzle based on:
 * - Premium status
 * - Puzzle date (7-day free window)
 *
 * @param options - Configuration options
 * @returns Navigation function and premium status
 *
 * @example
 * ```tsx
 * const { navigateToPuzzle } = useGatedNavigation({
 *   onShowPaywall: (puzzle) => setLockedPuzzle(puzzle),
 * });
 *
 * // Use for all puzzle card presses
 * <ArchiveList onPuzzlePress={navigateToPuzzle} />
 * ```
 */
export function useGatedNavigation(
  options: UseGatedNavigationOptions
): UseGatedNavigationResult {
  const router = useRouter();
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  const navigateToPuzzle = useCallback(
    (puzzle: ArchivePuzzle) => {
      // Check if user has access to this puzzle
      const isLocked = isPuzzleLocked(puzzle.puzzleDate, isPremium);

      if (isLocked) {
        // User doesn't have access - show paywall
        options.onShowPaywall(puzzle);
        return;
      }

      // User has access - navigate to puzzle
      const route = ROUTE_MAP[puzzle.gameMode];
      if (route) {
        // Navigate to dynamic route with puzzle ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/${route}/${puzzle.id}` as any);
      }
    },
    [isPremium, router, options]
  );

  return {
    navigateToPuzzle,
    isPremium,
  };
}
