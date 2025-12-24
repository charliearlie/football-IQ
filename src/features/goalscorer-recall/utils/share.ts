/**
 * Share utilities for Goalscorer Recall.
 *
 * Generates shareable text for game results including:
 * - Match info
 * - Score percentage
 * - Emoji grid
 * - Time bonus (if applicable)
 */

import type {
  GoalscorerRecallScore,
  GoalWithState,
} from '../types/goalscorerRecall.types';
import { generateGoalscorerEmojiGrid } from './scoreDisplay';

interface MatchInfo {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

/**
 * Generate full share text for a goalscorer recall result.
 *
 * @param score - The final score object
 * @param goals - All goals with their found state
 * @param matchInfo - Match details
 * @param puzzleDate - Optional puzzle date for display
 * @returns Full share text
 *
 * @example
 * generateGoalscorerShareText(score, goals, matchInfo, '2024-01-15')
 * // Football IQ ⚽ Goalscorer Recall
 * // Arsenal 4-2 Leicester (Jan 15)
 * //
 * // ⏱️42s | ✅✅✅✅✅✅
 * // 100% (+84 bonus)
 * //
 * // https://footballiq.app
 */
export function generateGoalscorerShareText(
  score: GoalscorerRecallScore,
  goals: GoalWithState[],
  matchInfo: MatchInfo,
  puzzleDate?: string
): string {
  const lines: string[] = [];

  // Header
  lines.push('Football IQ ⚽ Goalscorer Recall');

  // Match line with optional date
  const matchLine = `${matchInfo.homeTeam} ${matchInfo.homeScore}-${matchInfo.awayScore} ${matchInfo.awayTeam}`;
  if (puzzleDate) {
    const date = new Date(puzzleDate);
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    lines.push(`${matchLine} (${formatted})`);
  } else {
    lines.push(matchLine);
  }

  // Empty line
  lines.push('');

  // Emoji grid
  const emojiGrid = generateGoalscorerEmojiGrid(goals, score.timeRemaining);
  lines.push(emojiGrid);

  // Score line
  if (score.timeBonus > 0) {
    lines.push(`${score.percentage}% (+${score.timeBonus} bonus)`);
  } else {
    lines.push(`${score.percentage}%`);
  }

  // Empty line and link
  lines.push('');
  lines.push('https://footballiq.app');

  return lines.join('\n');
}

/**
 * Result of a share attempt.
 */
export interface ShareResult {
  success: boolean;
  method?: 'clipboard' | 'native';
}
