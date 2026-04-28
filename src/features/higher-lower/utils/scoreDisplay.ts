/**
 * Score Display for Higher/Lower
 *
 * Generates text-based descriptions for sharing game results.
 */

import { HigherLowerScore } from './scoring';

/**
 * Generate share text for the game result.
 */
export function generateScoreDisplay(
  score: HigherLowerScore,
  options: { puzzleDate?: string } = {}
): string {
  const { puzzleDate } = options;

  const firstLine = score.won
    ? 'I got a perfect 10 in Higher/Lower!'
    : `I scored ${score.points}/10 in Higher/Lower!`;

  const lines: string[] = [firstLine];

  if (puzzleDate) {
    lines.push(puzzleDate);
  }

  lines.push('');
  lines.push(`Score: ${score.points}/${score.maxPoints}`);
  lines.push(generateScoreDescription(score));

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/higher-lower?ref=share&date=${puzzleDate}`
    : 'https://football-iq.app?ref=share';
  lines.push(playUrl);

  return lines.join('\n');
}

/**
 * Generate a text description of the game result for share cards.
 */
export function generateScoreDescription(score: HigherLowerScore): string {
  if (score.won) return 'Perfect 10 — got every round right!';
  return `${score.points} out of 10 correct`;
}
