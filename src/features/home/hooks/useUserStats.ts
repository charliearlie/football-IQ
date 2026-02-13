import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getAllCompletedAttemptsWithDates, getTotalPuzzleCount, getCompletedPuzzleCount } from '@/lib/database';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { useAuth } from '@/features/auth';
import {
  getAvailableFreezes,
  getUsedFreezeDates,
  grantInitialFreeze,
  consumeFreeze,
  checkAndAwardMilestoneFreeze,
} from '@/features/streaks/services/streakFreezeService';
import { useAnalytics } from '@/hooks/useAnalytics';
import { onStatsChanged } from '@/lib/statsEvents';

/**
 * User statistics including streak information.
 */
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  gamesPlayedToday: number;
  totalGamesPlayed: number;
  totalPuzzlesAvailable: number;
  lastPlayedDate: string | null;
  availableFreezes: number;
}

/**
 * Result of the useUserStats hook.
 */
export interface UseUserStatsResult {
  stats: UserStats;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 * Uses the time integrity system for authorized date.
 */
function getTodayDate(): string {
  return getAuthorizedDateUnsafe();
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local timezone).
 */
function getYesterdayDate(): string {
  const today = getTodayDate();
  // Parse today's date and subtract one day
  const [year, month, day] = today.split('-').map(Number);
  const yesterday = new Date(year, month - 1, day - 1);
  return yesterday.toLocaleDateString('en-CA'); // YYYY-MM-DD local
}

/**
 * Calculate the difference in calendar days between two dates.
 * Uses UTC to avoid issues with DST transitions.
 *
 * @param date1 - The more recent date (YYYY-MM-DD string)
 * @param date2 - The earlier date (YYYY-MM-DD string)
 * @returns Number of days between the dates
 */
function getDaysDifference(date1: string, date2: string): number {
  // Parse as UTC to avoid DST issues
  const utc1 = Date.UTC(
    parseInt(date1.slice(0, 4)),
    parseInt(date1.slice(5, 7)) - 1,
    parseInt(date1.slice(8, 10))
  );
  const utc2 = Date.UTC(
    parseInt(date2.slice(0, 4)),
    parseInt(date2.slice(5, 7)) - 1,
    parseInt(date2.slice(8, 10))
  );
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate streak from an array of dates with completed attempts.
 * Returns current streak (consecutive days ending today or yesterday)
 * and longest streak ever achieved.
 *
 * @param attemptDates - Array of dates (YYYY-MM-DD) with completed attempts.
 * @param freezeDates - Array of dates (YYYY-MM-DD) where freezes were used to protect the streak.
 */
export function calculateStreak(
  attemptDates: string[],
  freezeDates: string[] = []
): {
  current: number;
  longest: number;
} {
  if (attemptDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Get unique dates, sorted descending (most recent first)
  const uniqueDates = [...new Set(attemptDates)].sort((a, b) => b.localeCompare(a));

  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Check if the most recent attempt is today or yesterday
  // If not, current streak is 0
  const mostRecent = uniqueDates[0];
  const streakIsActive =
    mostRecent === today ||
    mostRecent === yesterday;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let previousDateStr: string | null = null;

  /**
   * Check if a gap day is covered by a freeze.
   * Gap day is the day between previousDate and currentDate when diffDays === 2.
   */
  const isGapCoveredByFreeze = (previousDate: string, currentDate: string): boolean => {
    // Calculate the gap day (the day between the two dates)
    const [year, month, day] = currentDate.split('-').map(Number);
    const gapDay = new Date(year, month - 1, day + 1);
    const gapDayStr = gapDay.toLocaleDateString('en-CA'); // YYYY-MM-DD local
    return freezeDates.includes(gapDayStr);
  };

  for (const dateStr of uniqueDates) {
    if (previousDateStr === null) {
      // First date
      tempStreak = 1;
    } else {
      // Calculate difference in days using UTC to avoid DST issues
      const diffDays = getDaysDifference(previousDateStr, dateStr);

      if (diffDays === 1) {
        // Consecutive day
        tempStreak++;
      } else if (diffDays === 2 && isGapCoveredByFreeze(previousDateStr, dateStr)) {
        // 1-day gap covered by freeze - treat as consecutive
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    previousDateStr = dateStr;
  }

  // Don't forget to compare final streak
  longestStreak = Math.max(longestStreak, tempStreak);

  // Current streak is only valid if the most recent date is today or yesterday
  if (streakIsActive) {
    // Count from the beginning until streak breaks
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      // Use UTC-based calculation to avoid DST issues
      const diffDays = getDaysDifference(uniqueDates[i - 1], uniqueDates[i]);

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays === 2 && isGapCoveredByFreeze(uniqueDates[i - 1], uniqueDates[i])) {
        // 1-day gap covered by freeze - treat as consecutive
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Hook to get user statistics including streak calculations.
 *
 * Calculates global streak from local SQLite attempts (offline-first).
 * Streak increments when user completes at least 1 puzzle per day.
 *
 * Automatically refreshes when app comes to foreground (handles midnight transition).
 *
 * @example
 * ```tsx
 * function StatsDisplay() {
 *   const { stats, isLoading, refresh } = useUserStats();
 *
 *   if (isLoading) return <Text>Loading...</Text>;
 *
 *   return (
 *     <View>
 *       <Text>Current Streak: {stats.currentStreak}</Text>
 *       <Text>Games Today: {stats.gamesPlayedToday}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useUserStats(): UseUserStatsResult {
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0,
    longestStreak: 0,
    gamesPlayedToday: 0,
    totalGamesPlayed: 0,
    totalPuzzlesAvailable: 0,
    lastPlayedDate: null,
    availableFreezes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const lastCheckedDate = useRef<string>(getTodayDate());
  const { profile } = useAuth();
  const { capture } = useAnalytics();
  const initialFreezeGranted = useRef(false);

  const loadStats = useCallback(async () => {
    try {
      const attempts = await getAllCompletedAttemptsWithDates();
      const today = getTodayDate();
      const yesterday = getYesterdayDate();
      const isPremium = profile?.is_premium ?? false;

      // Grant initial freeze on first run
      if (!initialFreezeGranted.current) {
        const granted = await grantInitialFreeze();
        if (granted && __DEV__) {
          console.log('[StreakFreeze] Granted initial freeze');
        }
        initialFreezeGranted.current = true;
      }

      // Get all puzzle dates with completed attempts
      const attemptDates = attempts.map((a) => a.puzzle_date);

      // Get freeze data
      const [freezeDates, availableFreezes] = await Promise.all([
        getUsedFreezeDates(),
        getAvailableFreezes(),
      ]);

      // Calculate streaks with freeze dates
      const { current, longest } = calculateStreak(attemptDates, freezeDates);

      if (__DEV__) {
        const uniqueDates = [...new Set(attemptDates)].sort((a, b) => b.localeCompare(a));
        console.log('[Streak Debug] loadStats called', {
          uniqueDates: uniqueDates.slice(0, 10),
          totalAttempts: attemptDates.length,
          currentStreak: current,
          longestStreak: longest,
          gamesPlayedToday: attempts.filter(a => a.puzzle_date === today).length,
        });
      }

      // Count games played today
      const gamesPlayedToday = attempts.filter(
        (a) => a.puzzle_date === today
      ).length;

      // Get last played date
      const lastPlayedDate = attemptDates.length > 0 ? attemptDates[0] : null;

      // Check if we need to auto-consume a freeze for yesterday
      // This happens when:
      // 1. Last play was 2+ days ago (gap exists)
      // 2. Yesterday is not already in freeze dates
      // 3. User has freezes available (or is premium)
      // 4. All days between lastPlayedDate and yesterday are already frozen,
      //    so freezing yesterday completes the chain and protects the streak
      const canBridgeToLastPlay = (() => {
        if (!lastPlayedDate) return false;
        const gap = getDaysDifference(yesterday, lastPlayedDate);
        if (gap < 1) return false;
        // Walk each intermediate day (lastPlayedDate+1 … yesterday-1)
        for (let i = 1; i < gap; i++) {
          const d = Date.UTC(
            parseInt(lastPlayedDate.slice(0, 4)),
            parseInt(lastPlayedDate.slice(5, 7)) - 1,
            parseInt(lastPlayedDate.slice(8, 10)) + i
          );
          const dateStr = new Date(d).toISOString().slice(0, 10);
          if (!freezeDates.includes(dateStr)) return false;
        }
        return true;
      })();

      const needsFreeze =
        gamesPlayedToday === 0 &&
        lastPlayedDate !== today &&
        lastPlayedDate !== yesterday &&
        !freezeDates.includes(yesterday) &&
        (availableFreezes > 0 || isPremium) &&
        canBridgeToLastPlay;

      if (needsFreeze) {
        const result = await consumeFreeze(yesterday, isPremium);
        if (result.success) {
          // Track analytics
          capture('STREAK_FREEZE_USED', {
            streak_length: current,
            freeze_source: result.source,
          });

          // Recalculate streak with new freeze date
          const updatedFreezeDates = await getUsedFreezeDates();
          const updatedStreak = calculateStreak(attemptDates, updatedFreezeDates);

          // Update available freezes count
          const updatedAvailableFreezes = isPremium ? Infinity : result.remainingFreezes;

          // Use catalog-backed counts for consistency with Archive screen
          const [totalPuzzlesAvailable, totalGamesPlayed] = await Promise.all([
            getTotalPuzzleCount(),
            getCompletedPuzzleCount(),
          ]);

          setStats({
            currentStreak: updatedStreak.current,
            longestStreak: Math.max(longest, updatedStreak.longest),
            gamesPlayedToday,
            totalGamesPlayed,
            totalPuzzlesAvailable,
            lastPlayedDate,
            availableFreezes: updatedAvailableFreezes,
          });
          setIsLoading(false);
          return;
        }
      }

      // Check and award milestone freeze (7, 14, 21, etc.)
      const milestoneResult = await checkAndAwardMilestoneFreeze(current, isPremium);
      if (milestoneResult.awarded) {
        // Track analytics
        capture('STREAK_FREEZE_EARNED', {
          streak_milestone: milestoneResult.milestone!,
          total_freezes: milestoneResult.totalFreezes,
        });
      }

      // Get final available freezes (may have been updated by milestone award)
      const finalAvailableFreezes = isPremium
        ? Infinity
        : await getAvailableFreezes();

      // Use catalog-backed counts for consistency with Archive screen
      const [totalPuzzlesAvailable, totalGamesPlayed] = await Promise.all([
        getTotalPuzzleCount(),
        getCompletedPuzzleCount(),
      ]);

      setStats({
        currentStreak: current,
        longestStreak: longest,
        gamesPlayedToday,
        totalGamesPlayed,
        totalPuzzlesAvailable,
        lastPlayedDate,
        availableFreezes: finalAvailableFreezes,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.is_premium, capture]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadStats();
  }, [loadStats]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Refresh when a game completes (statsChanged event from useGamePersistence)
  useEffect(() => {
    return onStatsChanged(() => {
      loadStats();
    });
  }, [loadStats]);

  // Refresh on app state change (handles midnight transition)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const today = getTodayDate();
        // If the date has changed since last check, refresh stats
        if (today !== lastCheckedDate.current) {
          lastCheckedDate.current = today;
          refresh();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refresh]);

  return { stats, isLoading, refresh };
}
