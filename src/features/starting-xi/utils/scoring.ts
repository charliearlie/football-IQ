/**
 * Scoring utilities for Starting XI game mode.
 *
 * Scoring model: 1 point per correctly guessed hidden player + 3 point Perfect XI bonus
 * - Points = foundCount + (foundAll ? 3 : 0)
 * - Max 5 hidden players per puzzle, so max points = 5 + 3 = 8
 * - Example: 5 hidden, found 5/5 = 5 + 3 = 8 points (Perfect XI!)
 * - Example: 5 hidden, found 3/5 = 3 points (no bonus)
 */

import type { StartingXIScore, PlayerSlotState } from '../types/startingXI.types';

/** Bonus points for finding all hidden players (Perfect XI) */
const PERFECT_XI_BONUS = 3;

/**
 * Calculate the score for a Starting XI game.
 *
 * Formula: points = foundCount + (isPerfect ? 3 : 0)
 *
 * @param foundCount - Number of hidden players correctly guessed
 * @param totalHidden - Total number of hidden players in the puzzle
 * @returns Score object with points, maxPoints, and counts
 *
 * @example
 * // Perfect XI (all found) - gets +3 bonus
 * calculateStartingXIScore(5, 5)
 * // { points: 8, maxPoints: 8, foundCount: 5, totalHidden: 5 }
 *
 * @example
 * // Partial completion - no bonus
 * calculateStartingXIScore(3, 5)
 * // { points: 3, maxPoints: 8, foundCount: 3, totalHidden: 5 }
 */
export function calculateStartingXIScore(
  foundCount: number,
  totalHidden: number
): StartingXIScore {
  const isPerfect = foundCount === totalHidden && totalHidden > 0;
  return {
    points: foundCount + (isPerfect ? PERFECT_XI_BONUS : 0),
    maxPoints: totalHidden + PERFECT_XI_BONUS,
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
 * Check if the game is a perfect score (all hidden players found, including bonus).
 */
export function isPerfectScore(score: StartingXIScore): boolean {
  return score.foundCount === score.totalHidden && score.totalHidden > 0;
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
