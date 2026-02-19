/**
 * Scoring utilities for Timeline game.
 *
 * Scoring is based on number of attempts (like Career Path):
 * 1 guess = 5 IQ, 2 = 4, 3 = 3, 4 = 2, 5 = 1, gave up/lost = 0.
 */

import { TimelineScore } from '../types/timeline.types';

/**
 * Labels for attempt-based scoring.
 */
const ATTEMPT_LABELS: Record<number, string> = {
  5: 'Perfect Timeline',
  4: 'World Class',
  3: 'Expert',
  2: 'Promising',
  1: 'Rookie',
  0: '',
};

/**
 * Maximum number of submit attempts allowed.
 */
export const MAX_TIMELINE_ATTEMPTS = 5;

/**
 * Calculate score for a Timeline game.
 *
 * @param totalAttempts - Total number of submit attempts
 * @param won - Whether the player got all 6 correct
 * @returns Score object with points and metadata
 */
export function calculateTimelineScore(
  totalAttempts: number,
  won: boolean
): TimelineScore {
  const points = won ? Math.max(1, 6 - totalAttempts) : 0;

  return {
    points,
    totalAttempts,
    label: ATTEMPT_LABELS[points] ?? '',
  };
}

/**
 * Get the score label for a given point value.
 */
export function getTimelineScoreLabel(points: number): string {
  return ATTEMPT_LABELS[points] ?? '';
}

/**
 * Normalize Timeline score to 0-100 range for distribution.
 * 5 pts → 100, 4 → 80, 3 → 60, 2 → 40, 1 → 20, 0 → 0.
 */
export function normalizeTimelineScore(score: TimelineScore): number {
  return score.points * 20;
}
