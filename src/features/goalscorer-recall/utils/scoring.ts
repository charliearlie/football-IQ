/**
 * Scoring utilities for Goalscorer Recall game mode.
 *
 * Scoring system: Raw count of scorers found
 * - Points = number of scorers found (e.g., 3 found = 3 points)
 * - Max points varies per puzzle based on total scorers
 * - Win condition: All unique scorers found before timer expires
 */

import { GoalscorerRecallScore } from '../types/goalscorerRecall.types';

/**
 * Calculate the final score for a goalscorer recall game.
 *
 * @param scorersFound - Number of unique scorers correctly identified
 * @param totalScorers - Total number of unique scorers (excluding own goals)
 * @param allFound - Whether all scorers were found
 * @param timeRemaining - Seconds remaining when game ended (for win condition)
 * @returns Complete score object
 *
 * @example
 * // All found with time remaining (5-scorer game)
 * calculateGoalscorerScore(5, 5, true, 30)
 * // { points: 5, scorersFound: 5, totalScorers: 5, allFound: true, won: true }
 *
 * @example
 * // All found in a 3-scorer game
 * calculateGoalscorerScore(3, 3, true, 30)
 * // { points: 3, scorersFound: 3, totalScorers: 3, allFound: true, won: true }
 *
 * @example
 * // Partial completion (time ran out)
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

  // Points = scorers found (raw count)
  const points = scorersFound;

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
