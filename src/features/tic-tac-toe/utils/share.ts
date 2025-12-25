/**
 * Share Functionality for Tic Tac Toe
 *
 * Handles sharing game results via native share sheet (mobile)
 * or clipboard (web).
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { CellArray, TicTacToeScore } from '../types/ticTacToe.types';
import { generateTicTacToeScoreDisplay } from './scoreDisplay';

/**
 * Result of a share attempt.
 */
export interface ShareResult {
  /** Whether the share was successful */
  success: boolean;
  /** Method used: native share sheet or clipboard */
  method: 'share' | 'clipboard';
  /** Error if share failed */
  error?: Error;
}

/**
 * Share Tic Tac Toe game results.
 *
 * Behavior by platform:
 * - iOS/Android: Opens native share sheet
 * - Web: Copies to clipboard
 *
 * @param cells - Final cell states
 * @param score - Game score
 * @param puzzleDate - Date of the puzzle (YYYY-MM-DD)
 * @returns ShareResult with success status and method used
 *
 * @example
 * const result = await shareTicTacToeResult(cells, score, '2025-01-15');
 * if (result.success && result.method === 'clipboard') {
 *   showToast('Copied to clipboard!');
 * }
 */
export async function shareTicTacToeResult(
  cells: CellArray,
  score: TicTacToeScore,
  puzzleDate: string
): Promise<ShareResult> {
  const shareText = generateTicTacToeScoreDisplay(cells, score, {
    includeDate: true,
    puzzleDate,
  });

  try {
    if (Platform.OS === 'web') {
      // Web: Copy to clipboard
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: 'clipboard' };
    }

    // Mobile: Use native share sheet
    const result = await Share.share({
      message: shareText,
    });

    if (result.action === Share.sharedAction) {
      return { success: true, method: 'share' };
    } else {
      // User dismissed the share sheet
      return { success: false, method: 'share' };
    }
  } catch (error) {
    return {
      success: false,
      method: Platform.OS === 'web' ? 'clipboard' : 'share',
      error: error as Error,
    };
  }
}

/**
 * Copy text directly to clipboard.
 * Useful for the "Copy" button alternative to share.
 *
 * @param text - Text to copy
 * @returns Whether copy succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
