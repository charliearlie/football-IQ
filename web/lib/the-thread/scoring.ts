/**
 * The Thread scoring — hint-based 10-point scale.
 *
 * - 0 hints revealed: 10 points
 * - 1 hint revealed:   6 points
 * - 2 hints revealed:  4 points
 * - 3 hints revealed:  2 points
 * - Loss / give up:    0 points
 *
 * Wrong guesses are free; only hints cost points.
 */

const HINT_SCORES = [10, 6, 4, 2] as const;

export interface ThreadScore {
  points: number;
  maxPoints: number;
  guessCount: number;
  won: boolean;
  hintsRevealed: number;
}

export function calculateThreadScore(
  guessCount: number,
  won: boolean,
  hintsRevealed = 0
): ThreadScore {
  const maxPoints = 10;
  if (!won) {
    return { points: 0, maxPoints, guessCount, won: false, hintsRevealed };
  }
  const clamped = Math.max(0, Math.min(3, hintsRevealed));
  return {
    points: HINT_SCORES[clamped],
    maxPoints,
    guessCount,
    won: true,
    hintsRevealed: clamped,
  };
}

export function formatThreadScore(score: ThreadScore): string {
  return `${score.points}/${score.maxPoints}`;
}
