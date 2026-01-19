/**
 * Ranking Utilities
 *
 * Pure functions for leaderboard ranking calculations:
 * - Score normalization per game mode
 * - Tie-breaking by completion time
 * - Dense ranking
 * - Sticky bar visibility logic
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import {
  asMetadataObject,
  getMetadataNumber,
  isGameResult,
} from '@/types/gameMetadata';
import {
  LeaderboardEntry,
  StickyMeConfig,
  DailyScoreResult,
  NormalizedScore,
  UserRank,
} from '../types/leaderboard.types';

/**
 * Normalize a score from any game mode to 0-100 scale.
 * Replicates the logic from src/features/stats/utils/iqCalculation.ts
 *
 * @param gameMode - The game mode identifier
 * @param metadata - Parsed metadata from the attempt
 * @returns Normalized score (0-100)
 */
export function normalizeModeScore(
  gameMode: GameMode,
  metadata: unknown
): number {
  const data = asMetadataObject(metadata);
  if (!data) return 0;

  switch (gameMode) {
    case 'career_path': {
      const points = getMetadataNumber(data, 'points');
      const maxPoints = getMetadataNumber(data, 'maxPoints');
      if (maxPoints === 0) return 0;
      return Math.round((points / maxPoints) * 100);
    }

    case 'guess_the_transfer': {
      const points = getMetadataNumber(data, 'points');
      // Transfer always has maxPoints of 10
      return Math.round((points / 10) * 100);
    }

    case 'guess_the_goalscorers': {
      // Goalscorer recall stores percentage directly
      const percentage = getMetadataNumber(data, 'percentage');
      return Math.round(percentage);
    }

    case 'the_grid': {
      // The Grid: cellsFilled (0-9) → 0-100
      const cellsFilled = getMetadataNumber(data, 'cellsFilled');
      return Math.round((cellsFilled / 9) * 100);
    }

    case 'topical_quiz': {
      const points = getMetadataNumber(data, 'points');
      // Quiz always has maxPoints of 10
      return Math.round((points / 10) * 100);
    }

    default:
      return 0;
  }
}

/**
 * Calculate daily score from an array of attempts.
 * Sums normalized scores (0-100 each) for max of 500.
 *
 * @param attempts - Array of attempts with gameMode and metadata
 * @returns Daily score result with total, games played, and breakdown
 */
export function calculateDailyScore(
  attempts: Array<{ gameMode: GameMode; metadata: unknown }>
): DailyScoreResult {
  if (attempts.length === 0) {
    return {
      totalScore: 0,
      gamesPlayed: 0,
      breakdown: [],
    };
  }

  // Track which game modes we've seen (take first attempt only)
  const seenModes = new Set<GameMode>();
  const breakdown: NormalizedScore[] = [];
  let totalScore = 0;

  for (const attempt of attempts) {
    // Skip duplicates (only count first attempt per mode)
    if (seenModes.has(attempt.gameMode)) {
      continue;
    }
    seenModes.add(attempt.gameMode);

    const normalizedScore = normalizeModeScore(
      attempt.gameMode,
      attempt.metadata
    );
    totalScore += normalizedScore;

    breakdown.push({
      gameMode: attempt.gameMode,
      normalizedScore,
      completed: true,
    });
  }

  return {
    totalScore,
    gamesPlayed: breakdown.length,
    breakdown,
  };
}

/**
 * Sort entries by score descending, then by completion time ascending,
 * then by userId for deterministic ordering.
 *
 * @param entries - Unsorted leaderboard entries (without rank)
 * @returns Sorted entries
 */
export function sortByScoreAndTime(
  entries: Omit<LeaderboardEntry, 'rank'>[]
): Omit<LeaderboardEntry, 'rank'>[] {
  return [...entries].sort((a, b) => {
    // Primary: Score descending
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Secondary: Completion time ascending (earlier is better)
    const aTime = a.lastCompletedAt
      ? new Date(a.lastCompletedAt).getTime()
      : Infinity;
    const bTime = b.lastCompletedAt
      ? new Date(b.lastCompletedAt).getTime()
      : Infinity;
    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // Tertiary: userId for deterministic ordering
    return a.userId.localeCompare(b.userId);
  });
}

/**
 * Apply dense ranking to sorted entries.
 * Dense ranking: tied scores get same rank, next rank increments by 1.
 * Example: [300, 300, 200] → ranks [1, 1, 2]
 *
 * @param entries - Sorted entries (by score descending)
 * @returns Entries with rank applied
 */
export function applyDenseRanking(
  entries: Omit<LeaderboardEntry, 'rank'>[]
): LeaderboardEntry[] {
  if (entries.length === 0) {
    return [];
  }

  const ranked: LeaderboardEntry[] = [];
  let currentRank = 1;
  let previousScore: number | null = null;

  for (const entry of entries) {
    // If score changed, increment rank
    if (previousScore !== null && entry.score < previousScore) {
      currentRank++;
    }
    previousScore = entry.score;

    ranked.push({
      ...entry,
      rank: currentRank,
    });
  }

  return ranked;
}

/**
 * Determine whether to show the sticky "Me" bar.
 *
 * Shows when:
 * - User has a rank (has completed at least one puzzle)
 * - User is not currently visible in the list viewport
 *
 * @param options - Configuration options
 * @returns Sticky bar visibility config
 */
export function shouldShowStickyBar(options: {
  currentUserId: string;
  entries: LeaderboardEntry[];
  visibleRange: { start: number; end: number };
  userRank: UserRank | null;
}): StickyMeConfig {
  const { currentUserId, entries, visibleRange, userRank } = options;

  // No rank means user hasn't completed any puzzles
  if (!userRank) {
    return {
      isUserVisible: false,
      userIndex: -1,
      shouldShowStickyBar: false,
    };
  }

  // Find user in entries
  const userIndex = entries.findIndex((e) => e.userId === currentUserId);

  // User not in top 100
  if (userIndex === -1) {
    return {
      isUserVisible: false,
      userIndex: -1,
      shouldShowStickyBar: true,
    };
  }

  // Check if user is within visible range
  const isUserVisible =
    userIndex >= visibleRange.start && userIndex <= visibleRange.end;

  return {
    isUserVisible,
    userIndex,
    shouldShowStickyBar: !isUserVisible,
  };
}
