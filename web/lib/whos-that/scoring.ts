/** Score data for a completed Who's That? game. */
export interface WhosThatScore {
  /** Points earned (0-6). */
  points: number;
  /** Maximum possible points (6). */
  maxPoints: number;
  /** Number of guesses used. */
  guessCount: number;
  /** Whether the player guessed correctly. */
  won: boolean;
}

/**
 * Calculate the final score for a Who's That? game.
 * Attempt 1 = 6 points; attempt 6 = 1 point; loss = 0 points.
 */
export function calculateWhosThatScore(guessCount: number, won: boolean): WhosThatScore {
  const maxPoints = 6;
  const points = won ? maxPoints - (guessCount - 1) : 0;
  return { points, maxPoints, guessCount, won };
}

/** Format score for display as "X/Y" string. */
export function formatWhosThatScore(score: WhosThatScore): string {
  return `${score.points}/${score.maxPoints}`;
}
