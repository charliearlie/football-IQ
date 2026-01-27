/**
 * Score display utilities for Goalscorer Recall.
 *
 * Generates text-based descriptions for sharing results.
 */

import type { GoalWithState } from '../types/goalscorerRecall.types';

/**
 * Generate a text description for a goalscorer recall result.
 *
 * @param goals - All goals with their found state
 * @returns Text description like "3 of 5 found"
 */
export function generateGoalscorerScoreDescription(goals: GoalWithState[]): string {
  // Filter out own goals (they don't count)
  const scoredGoals = goals.filter((g) => !g.isOwnGoal);
  const foundCount = scoredGoals.filter((g) => g.found).length;
  const totalCount = scoredGoals.length;
  return `${foundCount} of ${totalCount} found`;
}

/**
 * @deprecated Use generateGoalscorerScoreDescription instead. Kept for backwards compatibility.
 */
export function generateGoalscorerEmojiGrid(goals: GoalWithState[]): string {
  return generateGoalscorerScoreDescription(goals);
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
