/**
 * Scoring System for Higher/Lower
 *
 * Each correct round earns points equal to the round number.
 * Round 1 = 1pt, Round 2 = 2pt, ... Round 10 = 10pt
 * Max possible = 1+2+3+4+5+6+7+8+9+10 = 55 points
 *
 * Game ends immediately on first wrong answer.
 */

/**
 * Score data for a completed Higher/Lower game.
 */
export interface HigherLowerScore {
  /** Points earned (0-55) */
  points: number;
  /** Maximum possible points (55) */
  maxPoints: number;
  /** Number of rounds completed (including the final wrong one if lost) */
  roundsCompleted: number;
  /** Whether the player won (all 10 correct) */
  won: boolean;
}

/**
 * Calculate the final score for a Higher/Lower game.
 *
 * @param results - Array of booleans (true = correct, false = wrong)
 * @returns HigherLowerScore object
 */
export function calculateHigherLowerScore(results: boolean[]): HigherLowerScore {
  let points = 0;
  let roundsCompleted = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      points += i + 1;
      roundsCompleted = i + 1;
    } else {
      roundsCompleted = i + 1;
      break; // Game ends on first wrong answer
    }
  }

  return {
    points,
    maxPoints: 55,
    roundsCompleted,
    won: results.length === 10 && results.every(Boolean),
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
