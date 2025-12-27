/**
 * Scoring System for Topical Quiz
 *
 * Simple scoring: 2 points per correct answer, max 10 points.
 * No time penalty, no failure condition.
 */

import {
  TopicalQuizScore,
  POINTS_PER_CORRECT,
  MAX_POINTS,
  TOTAL_QUESTIONS,
} from '../types/topicalQuiz.types';

/**
 * Calculate quiz score based on number of correct answers.
 *
 * @param correctCount - Number of correct answers (0-5)
 * @returns Score object with points and metadata
 *
 * @example
 * calculateQuizScore(5) // { points: 10, correctCount: 5, won: true, ... }
 * calculateQuizScore(3) // { points: 6, correctCount: 3, won: true, ... }
 * calculateQuizScore(0) // { points: 0, correctCount: 0, won: true, ... }
 */
export function calculateQuizScore(correctCount: number): TopicalQuizScore {
  // Clamp to valid range
  const clampedCount = Math.max(0, Math.min(correctCount, TOTAL_QUESTIONS));

  return {
    points: clampedCount * POINTS_PER_CORRECT,
    maxPoints: MAX_POINTS,
    correctCount: clampedCount,
    totalQuestions: TOTAL_QUESTIONS,
    won: true, // No fail condition in quiz mode
  };
}

/**
 * Format score for display.
 *
 * @param score - Quiz score object
 * @returns Formatted string like "3/5"
 */
export function formatQuizScore(score: TopicalQuizScore): string {
  return `${score.correctCount}/${score.totalQuestions}`;
}

/**
 * Format score with points for detailed display.
 *
 * @param score - Quiz score object
 * @returns Formatted string like "3/5 Correct (6 pts)"
 */
export function formatQuizScoreDetailed(score: TopicalQuizScore): string {
  return `${score.correctCount}/${score.totalQuestions} Correct (${score.points} pts)`;
}
