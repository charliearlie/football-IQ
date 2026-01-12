/**
 * ScoreDistributionContainer
 *
 * Smart component that manages data fetching and renders
 * either the graph or skeleton loading state.
 *
 * Use this component in result modals to show score distribution.
 */

import React from 'react';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { useScoreDistribution } from '../hooks/useScoreDistribution';
import { ScoreDistributionGraph } from './ScoreDistributionGraph';
import { ScoreDistributionSkeleton } from './ScoreDistributionSkeleton';
import {
  getMaxScoreForMode,
  getBucketSizeForMode,
  getBarCountForMode,
  getScoreLabelsForMode,
} from '../utils/distributionConfig';
import { DistributionEntry } from '../services/distributionService';

/**
 * Transform Career Path distribution from normalized 0-100 scores to club counts.
 * Club count = 1 + maxSteps * (1 - normalizedScore / 100)
 */
function transformCareerPathDistribution(
  distribution: DistributionEntry[],
  maxSteps: number
): DistributionEntry[] {
  // Group by club count
  const clubMap = new Map<number, number>();

  for (const entry of distribution) {
    // Convert normalized score to clubs revealed
    // score = (points / maxPoints) * 100, where points = maxSteps - (clubsRevealed - 1)
    // So: clubsRevealed = maxSteps - (score * maxSteps / 100) + 1
    const clubsRevealed = Math.round(maxSteps - (entry.score * maxSteps / 100) + 1);
    const clampedClubs = Math.max(1, Math.min(clubsRevealed, maxSteps));

    const current = clubMap.get(clampedClubs) || 0;
    clubMap.set(clampedClubs, current + entry.percentage);
  }

  // Convert to array with club count as score
  return Array.from(clubMap.entries()).map(([clubs, percentage]) => ({
    score: clubs,
    count: 0, // Not used for display
    percentage,
  }));
}

export interface ScoreDistributionContainerProps {
  /** Puzzle ID to fetch distribution for */
  puzzleId: string;
  /** Game mode for display configuration */
  gameMode: GameMode;
  /** User's normalized score (0-100) for highlighting */
  userScore: number;
  /** Max steps/clubs for career_path label generation */
  maxSteps?: number;
  /** Test ID */
  testID?: string;
}

/**
 * Container component for score distribution graph.
 *
 * Handles:
 * - Data fetching via useScoreDistribution hook
 * - Loading state with skeleton
 * - Error handling (fails silently, graph is nice-to-have)
 * - Per-game-mode configuration
 *
 * @example
 * ```tsx
 * // In TopTensResultModal:
 * <ScoreDistributionContainer
 *   puzzleId={puzzleId}
 *   gameMode="top_tens"
 *   userScore={score.points * 10}  // Normalize 0-10 to 0-100
 * />
 *
 * // In GoalscorerRecallResultModal:
 * <ScoreDistributionContainer
 *   puzzleId={puzzleId}
 *   gameMode="guess_the_goalscorers"
 *   userScore={score.percentage}  // Already 0-100
 * />
 * ```
 */
export function ScoreDistributionContainer({
  puzzleId,
  gameMode,
  userScore,
  maxSteps,
  testID,
}: ScoreDistributionContainerProps) {
  const { distribution, totalAttempts, isLoading, error } = useScoreDistribution(
    puzzleId,
    gameMode
  );

  // Fail silently on error - graph is a nice-to-have feature
  if (error) {
    return null;
  }

  // Show skeleton while loading
  if (isLoading) {
    return (
      <ScoreDistributionSkeleton
        barCount={getBarCountForMode(gameMode, maxSteps)}
        testID={testID ? `${testID}-skeleton` : undefined}
      />
    );
  }

  // Check if this is the first player (no prior attempts)
  const isFirstPlayer = distribution.length === 0 && totalAttempts === 0;

  // For Career Path, transform distribution and scores to club counts
  if (gameMode === 'career_path' && maxSteps) {
    const transformedDistribution = transformCareerPathDistribution(distribution, maxSteps);
    // userScore for Career Path should be stepsRevealed (passed as userScore)
    // We use club count directly, with maxScore = maxSteps, minScore = 1, and bucketSize = 1
    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        totalAttempts={isFirstPlayer ? 1 : totalAttempts}
        userScore={userScore}
        maxScore={maxSteps}
        minScore={1}
        bucketSize={1}
        scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
        isFirstPlayer={isFirstPlayer}
        testID={testID}
      />
    );
  }

  return (
    <ScoreDistributionGraph
      distribution={distribution}
      totalAttempts={isFirstPlayer ? 1 : totalAttempts}
      userScore={userScore}
      maxScore={getMaxScoreForMode(gameMode)}
      bucketSize={getBucketSizeForMode(gameMode, maxSteps)}
      scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
      isFirstPlayer={isFirstPlayer}
      testID={testID}
    />
  );
}
