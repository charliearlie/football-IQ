/**
 * usePlayToUnlock Hook
 *
 * Implements the "Play 3, Unlock 1" archive mechanic:
 * - Tracks today's completed puzzle count across all game modes
 * - After 3 completions, grants 1 free archive unlock
 * - Max 1 unlock per day via this mechanic
 * - Premium users are unaffected (already have full archive access)
 *
 * Listens to statsChanged events so it reacts immediately when a game completes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth';
import {
  getTodayCompletedCount,
  hasPlayToUnlockGrantedToday,
  markPlayToUnlockGranted,
  getRandomLockedPuzzleId,
  saveAdUnlock,
  isDatabaseReady,
} from '@/lib/database';
import { fetchAndSavePuzzle } from '@/features/puzzles/services/puzzleSyncService';
import { onStatsChanged } from '@/lib/statsEvents';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import * as Haptics from 'expo-haptics';

/** Number of daily completions required to earn 1 archive unlock */
const REQUIRED_COMPLETIONS = 3;

export interface PlayToUnlockState {
  /** Number of puzzles completed today */
  completedToday: number;
  /** Whether the daily unlock has already been granted */
  unlockGranted: boolean;
  /** Number of completions still needed (0 if already granted) */
  remaining: number;
  /** Whether data is still loading */
  isLoading: boolean;
  /** The puzzle ID that was just unlocked (for toast/animation), cleared after display */
  justUnlockedPuzzleId: string | null;
}

/**
 * Hook to manage the "Play 3, Unlock 1" archive mechanic.
 *
 * @returns Current progress state and a function to dismiss the unlock notification
 */
export function usePlayToUnlock(): PlayToUnlockState & {
  dismissUnlock: () => void;
} {
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  const [completedToday, setCompletedToday] = useState(0);
  const [unlockGranted, setUnlockGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [justUnlockedPuzzleId, setJustUnlockedPuzzleId] = useState<string | null>(null);

  // Prevent concurrent grant operations
  const grantingRef = useRef(false);

  /**
   * Refresh the current state from database.
   */
  const refresh = useCallback(async () => {
    if (!isDatabaseReady()) return;

    try {
      const [count, granted] = await Promise.all([
        getTodayCompletedCount(),
        hasPlayToUnlockGrantedToday(),
      ]);
      setCompletedToday(count);
      setUnlockGranted(granted);
      setIsLoading(false);

      // Check if we should grant an unlock
      if (
        !isPremium &&
        !granted &&
        !grantingRef.current &&
        count >= REQUIRED_COMPLETIONS
      ) {
        grantingRef.current = true;
        try {
          await grantPlayToUnlock();
        } finally {
          grantingRef.current = false;
        }
      }
    } catch (error) {
      console.error('[usePlayToUnlock] Refresh failed:', error);
      setIsLoading(false);
    }
  }, [isPremium]);

  /**
   * Grant the daily play-to-unlock reward.
   */
  const grantPlayToUnlock = async () => {
    // Calculate the free window start date (today - 2 days)
    const todayStr = getAuthorizedDateUnsafe();
    const today = new Date(todayStr + 'T12:00:00');
    today.setDate(today.getDate() - 2);
    const freeWindowStart = today.toISOString().split('T')[0];

    const puzzleId = await getRandomLockedPuzzleId(freeWindowStart);

    if (puzzleId) {
      // Grant the unlock (same as ad unlock — permanent)
      await saveAdUnlock(puzzleId);
      await markPlayToUnlockGranted();

      // Pre-fetch the puzzle content so it's playable immediately
      fetchAndSavePuzzle(puzzleId).catch((err) => {
        console.warn('[usePlayToUnlock] Pre-fetch puzzle failed:', err);
      });

      setUnlockGranted(true);
      setJustUnlockedPuzzleId(puzzleId);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { /* ignore */ }

      if (__DEV__) {
        console.log('[usePlayToUnlock] Granted archive unlock for puzzle:', puzzleId);
      }
    } else {
      // No locked puzzles available (user has unlocked everything)
      await markPlayToUnlockGranted();
      setUnlockGranted(true);

      if (__DEV__) {
        console.log('[usePlayToUnlock] No locked puzzles available to unlock');
      }
    }
  };

  const dismissUnlock = useCallback(() => {
    setJustUnlockedPuzzleId(null);
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for game completions via statsChanged events
  useEffect(() => {
    const unsubscribe = onStatsChanged(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const remaining = unlockGranted
    ? 0
    : Math.max(0, REQUIRED_COMPLETIONS - completedToday);

  return {
    completedToday,
    unlockGranted,
    remaining,
    isLoading,
    justUnlockedPuzzleId,
    dismissUnlock,
  };
}
