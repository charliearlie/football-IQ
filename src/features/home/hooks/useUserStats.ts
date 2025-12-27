import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getAllCompletedAttemptsWithDates } from '@/lib/database';

/**
 * User statistics including streak information.
 */
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  gamesPlayedToday: number;
  totalGamesPlayed: number;
  lastPlayedDate: string | null;
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
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format.
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Calculate streak from an array of dates with completed attempts.
 * Returns current streak (consecutive days ending today or yesterday)
 * and longest streak ever achieved.
 */
export function calculateStreak(attemptDates: string[]): {
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
  const streakIsActive = mostRecent === today || mostRecent === yesterday;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let previousDate: Date | null = null;

  for (const dateStr of uniqueDates) {
    const currentDate = new Date(dateStr + 'T00:00:00');

    if (previousDate === null) {
      // First date
      tempStreak = 1;
    } else {
      // Calculate difference in days
      const diffTime = previousDate.getTime() - currentDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    previousDate = currentDate;
  }

  // Don't forget to compare final streak
  longestStreak = Math.max(longestStreak, tempStreak);

  // Current streak is only valid if the most recent date is today or yesterday
  if (streakIsActive) {
    // Count from the beginning until streak breaks
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const curr = new Date(uniqueDates[i - 1] + 'T00:00:00');
      const prev = new Date(uniqueDates[i] + 'T00:00:00');
      const diffTime = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
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
    lastPlayedDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const lastCheckedDate = useRef<string>(getTodayDate());

  const loadStats = useCallback(async () => {
    try {
      const attempts = await getAllCompletedAttemptsWithDates();
      const today = getTodayDate();

      // Get all puzzle dates with completed attempts
      const attemptDates = attempts.map((a) => a.puzzle_date);

      // Calculate streaks
      const { current, longest } = calculateStreak(attemptDates);

      // Count games played today
      const gamesPlayedToday = attempts.filter(
        (a) => a.puzzle_date === today
      ).length;

      // Get last played date
      const lastPlayedDate = attemptDates.length > 0 ? attemptDates[0] : null;

      setStats({
        currentStreak: current,
        longestStreak: longest,
        gamesPlayedToday,
        totalGamesPlayed: attempts.length,
        lastPlayedDate,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadStats();
  }, [loadStats]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
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
