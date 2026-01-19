/**
 * Scoring utilities for Goalscorer Recall game mode.
 *
 * Scoring system: 1 point per scorer + 3 point bonus for finding all
 * - Points = scorersFound + (allFound ? 3 : 0)
 * - Example: 6 scorers, found 6/6 = 6 + 3 = 9 points
 * - Example: 5 scorers, found 3/5 = 3 points (no bonus)
 * - Win condition: All unique scorers found before timer expires
 */

import { GoalscorerRecallScore } from '../types/goalscorerRecall.types';

/** Bonus points for finding all scorers */
const ALL_FOUND_BONUS = 3;

/**
 * Calculate the final score for a goalscorer recall game.
 *
 * Formula: points = scorersFound + (allFound ? 3 : 0)
 *
 * @param scorersFound - Number of unique scorers correctly identified
 * @param totalScorers - Total number of unique scorers (excluding own goals)
 * @param allFound - Whether all scorers were found
 * @param timeRemaining - Seconds remaining when game ended (for win condition)
 * @returns Complete score object
 *
 * @example
 * // All found with time remaining (5-scorer game) - gets +3 bonus
 * calculateGoalscorerScore(5, 5, true, 30)
 * // { points: 8, scorersFound: 5, totalScorers: 5, allFound: true, won: true }
 *
 * @example
 * // All found in a 6-scorer game - gets +3 bonus
 * calculateGoalscorerScore(6, 6, true, 30)
 * // { points: 9, scorersFound: 6, totalScorers: 6, allFound: true, won: true }
 *
 * @example
 * // Partial completion (time ran out) - no bonus
 * calculateGoalscorerScore(3, 5, false, 0)
 * // { points: 3, scorersFound: 3, totalScorers: 5, allFound: false, won: false }
 */
export function calculateGoalscorerScore(
  scorersFound: number,
  totalScorers: number,
  allFound: boolean,
  timeRemaining: number = 0
): GoalscorerRecallScore {
  // Handle edge case of no scorers (shouldn't happen in real puzzles)
  if (totalScorers === 0) {
    return {
      points: 0,
      scorersFound: 0,
      totalScorers: 0,
      allFound: true,
      won: true,
    };
  }

  // Points = scorers found + bonus for finding all
  const points = scorersFound + (allFound ? ALL_FOUND_BONUS : 0);

  // Win requires finding all scorers before time expires
  const won = allFound && timeRemaining > 0;

  return {
    points,
    scorersFound,
    totalScorers,
    allFound,
    won,
  };
}

/**
 * Format score for display in the result modal.
 *
 * @param score - The calculated score object
 * @returns Formatted string (e.g., "3/5")
 *
 * @example
 * formatGoalscorerScore({ points: 3, scorersFound: 3, totalScorers: 5, ... })
 * // "3/5"
 */
export function formatGoalscorerScore(score: GoalscorerRecallScore): string {
  return `${score.scorersFound}/${score.totalScorers}`;
}

/**
 * Get a descriptive message based on the score.
 *
 * @param score - The calculated score object
 * @returns Encouraging message for the result modal
 */
export function getScoreMessage(score: GoalscorerRecallScore): string {
  if (score.won || score.allFound) {
    return 'All scorers found!';
  }

  // Calculate completion percentage
  const completionRate = score.totalScorers > 0
    ? score.scorersFound / score.totalScorers
    : 0;

  if (completionRate >= 0.8) {
    return 'Great memory! So close!';
  }

  if (completionRate >= 0.5) {
    return 'Good effort! Keep practicing!';
  }

  if (score.scorersFound > 0) {
    return 'Nice try! Every scorer counts!';
  }

  return 'Better luck next time!';
}
