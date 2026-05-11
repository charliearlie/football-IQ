import type { TopTensScore } from "./types";

/** Maximum possible points (Jackpot). */
export const MAX_POINTS = 8;

function getScoreForFoundCount(foundCount: number): number {
  if (foundCount <= 0) return 0;
  if (foundCount <= 2) return 1;
  if (foundCount <= 4) return 2;
  if (foundCount <= 6) return 3;
  if (foundCount <= 8) return 4;
  if (foundCount === 9) return 5;
  return 8; // 10 found = Jackpot
}

/**
 * Calculate the final score. Flat tier scoring; finding all 10 earns the
 * maximum 8 points (Jackpot).
 */
export function calculateTopTensScore(
  foundCount: number,
  wrongGuessCount: number,
  won: boolean
): TopTensScore {
  return {
    points: getScoreForFoundCount(foundCount),
    maxPoints: MAX_POINTS,
    foundCount,
    wrongGuessCount,
    won,
  };
}

/** Format score as "X/Y" for display. */
export function formatTopTensScore(score: TopTensScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/** Score progression for ranks 1-10 (for UI display). */
export function getScoreProgression(): number[] {
  return [1, 1, 2, 2, 3, 3, 4, 4, 5, 8];
}
