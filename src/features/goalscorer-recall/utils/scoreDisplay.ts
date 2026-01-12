/**
 * Score display utilities for Goalscorer Recall.
 *
 * Generates emoji grids and formatted text for sharing results.
 *
 * Format: ✅✅✅❌❌
 * - ✅ for each found goal (in chronological order)
 * - ❌ for each missed goal (in chronological order)
 */

import type { GoalWithState } from '../types/goalscorerRecall.types';

/**
 * Generate the emoji grid for a goalscorer recall result.
 *
 * @param goals - All goals with their found state
 * @returns Emoji grid string
 *
 * @example
 * // All found
 * generateGoalscorerEmojiGrid(goals)
 * // "✅✅✅✅✅"
 *
 * @example
 * // Partial completion
 * generateGoalscorerEmojiGrid(goals)
 * // "✅✅✅❌❌"
 */
export function generateGoalscorerEmojiGrid(goals: GoalWithState[]): string {
  // Sort goals by minute for consistent display
  const sortedGoals = [...goals].sort((a, b) => a.minute - b.minute);

  // Filter out own goals (they don't count in the display)
  const scoredGoals = sortedGoals.filter((g) => !g.isOwnGoal);

  // Generate goal emojis
  const goalEmojis = scoredGoals
    .map((goal) => (goal.found ? '✅' : '❌'))
    .join('');

  return goalEmojis;
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
