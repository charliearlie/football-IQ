/**
 * ExpandedDateContent Component
 *
 * Expanded content for a date accordion row.
 * Shows a vertical list of MiniGameCards with fade-in animation.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { colors, spacing } from '@/theme';
import { ArchiveDateGroup, ArchivePuzzle } from '../types/archive.types';
import { MiniGameCard, GAME_MODE_TITLES } from './MiniGameCard';

interface ExpandedDateContentProps {
  /** Date group data containing puzzles */
  group: ArchiveDateGroup;
  /** Callback when a puzzle card is pressed */
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
  /** Test ID for testing */
  testID?: string;
}

const CARD_GAP = spacing.sm;
const CONTAINER_PADDING = spacing.lg;

/**
 * ExpandedDateContent - Animated vertical list of mini game cards.
 *
 * Features:
 * - Single column vertical layout
 * - Smooth fade-in/fade-out animation
 * - Layout animation for height changes
 */
export function ExpandedDateContent({
  group,
  onPuzzlePress,
  testID,
}: ExpandedDateContentProps) {
  // Filter out unrecognized game modes (no "Unknown" cards)
  const validPuzzles = useMemo(
    () => group.puzzles.filter((p) => GAME_MODE_TITLES[p.gameMode] !== undefined),
    [group.puzzles]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify().damping(15).stiffness(150)}
      style={styles.container}
      testID={testID}
    >
      <View style={styles.list}>
        {validPuzzles.map((puzzle, index) => (
          <View key={puzzle.id} style={styles.cardWrapper}>
            <MiniGameCard
              puzzle={puzzle}
              onPress={() => onPuzzlePress(puzzle)}
              testID={`${testID}-card-${index}`}
            />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)', // Slightly darker than stadiumNavy
    paddingVertical: spacing.md,
    paddingHorizontal: CONTAINER_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  list: {
    flexDirection: 'column',
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: '100%',
  },
});
