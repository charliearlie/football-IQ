/**
 * Share Utilities for Topical Quiz
 *
 * Platform-aware sharing of quiz results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { TopicalQuizScore, QuizAnswer } from '../types/topicalQuiz.types';
import { generateQuizScoreDisplay } from './quizScoreDisplay';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
}

export interface ShareQuizResultOptions {
  /** Puzzle date (YYYY-MM-DD) */
  puzzleDate?: string;
}

/**
 * Share quiz result using native share sheet or clipboard fallback.
 *
 * On iOS/Android: Opens native share sheet
 * On Web: Copies to clipboard
 *
 * @returns Result indicating success and method used
 */
export async function shareQuizResult(
  score: TopicalQuizScore,
  answers: QuizAnswer[],
  options: ShareQuizResultOptions = {}
): Promise<ShareResult> {
  const shareText = generateQuizScoreDisplay(score, answers, {
    title: 'Football IQ - Quiz',
    includeDate: true,
    puzzleDate: options.puzzleDate,
  });

  // Try native share first (mobile)
  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({
        message: shareText,
      });

      // On iOS, check if shared. On Android, always assume success if no error.
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      } else if (result.action === Share.dismissedAction) {
        // User dismissed, but no error - still technically successful
        return { success: true, method: 'share' };
      }
    } catch {
      // Fall through to clipboard
    }
  }

  // Fallback to clipboard
  try {
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'clipboard' };
  }
}
