/** Score data for a completed Higher/Lower game. */
export interface HigherLowerScore {
  /** Correct answers. */
  points: number;
  /** Maximum possible (rounds actually played). */
  maxPoints: number;
  /** Whether the player got every round correct. */
  won: boolean;
}

/**
 * Calculate the final score for a Higher/Lower game.
 * @param results - Array of booleans (true = correct, false = wrong)
 * @param totalRounds - Total rounds the player attempted (defaults to 10).
 *   For malformed puzzles with fewer pairs, pass the actual count so that
 *   maxPoints + won reflect what the player could have achieved.
 */
export function calculateHigherLowerScore(
  results: boolean[],
  totalRounds: number = 10
): HigherLowerScore {
  const points = results.filter(Boolean).length;
  return {
    points,
    maxPoints: totalRounds,
    won: totalRounds > 0 && points === totalRounds,
  };
}

/** Format score for display as "X/Y" string. */
export function formatHigherLowerScore(score: HigherLowerScore): string {
  return `${score.points}/${score.maxPoints}`;
}
