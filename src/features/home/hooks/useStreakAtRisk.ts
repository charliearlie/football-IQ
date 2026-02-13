/**
 * Hook to detect when a user's streak is at risk.
 *
 * Triggers when:
 * - Current time is after 20:00 local
 * - User has an active streak (currentStreak > 0)
 * - User has played 0 games today
 *
 * Re-checks on 60-second interval and on app foreground.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface StreakAtRiskState {
  /**
   * Whether the streak is currently at risk.
   */
  isAtRisk: boolean;

  /**
   * Hours remaining until midnight (0-23).
   */
  hoursLeft: number;

  /**
   * The streak count that is at risk.
   */
  streakCount: number;
}

/**
 * Check if the current time is after 20:00 local time.
 */
function isAfter8PM(): boolean {
  const currentHour = new Date().getHours();
  return currentHour >= 20;
}

/**
 * Calculate hours remaining until midnight.
 */
function getHoursUntilMidnight(): number {
  const currentHour = new Date().getHours();
  return 24 - currentHour;
}

/**
 * Hook to track streak at-risk state.
 *
 * @param currentStreak - The user's current streak count.
 * @param gamesPlayedToday - Number of games played today.
 * @returns State indicating if streak is at risk and hours left.
 *
 * @example
 * ```tsx
 * const { isAtRisk, hoursLeft } = useStreakAtRisk(
 *   stats.currentStreak,
 *   stats.gamesPlayedToday
 * );
 *
 * if (isAtRisk) {
 *   return <Text>Streak at risk! {hoursLeft}h left</Text>;
 * }
 * ```
 */
export function useStreakAtRisk(
  currentStreak: number,
  gamesPlayedToday: number
): StreakAtRiskState {
  const [isAtRisk, setIsAtRisk] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(0);

  const checkAtRisk = useCallback(() => {
    const afterEightPM = isAfter8PM();
    const hasStreak = currentStreak > 0;
    const noPlaysToday = gamesPlayedToday === 0;

    const atRisk = afterEightPM && hasStreak && noPlaysToday;

    setIsAtRisk(atRisk);
    setHoursLeft(getHoursUntilMidnight());
  }, [currentStreak, gamesPlayedToday]);

  // Check on mount and when dependencies change
  useEffect(() => {
    checkAtRisk();
  }, [checkAtRisk]);

  // Re-check every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAtRisk();
    }, 60_000);

    return () => clearInterval(interval);
  }, [checkAtRisk]);

  // Re-check on app foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAtRisk();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkAtRisk]);

  return {
    isAtRisk,
    hoursLeft,
    streakCount: currentStreak,
  };
}
