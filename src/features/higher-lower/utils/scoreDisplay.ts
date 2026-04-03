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
    : `I survived ${score.roundsCompleted - 1} round${score.roundsCompleted - 1 === 1 ? '' : 's'} of Higher/Lower!`;

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
  const survived = score.roundsCompleted - 1;
  if (survived === 0) return 'Out on the first round!';
  return `Survived ${survived} of 10 rounds`;
}
