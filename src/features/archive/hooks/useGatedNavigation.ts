/**
 * useGatedNavigation Hook
 *
 * Centralizes premium gating logic for navigation actions.
 * Returns a function that either navigates to the puzzle
 * or triggers the paywall modal based on lock status.
 */

import { useCallback } from 'react';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '@/features/auth';
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
 * Trusts the puzzle's `isLocked` property from the archive list,
 * which is already computed based on premium status, free window,
 * and ad unlocks. This avoids stale closure issues.
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
      console.log('[useGatedNavigation] Navigate requested:', {
        puzzleId: puzzle.id,
        puzzleDate: puzzle.puzzleDate,
        isLocked: puzzle.isLocked,
        status: puzzle.status,
        gameMode: puzzle.gameMode,
      });

      // Trust the puzzle's isLocked property from the archive list
      // The list already checks isPuzzleLocked with the latest adUnlocks
      // This avoids stale closure issues with adUnlocks state
      if (puzzle.isLocked) {
        console.log('[useGatedNavigation] BLOCKED - showing paywall');
        // User doesn't have access - show paywall/unlock modal
        options.onShowPaywall(puzzle);
        return;
      }

      console.log('[useGatedNavigation] ALLOWED - navigating to game');
      // User has access - navigate to puzzle
      const route = GAME_MODE_ROUTES[puzzle.gameMode];
      if (route) {
        // Navigate to dynamic route with puzzle ID
        // Navigate to dynamic route with puzzle ID and Date for synchronous checks
        const href = {
          pathname: `/${route}/[puzzleId]`,
          params: {
            puzzleId: puzzle.id,
            puzzleDate: puzzle.puzzleDate // Pass date for PremiumGate sync check
          }
        } as unknown as Href;
        router.push(href);
      }
    },
    [router, options]
  );

  return {
    navigateToPuzzle,
    isPremium,
  };
}
