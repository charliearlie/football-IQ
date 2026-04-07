/**
 * Score Display for Who's That?
 *
 * Generates text-based descriptions for sharing game results.
 */

import { WhosThatScore } from './scoring';

/**
 * Generate share text for the game result.
 */
export function generateScoreDisplay(
  score: WhosThatScore,
  options: { puzzleDate?: string } = {}
): string {
  const { puzzleDate } = options;

  const firstLine = score.won
    ? score.guessCount === 1
      ? 'Got it in one!'
      : `Got it in ${score.guessCount} guesses`
    : `Couldn't crack it in ${score.maxPoints} tries`;

  const lines: string[] = [firstLine];

  if (puzzleDate) {
    lines.push(puzzleDate);
  }

  lines.push('');
  lines.push(`Score: ${score.points}/${score.maxPoints}`);
  lines.push(generateScoreDescription(score));

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/whos-that?ref=share&mode=whos-that&date=${puzzleDate}`
    : 'https://football-iq.app/play/whos-that?ref=share&mode=whos-that';
  lines.push(playUrl);

  return lines.join('\n');
}

/**
 * Generate a text description of the game result for share cards.
 */
export function generateScoreDescription(score: WhosThatScore): string {
  if (!score.won) return 'Did not guess correctly';
  if (score.guessCount === 1) return 'Guessed on the first attempt!';
  return `${score.guessCount} of ${score.maxPoints} guesses needed`;
}
