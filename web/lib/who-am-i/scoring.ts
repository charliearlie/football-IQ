/**
 * Scoring for Who Am I?
 *
 * Score = totalClues - (cluesRevealed - 1) on a win, 0 on a loss.
 * Total clues is typically 5, so a guess on clue 1 is worth 5, clue 5 is 1.
 */

export interface WhoAmIScore {
  points: number;
  maxPoints: number;
  cluesRevealed: number;
  won: boolean;
}

export function calculateWhoAmIScore(
  totalClues: number,
  cluesRevealed: number,
  won: boolean
): WhoAmIScore {
  const maxPoints = totalClues;
  const points = won ? totalClues - (cluesRevealed - 1) : 0;
  return { points, maxPoints, cluesRevealed, won };
}

export function formatWhoAmIScore(score: WhoAmIScore): string {
  return `${score.points}/${score.maxPoints}`;
}

export function normalizeWhoAmIScore(score: WhoAmIScore): number {
  if (score.maxPoints === 0) return 0;
  return Math.round((score.points / score.maxPoints) * 100);
}
