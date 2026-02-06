/**
 * Share utilities for The Chain game results.
 */

import { Share, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { ChainScore, generateChainEmojiGrid, getChainScoreEmoji } from "./scoring";

export interface ShareResult {
  success: boolean;
  method: "share" | "clipboard";
  error?: Error;
}

/**
 * Generate share text for The Chain result.
 */
export function generateShareText(
  score: ChainScore,
  par: number,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const emojiGrid = generateChainEmojiGrid(score);
  const emoji = getChainScoreEmoji(score);

  // Format: "The Chain - 5 Feb 2026"
  // "🐦 Birdie! 4 steps (Par 5)"
  // ""
  // "🐦 4 steps (-1)"
  // ""
  // "footballiq.app"

  const lines = [
    `The Chain - ${dateStr}`,
    "",
    `${emoji} ${score.label}! ${score.stepsTaken} steps (Par ${par})`,
    "",
    emojiGrid,
    "",
    "footballiq.app",
  ];

  return lines.join("\n");
}

/**
 * Share The Chain result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareTheChainResult(
  score: ChainScore,
  par: number,
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateShareText(score, par, puzzleDate);

  // Try native share first (not available on web)
  if (Platform.OS !== "web") {
    try {
      const result = await Share.share({
        message: shareText,
      });

      if (result.action === Share.sharedAction) {
        return { success: true, method: "share" };
      } else if (result.action === Share.dismissedAction) {
        // User dismissed, not an error
        return { success: false, method: "share" };
      }
    } catch (error) {
      console.warn("[TheChain] Native share failed, falling back to clipboard:", error);
    }
  }

  // Fallback to clipboard
  try {
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: "clipboard" };
  } catch (error) {
    return {
      success: false,
      method: "clipboard",
      error: error instanceof Error ? error : new Error("Clipboard copy failed"),
    };
  }
}
