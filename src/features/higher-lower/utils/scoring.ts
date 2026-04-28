/**
 * Scoring System for Higher/Lower
 *
 * All 10 rounds are always played. Score = number of correct answers (0-10).
 */

/**
 * Score data for a completed Higher/Lower game.
 */
export interface HigherLowerScore {
  /** Correct answers (0-10) */
  points: number;
  /** Maximum possible (10) */
  maxPoints: number;
  /** Whether the player got all 10 correct */
  won: boolean;
}

/**
 * Calculate the final score for a Higher/Lower game.
 *
 * @param results - Array of booleans (true = correct, false = wrong)
 * @returns HigherLowerScore object
 */
export function calculateHigherLowerScore(results: boolean[]): HigherLowerScore {
  const points = results.filter(Boolean).length;

  return {
    points,
    maxPoints: 10,
    won: points === 10,
  };
}

/**
 * Format score for display as "X/Y" string.
 */
export function formatHigherLowerScore(score: HigherLowerScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Normalize score to 0-100 for distribution charts.
 */
export function normalizeHigherLowerScore(score: HigherLowerScore): number {
  if (score.maxPoints === 0) return 0;
  return Math.round((score.points / score.maxPoints) * 100);
}
