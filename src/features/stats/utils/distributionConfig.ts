/**
 * Distribution Configuration
 *
 * Per-game-mode settings for score distribution display.
 * Provides custom labels and normalization logic for each game mode.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Get max score for display purposes.
 * All scores are normalized to 0-100 in the API.
 */
export function getMaxScoreForMode(_gameMode: GameMode): number {
  // All modes use 0-100 normalized scale
  return 100;
}

/**
 * Get bucket size for grouping scores.
 *
 * Most modes use 10-point buckets (11 bars).
 * Can be customized per mode if needed.
 */
export function getBucketSizeForMode(gameMode: GameMode, maxSteps?: number): number {
  switch (gameMode) {
    case 'career_path':
    case 'career_path_pro':
      // Career Path: each club is one bucket
      // Bucket size = 100 / number of clubs
      return maxSteps ? Math.floor(100 / maxSteps) : 10;
    case 'topical_quiz':
      // Quiz has 6 possible scores (0, 2, 4, 6, 8, 10 points = 0, 20, 40, 60, 80, 100 normalized)
      return 20;
    case 'guess_the_transfer':
      // Transfer has 6 possible scores (0-5 points = 0, 20, 40, 60, 80, 100 normalized)
      return 20;
    case 'guess_the_goalscorers':
      // Dynamic: bucket size = 100 / totalScorers
      return maxSteps ? Math.round(100 / maxSteps) : 20;
    case 'the_chain':
      // Steps bucket - 10-point buckets for normalized scores
      return 10;
    default:
      // Default: 10-point buckets (0%, 10%, 20%, ..., 100%)
      return 10;
  }
}

/**
 * Get number of bars for skeleton loader.
 */
export function getBarCountForMode(gameMode: GameMode, maxSteps?: number): number {
  if ((gameMode === 'career_path' || gameMode === 'career_path_pro') && maxSteps) {
    return maxSteps; // One bar per club
  }
  if (gameMode === 'guess_the_goalscorers' && maxSteps) {
    return maxSteps + 1; // One bar per possible score (0 to N)
  }
  const bucketSize = getBucketSizeForMode(gameMode, maxSteps);
  return Math.floor(100 / bucketSize) + 1;
}

/**
 * Get custom score labels for display.
 *
 * Returns undefined to use default percentage labels.
 * Returns array of strings for custom labels (sorted highest to lowest).
 *
 * @param gameMode - The game mode
 * @param maxSteps - Optional max steps for career_path (used to generate club labels)
 */
export function getScoreLabelsForMode(
  gameMode: GameMode,
  maxSteps?: number
): string[] | undefined {
  switch (gameMode) {
    case 'career_path':
    case 'career_path_pro': {
      // Career Path: one label per club (1 club, 2 clubs, etc.)
      const steps = maxSteps || 10;
      const labels: string[] = [];
      for (let i = 1; i <= steps; i++) {
        labels.push(i === 1 ? '1 club' : `${i} clubs`);
      }
      return labels;
    }
    case 'top_tens':
      // Top Tens: show as X/10 format
      return [
        '10/10',
        '9/10',
        '8/10',
        '7/10',
        '6/10',
        '5/10',
        '4/10',
        '3/10',
        '2/10',
        '1/10',
        '0/10',
      ];
    case 'topical_quiz':
      // Quiz: show as X/5 format (5 questions, 2 pts each)
      return ['5/5', '4/5', '3/5', '2/5', '1/5', '0/5'];
    case 'guess_the_transfer':
      // Transfer: show as X/5 format (hint-based scoring)
      return ['5/5', '4/5', '3/5', '2/5', '1/5', '0/5'];
    case 'guess_the_goalscorers': {
      // Dynamic: N, N-1, ..., 1, 0 based on totalScorers
      const total = maxSteps || 5;
      const labels: string[] = [];
      for (let i = total; i >= 0; i--) {
        labels.push(String(i));
      }
      return labels;
    }
    case 'the_chain':
      // Step counts - lower is better (2 = best, 12+ = worst)
      // 11 labels for buckets 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0
      return ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12+'];
    default:
      // Default: use percentage labels
      return undefined;
  }
}

/**
 * Normalize a raw game score to 0-100 for display highlighting.
 *
 * This must match the RPC normalization logic for the user's score
 * to be highlighted in the correct bucket.
 *
 * @param gameMode - The game mode
 * @param rawScore - The raw score value (points, percentage, etc.)
 * @param maxScore - Optional max score for percentage calculation
 */
export function normalizeScoreForMode(
  gameMode: GameMode,
  rawScore: number,
  maxScore?: number
): number {
  switch (gameMode) {
    case 'top_tens':
      // 0-8 points -> 0-100
      return Math.round((rawScore / 8) * 100);
    case 'topical_quiz':
      // 0-10 points (2 per question) -> 0-100
      return rawScore * 10;
    case 'guess_the_transfer':
      // 0-5 points -> 0-100
      return rawScore * 20;
    case 'career_path':
    case 'career_path_pro':
      // points/maxPoints * 100
      if (maxScore && maxScore > 0) {
        return Math.round((rawScore / maxScore) * 100);
      }
      return rawScore;
    case 'guess_the_goalscorers':
      // Raw score / max * 100 (maxScore = totalScorers)
      if (maxScore && maxScore > 0) {
        return Math.round((rawScore / maxScore) * 100);
      }
      return rawScore;
    case 'the_grid':
      // Already 0-100
      return rawScore;
    default:
      return rawScore;
  }
}
