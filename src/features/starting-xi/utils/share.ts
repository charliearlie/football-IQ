/**
 * Share functionality for Starting XI game results.
 */

import { Share, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import type {
  StartingXIScore,
  PlayerSlotState,
  LineupContent,
} from "../types/startingXI.types";
import {
  generateStartingXIEmojiGrid,
} from "./scoreDisplay";

export interface ShareResult {
  success: boolean;
  method: "share" | "clipboard" | "none";
}

/**
 * Generate the full share text for a completed Starting XI game.
 *
 * @param score - Game score
 * @param slots - Player slot states
 * @param content - Puzzle content with match info
 * @returns Formatted share text
 *
 * @example
 * "Football IQ - Starting XI
 * Liverpool 4-0 Barcelona
 * Champions League SF (2019)
 *
 * Found 9/11 | Score: 9
 *
 *      🟩
 *   🟩🟩🟩
 *    🟩🟩🟩
 *  🟩❌🟩🟩
 *
 * footballiq.app"
 */
export function generateShareText(
  score: StartingXIScore,
  slots: PlayerSlotState[],
  content: LineupContent,
): string {
  const emojiGrid = generateStartingXIEmojiGrid(slots, content.formation);

  // Extract year from match_date if available
  const year = content.match_date?.slice(0, 4) || "";
  const yearDisplay = year ? ` (${year})` : "";

  const lines = [
    "Football IQ - Starting XI",
    content.match_name,
    `${content.competition}${yearDisplay}`,
    "",
    `Found ${score.foundCount}/${score.totalHidden} | Score: ${score.points}`,
    "",
    emojiGrid,
    "",
    "football-iq.app",
  ];

  return lines.join("\n");
}

/**
 * Share the game result using native share sheet or clipboard.
 *
 * @param score - Game score
 * @param slots - Player slot states
 * @param content - Puzzle content
 * @returns Result indicating success and method used
 */
export async function shareStartingXIResult(
  score: StartingXIScore,
  slots: PlayerSlotState[],
  content: LineupContent,
): Promise<ShareResult> {
  const shareText = generateShareText(score, slots, content);

  try {
    if (Platform.OS === "web") {
      // Web: copy to clipboard
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: "clipboard" };
    }

    // Mobile: use native share sheet
    const result = await Share.share({
      message: shareText,
    });

    if (result.action === Share.sharedAction) {
      return { success: true, method: "share" };
    } else if (result.action === Share.dismissedAction) {
      // User dismissed, but we can still copy to clipboard
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: "clipboard" };
    }

    return { success: false, method: "none" };
  } catch (error) {
    // Fallback to clipboard on error
    try {
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: "clipboard" };
    } catch {
      return { success: false, method: "none" };
    }
  }
}
