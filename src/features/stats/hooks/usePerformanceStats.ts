/**
 * Performance Stats Hook
 *
 * Fetches and aggregates all puzzle attempt data to calculate
 * the user's Football IQ score and per-mode proficiency metrics.
 *
 * Automatically refreshes when app comes to foreground.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  getAllCompletedAttemptsWithGameMode,
  AttemptWithGameMode,
} from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { useUserStats } from '@/features/home/hooks/useUserStats';
import { asMetadataObject, getMetadataNumber } from '@/types/gameMetadata';
import {
  PerformanceStats,
  UsePerformanceStatsResult,
  GameProficiency,
  GAME_MODE_DISPLAY,
} from '../types/stats.types';
import {
  calculateProficiency,
  calculateGlobalIQ,
  calculateBadges,
} from '../utils/iqCalculation';

/**
 * All game modes in display order.
 */
const ALL_GAME_MODES: GameMode[] = [
  'career_path',
  'career_path_pro',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'the_grid',
  'topical_quiz',
  'top_tens',
  'starting_xi',
];

/**
 * Group attempts by game mode.
 */
function groupAttemptsByMode(
  attempts: AttemptWithGameMode[]
): Map<GameMode, AttemptWithGameMode[]> {
  const grouped = new Map<GameMode, AttemptWithGameMode[]>();

  // Initialize all modes with empty arrays
  for (const mode of ALL_GAME_MODES) {
    grouped.set(mode, []);
  }

  // Group attempts
  for (const attempt of attempts) {
    const mode = attempt.game_mode as GameMode;
    const existing = grouped.get(mode);
    if (existing) {
      existing.push(attempt);
    }
  }

  return grouped;
}

/**
 * Calculate total points from all attempts.
 */
function calculateTotalPoints(attempts: AttemptWithGameMode[]): number {
  let total = 0;

  for (const attempt of attempts) {
    const metadata = asMetadataObject(attempt.metadata);
    if (!metadata) continue;

    // Career Path and Transfer Guess use 'points'
    // Tic Tac Toe uses 'points'
    // Topical Quiz uses 'points'
    // Goalscorer Recall uses 'percentage' (treat as points for total)
    const points = getMetadataNumber(metadata, 'points');
    if (points > 0) {
      total += points;
    } else {
      // For goalscorer recall, use percentage as points equivalent
      const percentage = getMetadataNumber(metadata, 'percentage');
      total += percentage;
    }
  }

  return Math.round(total);
}

/**
 * Hook to calculate and provide user performance statistics.
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const { stats, isLoading, refresh } = usePerformanceStats();
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <View>
 *       <Text>Football IQ: {stats?.globalIQ}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function usePerformanceStats(): UsePerformanceStatsResult {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastLoadTime = useRef<number>(0);

  // Get streak data from existing hook
  const { stats: userStats, refresh: refreshUserStats } = useUserStats();

  const loadStats = useCallback(async () => {
    try {
      // Fetch all completed attempts with game mode
      const attempts = await getAllCompletedAttemptsWithGameMode();

      // Group by game mode
      const groupedAttempts = groupAttemptsByMode(attempts);

      // Calculate proficiency for each mode
      const proficiencies: GameProficiency[] = ALL_GAME_MODES.map((mode) => {
        const modeAttempts = groupedAttempts.get(mode) || [];
        return calculateProficiency(mode, modeAttempts);
      });

      // Calculate global IQ
      const globalIQ = calculateGlobalIQ(proficiencies);

      // Calculate totals
      const totalPuzzlesSolved = attempts.length;
      const totalPerfectScores = proficiencies.reduce(
        (sum, p) => sum + p.perfectScores,
        0
      );
      const totalPoints = calculateTotalPoints(attempts);

      // Calculate badges (using streak from userStats)
      const currentStreak = userStats.currentStreak;
      const longestStreak = userStats.longestStreak;
      const badges = calculateBadges(proficiencies, currentStreak, totalPuzzlesSolved);

      setStats({
        globalIQ,
        proficiencies,
        totalPuzzlesSolved,
        totalPerfectScores,
        totalPoints,
        currentStreak,
        longestStreak,
        badges,
      });
      setError(null);
      lastLoadTime.current = Date.now();
    } catch (err) {
      console.error('Failed to load performance stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to load stats'));
    } finally {
      setIsLoading(false);
    }
  }, [userStats.currentStreak, userStats.longestStreak]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await refreshUserStats();
    await loadStats();
  }, [loadStats, refreshUserStats]);

  // Load stats on mount and when userStats changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Refresh on app foreground (handles game completion updates)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Debounce: only refresh if more than 1 second since last load
        const timeSinceLastLoad = Date.now() - lastLoadTime.current;
        if (timeSinceLastLoad > 1000) {
          refresh();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refresh]);

  return { stats, isLoading, error, refresh };
}
