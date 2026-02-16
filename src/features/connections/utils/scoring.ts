/**
 * Scoring utilities for Connections game.
 */

import { ConnectionsScore, ConnectionsGroup, ConnectionsDifficulty } from '../types/connections.types';

/**
 * Scoring table for Connections based on mistakes made.
 */
const SCORE_TABLE: Record<number, { points: number; label: string }> = {
  0: { points: 10, label: 'Hall of Famer' },
  1: { points: 8, label: 'World Class' },
  2: { points: 6, label: 'Director of Football' },
  3: { points: 4, label: 'Chief Scout' },
  4: { points: 2, label: 'Scout' },
};

/**
 * Perfect order bonus points (solved yellow -> green -> blue -> purple).
 */
const PERFECT_ORDER_BONUS = 2;

/**
 * Calculate score for a Connections game.
 *
 * @param mistakes - Number of incorrect guesses (0-4)
 * @param solvedGroups - Groups that were solved
 * @returns Score object with points and metadata
 */
export function calculateConnectionsScore(
  mistakes: number,
  solvedGroups: ConnectionsGroup[]
): ConnectionsScore {
  // Base points from mistake count
  const basePoints = SCORE_TABLE[Math.min(mistakes, 4)]?.points ?? 0;

  // Check for perfect order (yellow -> green -> blue -> purple)
  const perfectOrder = checkPerfectOrder(solvedGroups);

  // Add perfect order bonus
  const points = basePoints + (perfectOrder ? PERFECT_ORDER_BONUS : 0);

  return {
    points,
    mistakes,
    perfectOrder,
    solvedCount: solvedGroups.length,
  };
}

/**
 * Get the score label for a given number of mistakes.
 *
 * @param mistakes - Number of mistakes (0-4)
 * @returns Score label (e.g., "Hall of Famer")
 */
export function getConnectionsScoreLabel(mistakes: number): string {
  return SCORE_TABLE[Math.min(mistakes, 4)]?.label ?? 'Scout';
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

/**
 * Check if groups were solved in perfect difficulty order.
 * Perfect order: yellow (1st) -> green (2nd) -> blue (3rd) -> purple (4th)
 *
 * @param solvedGroups - Groups in the order they were solved
 * @returns True if solved in perfect order
 */
function checkPerfectOrder(solvedGroups: ConnectionsGroup[]): boolean {
  if (solvedGroups.length !== 4) return false;

  const expectedOrder: ConnectionsDifficulty[] = ['yellow', 'green', 'blue', 'purple'];

  for (let i = 0; i < 4; i++) {
    if (solvedGroups[i].difficulty !== expectedOrder[i]) {
      return false;
    }
  }

  return true;
}
