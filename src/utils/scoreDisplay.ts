/**
 * Score Display Utilities
 *
 * Shared helpers for processing and formatting game score displays.
 */

/**
 * Extract only the emoji grid from the full score_display string.
 * Prevents text overflow by extracting just the emoji line.
 *
 * @param scoreDisplay - The full score display string (may contain multiple lines)
 * @returns The emoji grid line only, or empty string if not found
 *
 * @example
 * // Input: "Football IQ - Career Path\n2026-01-08\n\nScore: 8/10\n⬜⬜🟩⬛⬛"
 * // Output: "⬜⬜🟩⬛⬛"
 */
export function extractEmojiGrid(scoreDisplay: string | null | undefined): string {
  if (!scoreDisplay || scoreDisplay.trim().length === 0) {
    return '';
  }

  const lines = scoreDisplay.trim().split('\n');
  const emojiPattern =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u2B1B\u2B1C\u2705\u274C\u2B55]/u;

  // Search from the end since emoji grid is typically the last line
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (
      line &&
      emojiPattern.test(line) &&
      !line.includes(':') &&
      !line.includes('Football IQ')
    ) {
      return line;
    }
  }

  return '';
}

/**
 * Format a puzzle date for compact display in cards.
 * Uses short format like "Thu, Jan 8" for space efficiency.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
