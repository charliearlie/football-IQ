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
  DetailedModeStats,
  GAME_MODE_DISPLAY,
} from '../types/stats.types';
import {
  calculateProficiency,
  calculateGlobalIQ,
  calculateBadges,
} from '../utils/iqCalculation';
import { calculateFieldExperience } from '../utils/fieldExperience';
import { calculateFormGuide } from '../utils/formGuide';
import { analyzeStrengthWeakness } from '../utils/strengthWeakness';
import { calculateMonthReport } from '../utils/monthReport';
import { classifyFormation } from '../utils/formationClassifier';
import { calculateNextMilestone } from '../utils/nextMilestone';
import { calculateBestDay } from '../utils/bestDay';
import { findWeakSpot } from '../utils/weakSpot';
import { generateScoutingVerdict, generateShortVerdict } from '../utils/scoutingVerdict';
import { getTierForPoints } from '../utils/tierProgression';
import { StreakCategory, Trajectory } from '../types/scoutReport.types';
import { normalizeScore } from '../utils/iqCalculation';

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
 * Calculate trajectory by comparing this month's average score to last month's.
 */
function calculateTrajectory(attempts: AttemptWithGameMode[]): Trajectory {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthScores: number[] = [];
  const lastMonthScores: number[] = [];

  for (const attempt of attempts) {
    const date = new Date(attempt.puzzle_date);
    const score = normalizeScore(attempt.game_mode as GameMode, attempt.metadata);
    if (date.getFullYear() === thisYear && date.getMonth() === thisMonth) {
      thisMonthScores.push(score);
    } else if (date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth) {
      lastMonthScores.push(score);
    }
  }

  // Need at least 5 games in each month for a meaningful comparison
  if (thisMonthScores.length < 5 || lastMonthScores.length < 5) {
    return 'stable';
  }

  const thisAvg = thisMonthScores.reduce((a, b) => a + b, 0) / thisMonthScores.length;
  const lastAvg = lastMonthScores.reduce((a, b) => a + b, 0) / lastMonthScores.length;

  if (thisAvg >= lastAvg + 5) return 'improving';
  if (thisAvg <= lastAvg - 5) return 'declining';
  return 'stable';
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

      // Calculate Field Experience (per-mode completion counts)
      const fieldExperience = calculateFieldExperience(attempts);

      // Calculate detailed per-mode stats for MODE BREAKDOWN section
      const detailedModeStats: DetailedModeStats[] = proficiencies
        .filter((p) => p.gamesPlayed > 0)
        .map((p) => {
          const modeAttempts = groupedAttempts.get(p.gameMode) || [];
          const scores = modeAttempts.map((a) => a.score ?? 0);
          const modeDisplay = GAME_MODE_DISPLAY[p.gameMode];

          return {
            gameMode: p.gameMode,
            displayName: modeDisplay.displayName,
            skillName: modeDisplay.skillName,
            gamesPlayed: p.gamesPlayed,
            accuracyPercent: Math.round(p.percentage),
            bestScore: scores.length > 0 ? Math.max(...scores) : 0,
            totalPoints: scores.reduce((sum, s) => sum + s, 0),
            perfectScores: p.perfectScores,
          };
        })
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed); // Most played first

      // ─── Scout Report Upgrade Calculations ─────────────────
      const formGuide = calculateFormGuide(attempts);
      const strengthWeakness = analyzeStrengthWeakness(detailedModeStats);
      const thisMonthReport = calculateMonthReport(attempts);
      const formationClassification = classifyFormation(proficiencies);
      const nextMilestone = calculateNextMilestone(
        totalPuzzlesSolved,
        totalPerfectScores,
        currentStreak
      );
      const bestDay = calculateBestDay(attempts);
      const weakSpotMode = findWeakSpot(detailedModeStats);
      const trajectory = calculateTrajectory(attempts);

      // Build verdict input
      const tier = getTierForPoints(totalPoints);
      const dominantMode = fieldExperience.dominantMode;
      const sortedByAccuracy = [...detailedModeStats].sort(
        (a, b) => b.accuracyPercent - a.accuracyPercent
      );
      const secondMode = sortedByAccuracy.length >= 2
        ? sortedByAccuracy[1].gameMode
        : null;
      const streakCategory: StreakCategory =
        currentStreak >= 7 ? 'high' : currentStreak >= 3 ? 'medium' : 'low';
      const perfectRate = totalPuzzlesSolved > 0
        ? Math.round((totalPerfectScores / totalPuzzlesSolved) * 100)
        : 0;

      const verdictInput = {
        tier,
        dominantMode,
        secondMode,
        formationLabel: formationClassification.label,
        streakCategory,
        trajectory,
        perfectRate,
        totalGames: totalPuzzlesSolved,
        strengthMode: strengthWeakness?.strength.mode ?? null,
        weaknessMode: strengthWeakness?.weakness.mode ?? null,
      };
      const scoutingVerdict = generateScoutingVerdict(verdictInput);
      const shortVerdict = generateShortVerdict(verdictInput);

      setStats({
        globalIQ,
        proficiencies,
        totalPuzzlesSolved,
        totalPerfectScores,
        totalPoints,
        currentStreak,
        longestStreak,
        badges,
        fieldExperience,
        detailedModeStats,
        formGuide,
        strengthWeakness,
        scoutingVerdict,
        shortVerdict,
        thisMonthReport,
        formationClassification,
        nextMilestone,
        bestDay,
        weakSpotMode,
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
