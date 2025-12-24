/**
 * Scoring utilities for Goalscorer Recall game mode.
 *
 * Scoring system:
 * - Percentage-based: (scorersFound / totalScorers) * 100
 * - Time bonus: If all scorers found, bonus = remainingSeconds * 2
 * - Win condition: All unique scorers found before timer expires
 */

import {
  GoalscorerRecallScore,
  TIME_BONUS_MULTIPLIER,
} from '../types/goalscorerRecall.types';

/**
 * Calculate the final score for a goalscorer recall game.
 *
 * @param scorersFound - Number of unique scorers correctly identified
 * @param totalScorers - Total number of unique scorers (excluding own goals)
 * @param timeRemaining - Seconds remaining when game ended
 * @param allFound - Whether all scorers were found
 * @returns Complete score object
 *
 * @example
 * // All found with time remaining
 * calculateGoalscorerScore(5, 5, 30, true)
 * // { percentage: 100, timeBonus: 60, won: true, ... }
 *
 * @example
 * // Partial completion (time ran out)
 * calculateGoalscorerScore(3, 5, 0, false)
 * // { percentage: 60, timeBonus: 0, won: false, ... }
 */
export function calculateGoalscorerScore(
  scorersFound: number,
  totalScorers: number,
  timeRemaining: number,
  allFound: boolean
): GoalscorerRecallScore {
  // Handle edge case of no scorers (shouldn't happen in real puzzles)
  if (totalScorers === 0) {
    return {
      percentage: 100,
      scorersFound: 0,
      totalScorers: 0,
      timeRemaining,
      timeBonus: 0,
      allFound: true,
      won: true,
    };
  }

  // Calculate percentage (round to whole number)
  const percentage = Math.round((scorersFound / totalScorers) * 100);

  // Time bonus only awarded if all scorers found AND time remaining
  const timeBonus =
    allFound && timeRemaining > 0
      ? timeRemaining * TIME_BONUS_MULTIPLIER
      : 0;

  // Win requires finding all scorers before time expires
  const won = allFound && timeRemaining > 0;

  return {
    percentage,
    scorersFound,
    totalScorers,
    timeRemaining,
    timeBonus,
    allFound,
    won,
  };
}

/**
 * Format score for display in the result modal.
 *
 * @param score - The calculated score object
 * @returns Formatted string (e.g., "100%" or "80% (+24 bonus)")
 *
 * @example
 * formatGoalscorerScore({ percentage: 100, timeBonus: 60, ... })
 * // "100% (+60 bonus)"
 *
 * formatGoalscorerScore({ percentage: 60, timeBonus: 0, ... })
 * // "60%"
 */
export function formatGoalscorerScore(score: GoalscorerRecallScore): string {
  if (score.timeBonus > 0) {
    return `${score.percentage}% (+${score.timeBonus} bonus)`;
  }
  return `${score.percentage}%`;
}

/**
 * Get a descriptive message based on the score.
 *
 * @param score - The calculated score object
 * @returns Encouraging message for the result modal
 */
export function getScoreMessage(score: GoalscorerRecallScore): string {
  if (score.won && score.timeBonus > 0) {
    if (score.timeRemaining >= 30) {
      return 'Lightning fast! Incredible recall!';
    }
    return 'Perfect! All scorers found!';
  }

  if (score.percentage === 100) {
    return 'All scorers found!';
  }

  if (score.percentage >= 80) {
    return 'Great memory! So close!';
  }

  if (score.percentage >= 50) {
    return 'Good effort! Keep practicing!';
  }

  if (score.percentage > 0) {
    return 'Nice try! Every scorer counts!';
  }

  return 'Better luck next time!';
}
