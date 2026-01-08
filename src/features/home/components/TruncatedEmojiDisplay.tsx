/**
 * TruncatedEmojiDisplay Component
 *
 * Displays emoji strings with graceful truncation for long sequences.
 * Handles Unicode-aware emoji counting to properly truncate multi-codepoint emoji.
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '@/theme';

interface TruncatedEmojiDisplayProps {
  /**
   * The emoji string to display.
   */
  emojiString: string;
  /**
   * Maximum number of emoji to display before truncating.
   * @default 8
   */
  maxLength?: number;
  /**
   * Test ID for testing.
   */
  testID?: string;
}

/**
 * Count emoji characters in a string using Unicode-aware matching.
 * Handles multi-codepoint emoji like flags and skin tone modifiers.
 */
function getEmojiArray(str: string): string[] {
  // Match emoji including:
  // - Basic emoji (U+1F300-U+1F9FF)
  // - Dingbats (U+2700-U+27BF)
  // - Misc symbols (U+2600-U+26FF)
  // - Common game squares (U+2B1B, U+2B1C, U+2705, U+274C, U+2B55)
  // - ZWJ sequences (emoji joined with U+200D)
  const emojiRegex =
    /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\u{FE0F})?(?:\u{200D}(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\u{FE0F})?)*|[\u2B1B\u2B1C\u2705\u274C\u2B55]/gu;

  return str.match(emojiRegex) || [];
}

/**
 * Truncates an emoji string to a maximum length.
 * Appends "..." if truncation occurs.
 */
function truncateEmoji(emojiString: string, maxLength: number): string {
  const emojiArray = getEmojiArray(emojiString);

  if (emojiArray.length <= maxLength) {
    return emojiArray.join('');
  }

  return emojiArray.slice(0, maxLength - 1).join('') + '…';
}

/**
 * TruncatedEmojiDisplay - Displays emoji with graceful truncation.
 *
 * Ensures long emoji sequences (10+ steps) don't break card layouts.
 */
export function TruncatedEmojiDisplay({
  emojiString,
  maxLength = 8,
  testID,
}: TruncatedEmojiDisplayProps) {
  // Guard against empty strings
  if (!emojiString || emojiString.trim().length === 0) {
    return null;
  }

  const displayString = truncateEmoji(emojiString, maxLength);

  return (
    <Text style={styles.emoji} testID={testID}>
      {displayString}
    </Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    ...textStyles.bodySmall,
    color: colors.floodlightWhite,
  },
});
