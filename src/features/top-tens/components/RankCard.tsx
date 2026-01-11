/**
 * RankCard - Displays a single rank slot in the Top Tens grid.
 *
 * States:
 * - Hidden: Shows rank number with muted styling
 * - Found: Shows answer name with green glow background
 * - Highlighted: Full illumination during climbing animation
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, textStyles, borderRadius, glows } from '@/theme';
import { RankSlotState } from '../types/topTens.types';

/** Highlight type during climbing animation */
export type HighlightType = 'climbing' | 'success' | 'error' | null;

export interface RankCardProps {
  /** The rank slot state */
  slot: RankSlotState;
  /** Whether this is the most recently found slot */
  isLatest: boolean;
  /** Whether this card is currently highlighted during climbing */
  isHighlighted: boolean;
  /** Type of highlight effect */
  highlightType: HighlightType;
  /** Test ID for testing */
  testID?: string;
}

/**
 * RankCard - A single rank in the Top Tens grid.
 *
 * Compact design with full-card illumination effects:
 * - Hidden state: Dark background with muted rank number
 * - Found state: Green glow background
 * - Climbing highlight: Full green illumination
 * - Error flash: Red illumination
 */
export function RankCard({
  slot,
  isLatest,
  isHighlighted,
  highlightType,
  testID,
}: RankCardProps) {
  // Animation values
  const highlightOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const revealProgress = useSharedValue(slot.found ? 1 : 0);

  // Handle highlight animations
  useEffect(() => {
    if (isHighlighted && highlightType === 'climbing') {
      // Climbing through - quick fade in with slight scale
      highlightOpacity.value = withTiming(1, { duration: 60 });
      cardScale.value = withSequence(
        withSpring(1.02, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    } else if (highlightType === 'success') {
      // Success - pulse effect
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.6, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      cardScale.value = withSequence(
        withSpring(1.03, { damping: 12 }),
        withSpring(1, { damping: 12 })
      );
    } else if (highlightType === 'error') {
      // Error - flash red
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0.3, { duration: 60 }),
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 100 })
      );
    } else if (!isHighlighted) {
      // Fade out when no longer highlighted
      highlightOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [isHighlighted, highlightType, highlightOpacity, cardScale]);

  // Handle reveal animation when found
  useEffect(() => {
    if (slot.found && revealProgress.value === 0) {
      revealProgress.value = withSpring(1, { damping: 12, stiffness: 100 });
    }
  }, [slot.found, revealProgress]);

  // Animated styles for highlight overlay
  const highlightAnimatedStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  // Animated styles for card scale
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Animated styles for content reveal
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [
      {
        scale: interpolate(
          revealProgress.value,
          [0, 1],
          [0.9, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // Determine highlight color based on type
  const highlightColor =
    highlightType === 'error' ? colors.redCard : colors.pitchGreen;

  // Build card style based on state
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = { ...styles.card };

    if (slot.found) {
      // Found cards have permanent green glow
      return {
        ...baseStyle,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: colors.pitchGreen,
        borderWidth: 1.5,
        ...glows.green,
        shadowOpacity: isLatest ? 0.7 : 0.4,
        shadowRadius: isLatest ? 14 : 8,
      };
    }

    return baseStyle;
  };

  return (
    <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]} testID={testID}>
      <View style={getCardStyle()}>
        {/* Highlight overlay for climbing animation */}
        <Animated.View
          style={[
            styles.highlightOverlay,
            { backgroundColor: highlightColor },
            highlightAnimatedStyle,
          ]}
          pointerEvents="none"
        />

        {/* Card content - centered rank number OR answer name */}
        {slot.found && slot.answer ? (
          <Animated.Text
            style={[styles.answerName, contentAnimatedStyle]}
            numberOfLines={1}
          >
            {slot.answer.name}
          </Animated.Text>
        ) : (
          <Text style={styles.rankNumber}>{slot.rank}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    minHeight: 36,
    maxHeight: 48,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
    opacity: 0.3,
  },
  rankNumber: {
    ...textStyles.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: -2, // Optical adjustment for visual centering
  },
  answerName: {
    ...textStyles.h3,
    color: colors.text,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: -2, // Optical adjustment for visual centering
  },
});
