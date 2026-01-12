/**
 * useGatedNavigation Hook
 *
 * Centralizes premium gating logic for navigation actions.
 * Returns a function that either navigates to the puzzle
 * or triggers the paywall modal based on premium status.
 */

import { useCallback } from 'react';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '@/features/auth';
import { useAds } from '@/features/ads';
import { isPuzzleLocked } from '../utils/dateGrouping';
import { ArchivePuzzle } from '../types/archive.types';
import { GAME_MODE_ROUTES } from '../constants/routes';

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
 * - Ad unlocks (individual puzzle unlocks via rewarded ads)
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
  const { adUnlocks } = useAds();
  const isPremium = profile?.is_premium ?? false;

  const navigateToPuzzle = useCallback(
    (puzzle: ArchivePuzzle) => {
      // Check if user has access to this puzzle
      // Includes premium status, 7-day window, and ad unlocks
      const isLocked = isPuzzleLocked(
        puzzle.puzzleDate,
        isPremium,
        puzzle.id,
        adUnlocks
      );

      if (isLocked) {
        // User doesn't have access - show paywall/unlock modal
        options.onShowPaywall(puzzle);
        return;
      }

      // User has access - navigate to puzzle
      const route = GAME_MODE_ROUTES[puzzle.gameMode];
      if (route) {
        // Navigate to dynamic route with puzzle ID
        const href = `/${route}/${puzzle.id}` as Href;
        router.push(href);
      }
    },
    [isPremium, adUnlocks, router, options]
  );

  return {
    navigateToPuzzle,
    isPremium,
  };
}
