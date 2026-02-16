/**
 * Scoring utilities for Connections game.
 */

import { ConnectionsScore, ConnectionsGroup } from '../types/connections.types';

/**
 * Scoring table for Connections based on groups solved.
 */
const SCORE_TABLE: Record<number, { points: number; label: string }> = {
  0: { points: 0, label: '' },
  1: { points: 2, label: 'Scout' },
  2: { points: 4, label: 'Chief Scout' },
  3: { points: 6, label: 'Director of Football' },
  4: { points: 10, label: 'Hall of Famer' },
};

/**
 * Calculate score for a Connections game.
 *
 * @param mistakes - Number of incorrect guesses (0-4) - kept for backwards compatibility
 * @param solvedGroups - Groups that were solved
 * @returns Score object with points and metadata
 */
export function calculateConnectionsScore(
  mistakes: number,
  solvedGroups: ConnectionsGroup[]
): ConnectionsScore {
  // Points based on number of groups solved
  const solvedCount = solvedGroups.length;
  const points = SCORE_TABLE[Math.min(solvedCount, 4)]?.points ?? 0;

  return {
    points,
    mistakes,
    perfectOrder: false,
    solvedCount,
  };
}

/**
 * Get the score label for a given number of groups solved.
 *
 * @param solvedCount - Number of groups solved (0-4)
 * @returns Score label (e.g., "Hall of Famer")
 */
export function getConnectionsScoreLabel(solvedCount: number): string {
  return SCORE_TABLE[Math.min(solvedCount, 4)]?.label ?? '';
}

/**
 * Normalize Connections score to 0-10 range for IQ system.
 *
 * @param score - ConnectionsScore object
 * @returns Normalized score (0-10)
 */
export function normalizeConnectionsScore(score: ConnectionsScore): number {
  return score.points;
}

