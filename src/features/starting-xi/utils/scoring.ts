/**
 * Scoring utilities for Starting XI game mode.
 *
 * Scoring model: 1 point per correctly guessed hidden player.
 * Maximum score equals the number of hidden players in the lineup.
 */

import type { StartingXIScore, PlayerSlotState } from '../types/startingXI.types';

/**
 * Calculate the score for a Starting XI game.
 *
 * @param foundCount - Number of hidden players correctly guessed
 * @param totalHidden - Total number of hidden players in the puzzle
 * @returns Score object with points, maxPoints, and counts
 *
 * @example
 * calculateStartingXIScore(9, 11)
 * // { points: 9, maxPoints: 11, foundCount: 9, totalHidden: 11 }
 */
export function calculateStartingXIScore(
  foundCount: number,
  totalHidden: number
): StartingXIScore {
  return {
    points: foundCount,
    maxPoints: totalHidden,
    foundCount,
    totalHidden,
  };
}

/**
 * Calculate score from current game state (slot array).
 *
 * @param slots - Array of 11 PlayerSlotState objects
 * @returns Score object
 */
export function calculateScoreFromSlots(
  slots: PlayerSlotState[]
): StartingXIScore {
  const hiddenSlots = slots.filter((s) => s.isHidden);
  const foundCount = hiddenSlots.filter((s) => s.isFound).length;
  const totalHidden = hiddenSlots.length;

  return calculateStartingXIScore(foundCount, totalHidden);
}

/**
 * Check if the game is a perfect score (all hidden players found).
 */
export function isPerfectScore(score: StartingXIScore): boolean {
  return score.points === score.maxPoints && score.maxPoints > 0;
}

/**
 * Normalize score to 0-100 scale for leaderboard compatibility.
 *
 * @param score - Starting XI score
 * @returns Normalized score (0-100)
 */
export function normalizeScore(score: StartingXIScore): number {
  if (score.maxPoints === 0) return 0;
  return Math.round((score.points / score.maxPoints) * 100);
}
