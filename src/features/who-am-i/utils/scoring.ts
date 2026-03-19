/**
 * Scoring System for Who Am I?
 *
 * Score based on how few clues were needed to guess correctly.
 * 5 clues total — fewer clues = higher score.
 *
 * Scoring:
 * - Guess on clue 1: 5 points (perfect)
 * - Guess on clue 2: 4 points
 * - Guess on clue 3: 3 points
 * - Guess on clue 4: 2 points
 * - Guess on clue 5: 1 point
 * - Lost/gave up: 0 points
 */

/**
 * Score data for a completed Who Am I? game.
 */
export interface WhoAmIScore {
  /** Points earned (0-5) */
  points: number;
  /** Maximum possible points (5) */
  maxPoints: number;
  /** Number of clues revealed when game ended */
  cluesRevealed: number;
  /** Whether the player won */
  won: boolean;
}

/**
 * Calculate the final score for a Who Am I? game.
 *
 * @param totalClues - Total clues in the puzzle (typically 5)
 * @param cluesRevealed - Number of clues revealed when guessed
 * @param won - Whether the player guessed correctly
 * @returns WhoAmIScore object
 */
export function calculateWhoAmIScore(
  totalClues: number,
  cluesRevealed: number,
  won: boolean
): WhoAmIScore {
  const maxPoints = totalClues;
  const points = won ? totalClues - (cluesRevealed - 1) : 0;

  return {
    points,
    maxPoints,
    cluesRevealed,
    won,
  };
}

/**
 * Format score for display as "X/Y" string.
 */
export function formatWhoAmIScore(score: WhoAmIScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Normalize score to 0-100 for distribution charts.
 */
export function normalizeWhoAmIScore(score: WhoAmIScore): number {
  if (score.maxPoints === 0) return 0;
  return Math.round((score.points / score.maxPoints) * 100);
}
