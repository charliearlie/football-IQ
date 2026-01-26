/**
 * useRandomPlay Hook
 *
 * Provides random unplayed puzzle selection with premium gating.
 * Selects a random puzzle the user hasn't completed and navigates to it.
 *
 * Gating rules:
 * - Non-premium users: 7-day window + ad-unlocked puzzles, excludes career_path_pro/top_tens
 * - Premium users: full backlog, all game modes
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '@/features/auth';
import { getRandomUnplayedPuzzle } from '@/lib/database';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { triggerMedium } from '@/lib/haptics';
import { GAME_MODE_ROUTES } from '../constants/routes';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Return type for useRandomPlay hook.
 */
interface UseRandomPlayResult {
  /** Trigger random play - finds and navigates to random unplayed puzzle */
  playRandom: () => Promise<void>;
  /** Whether a random puzzle is being selected */
  isLoading: boolean;
}

/**
 * Calculate the start date of the 7-day free window.
 * Free window = today + 6 previous days (7 total)
 *
 * Pattern from: src/features/archive/utils/dateGrouping.ts
 */
function getFreeWindowStartDate(): string {
  const todayStr = getAuthorizedDateUnsafe();
  const today = new Date(todayStr + 'T12:00:00');
  today.setDate(today.getDate() - 6);
  return today.toISOString().split('T')[0];
}

/**
 * Hook that provides random unplayed puzzle selection.
 *
 * Ignores current filters and selects from all accessible unplayed puzzles.
 * Users wanting a specific game mode can filter and manually select instead.
 *
 * @returns playRandom function and loading state
 *
 * @example
 * ```tsx
 * const { playRandom, isLoading } = useRandomPlay();
 *
 * <ElevatedButton
 *   title="Random Unplayed Game"
 *   onPress={playRandom}
 *   disabled={isLoading}
 * />
 * ```
 */
export function useRandomPlay(): UseRandomPlayResult {
  const router = useRouter();
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  const [isLoading, setIsLoading] = useState(false);

  const playRandom = useCallback(async () => {
    // Haptic feedback immediately (medium impact)
    triggerMedium();

    setIsLoading(true);

    try {
      const freeWindowStart = getFreeWindowStartDate();
      const puzzle = await getRandomUnplayedPuzzle(isPremium, freeWindowStart);

      if (!puzzle) {
        // No unplayed puzzles available
        Alert.alert(
          'All Caught Up!',
          isPremium
            ? "You've played all available puzzles. Check back tomorrow for new games!"
            : "You've played all free puzzles. Upgrade to Pro for unlimited access to the full archive!",
          [{ text: 'OK' }]
        );
        return;
      }

      if (__DEV__) {
        console.log('[useRandomPlay] Selected random puzzle:', {
          id: puzzle.id,
          gameMode: puzzle.game_mode,
          date: puzzle.puzzle_date,
        });
      }

      // Navigate to the puzzle
      const route = GAME_MODE_ROUTES[puzzle.game_mode as GameMode];
      if (route) {
        const href = {
          pathname: `/${route}/[puzzleId]`,
          params: {
            puzzleId: puzzle.id,
            puzzleDate: puzzle.puzzle_date,
          },
        } as unknown as Href;
        router.push(href);
      }
    } catch (error) {
      console.error('[useRandomPlay] Error:', error);
      Alert.alert('Error', 'Failed to find a random puzzle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isPremium, router]);

  return {
    playRandom,
    isLoading,
  };
}
