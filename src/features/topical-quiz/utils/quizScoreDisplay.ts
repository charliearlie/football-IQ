/**
 * Score Display Utilities for Topical Quiz
 *
 * Generates shareable text and emoji grids for quiz results.
 */

import { TopicalQuizScore, QuizAnswer } from '../types/topicalQuiz.types';

const EMOJI = {
  correct: '\u2705', // ✅
  incorrect: '\u274C', // ❌
} as const;

export interface QuizScoreDisplayOptions {
  /** Title line (default: "Football IQ - Quiz") */
  title?: string;
  /** Include puzzle date */
  includeDate?: boolean;
  /** Puzzle date string (YYYY-MM-DD) */
  puzzleDate?: string;
}

/**
 * Generate full shareable score display text.
 *
 * @example
 * "Football IQ - Quiz
 * Dec 27, 2024
 *
 * Score: 4/5 Correct
 * ✅✅❌✅✅"
 */
export function generateQuizScoreDisplay(
  score: TopicalQuizScore,
  answers: QuizAnswer[],
  options: QuizScoreDisplayOptions = {}
): string {
  const {
    title = 'Football IQ - Quiz',
    includeDate = true,
    puzzleDate,
  } = options;

  const lines: string[] = [];

  lines.push(title);

  if (includeDate && puzzleDate) {
    lines.push(formatDisplayDate(puzzleDate));
  }

  lines.push('');
  lines.push(`Score: ${score.correctCount}/${score.totalQuestions} Correct`);
  lines.push(generateQuizEmojiGrid(answers));

  return lines.join('\n');
}

/**
 * Generate emoji grid from answers.
 *
 * @example
 * "✅✅❌✅❌"
 */
export function generateQuizEmojiGrid(answers: QuizAnswer[]): string {
  return answers.map((a) => (a.isCorrect ? EMOJI.correct : EMOJI.incorrect)).join('');
}

/**
 * Format puzzle date for display.
 *
 * @param dateStr - YYYY-MM-DD format
 * @returns Formatted date like "Dec 27, 2024"
 */
function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generate compact score display for home screen cards.
 *
 * @example "✅✅❌✅✅"
 */
export function generateQuizCardDisplay(answers: QuizAnswer[]): string {
  return generateQuizEmojiGrid(answers);
}
