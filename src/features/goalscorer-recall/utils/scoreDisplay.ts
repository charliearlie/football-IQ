/**
 * Score display utilities for Goalscorer Recall.
 *
 * Generates emoji grids and formatted text for sharing results.
 *
 * Format: ⏱️42s | ✅✅✅✅✅
 * - ⏱️ followed by seconds remaining (or 0 if time ran out)
 * - | separator
 * - ✅ for each found goal (in chronological order)
 * - ❌ for each missed goal (in chronological order)
 */

import type { GoalWithState } from '../types/goalscorerRecall.types';

/**
 * Generate the emoji grid for a goalscorer recall result.
 *
 * @param goals - All goals with their found state
 * @param timeRemaining - Seconds remaining when game ended
 * @returns Emoji grid string
 *
 * @example
 * // All found with time remaining
 * generateGoalscorerEmojiGrid(goals, 42)
 * // "⏱️42s | ✅✅✅✅✅"
 *
 * @example
 * // Partial completion (time ran out)
 * generateGoalscorerEmojiGrid(goals, 0)
 * // "⏱️0s | ✅✅✅❌❌"
 */
export function generateGoalscorerEmojiGrid(
  goals: GoalWithState[],
  timeRemaining: number
): string {
  // Sort goals by minute for consistent display
  const sortedGoals = [...goals].sort((a, b) => a.minute - b.minute);

  // Filter out own goals (they don't count in the display)
  const scoredGoals = sortedGoals.filter((g) => !g.isOwnGoal);

  // Generate goal emojis
  const goalEmojis = scoredGoals
    .map((goal) => (goal.found ? '✅' : '❌'))
    .join('');

  // Format: ⏱️42s | ✅✅✅✅✅
  return `⏱️${timeRemaining}s | ${goalEmojis}`;
}

/**
 * Generate a compact score summary for display.
 *
 * @param scorersFound - Number of unique scorers found
 * @param totalScorers - Total unique scorers
 * @returns Summary string (e.g., "3/5 scorers")
 */
export function generateScoreSummary(
  scorersFound: number,
  totalScorers: number
): string {
  return `${scorersFound}/${totalScorers} scorers`;
}
