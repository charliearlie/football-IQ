/**
 * Scoring utilities for Timeline game.
 */

import { TimelineScore } from '../types/timeline.types';

/**
 * Scoring table for Timeline based on first-attempt accuracy.
 */
const SCORE_TABLE: Record<number, { points: number; label: string }> = {
  0: { points: 0, label: '' },
  1: { points: 2, label: 'Rookie' },
  2: { points: 2, label: 'Rookie' },
  3: { points: 4, label: 'Promising' },
  4: { points: 6, label: 'Expert' },
  5: { points: 8, label: 'World Class' },
  6: { points: 10, label: 'Perfect Timeline' },
};

/**
 * Calculate score for a Timeline game.
 *
 * @param firstAttemptCorrect - Number of events in correct position on first submit
 * @param totalAttempts - Total number of submit attempts
 * @returns Score object with points and metadata
 */
export function calculateTimelineScore(
  firstAttemptCorrect: number,
  totalAttempts: number
): TimelineScore {
  const entry = SCORE_TABLE[Math.min(firstAttemptCorrect, 6)] ?? { points: 0, label: '' };

  return {
    points: entry.points,
    firstAttemptCorrect,
    totalAttempts,
    label: entry.label,
  };
}

/**
 * Get the score label for a given number of first-attempt correct events.
 *
 * @param firstAttemptCorrect - Number of events correct on first attempt (0-6)
 * @returns Score label (e.g., "Perfect Timeline")
 */
export function getTimelineScoreLabel(firstAttemptCorrect: number): string {
  return SCORE_TABLE[Math.min(firstAttemptCorrect, 6)]?.label ?? '';
}

/**
 * Normalize Timeline score to 0-10 range for IQ system.
 *
 * @param score - TimelineScore object
 * @returns Normalized score (0-10)
 */
export function normalizeTimelineScore(score: TimelineScore): number {
  return score.points;
}
