/**
 * Score Display for Who Am I?
 *
 * Generates text-based descriptions for sharing game results.
 */

import { WhoAmIScore } from './scoring';

/**
 * Generate share text for the game result.
 */
export function generateScoreDisplay(
  score: WhoAmIScore,
  options: { puzzleDate?: string } = {}
): string {
  const { puzzleDate } = options;

  const firstLine = score.won
    ? `I knew who it was after just ${score.cluesRevealed} clue${score.cluesRevealed === 1 ? '' : 's'}!`
    : 'This one stumped me completely';

  const lines: string[] = [firstLine];

  if (puzzleDate) {
    lines.push(puzzleDate);
  }

  lines.push('');
  lines.push(`Score: ${score.points}/${score.maxPoints}`);
  lines.push(generateScoreDescription(score));

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i&date=${puzzleDate}`
    : 'https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i';
  lines.push(playUrl);

  return lines.join('\n');
}

/**
 * Generate a text description of the game result for share cards.
 */
export function generateScoreDescription(score: WhoAmIScore): string {
  if (!score.won) return 'Did not guess correctly';
  if (score.cluesRevealed === 1) return 'Guessed on the first clue!';
  return `${score.cluesRevealed} of ${score.maxPoints} clues needed`;
}
