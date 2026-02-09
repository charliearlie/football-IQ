/**
 * RankCard - Displays a single rank slot in the Top Tens grid.
 *
 * States:
 * - Hidden: Glass background with muted rank number
 * - Found (rank > 1): Solid pitch green, navy text
 * - Found (rank 1): Solid gold, navy text
 * - Auto-revealed (give up): Blue background, white text
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
import { colors, textStyles, borderRadius, glows, fonts } from '@/theme';
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
 * Stadium Night design with left-aligned row layout:
 * - Hidden state: Glass background with muted rank number
 * - Found state: Solid green (or gold for #1) with name + stat
 * - Auto-revealed state: Blue background with white text (give-up)
 * - Climbing highlight: Full-card illumination
 * - Error flash: Red illumination
 */
export function RankCard({
  slot,
  isLatest,
  isHighlighted,
  highlightType,
  testID,
}: RankCardProps) {
  const isGold = slot.rank === 1;

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

  // Animated styles for content reveal (name + stat)
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
    highlightType === 'error'
      ? colors.redCard
      : isGold
        ? colors.cardYellow
        : colors.pitchGreen;

  // Text color depends on found state
  const isAutoRevealed = slot.found && slot.autoRevealed;
  const textColor = isAutoRevealed ? colors.floodlightWhite : colors.stadiumNavy;

  // Build card style based on state
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = { ...styles.card };

    if (slot.found && slot.autoRevealed) {
      // Auto-revealed on give up — dark navy with subtle white border
      return {
        ...baseStyle,
        backgroundColor: colors.stadiumNavy,
        borderColor: 'rgba(255, 255, 255, 0.25)',
      };
    }

    if (slot.found) {
      const glow = isGold ? glows.yellow : glows.green;
      return {
        ...baseStyle,
        backgroundColor: isGold ? colors.cardYellow : colors.pitchGreen,
        borderColor: isGold ? colors.cardYellow : colors.pitchGreen,
        ...glow,
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

        {/* Rank number - always visible */}
        <Text
          style={[
            styles.rankNumber,
            slot.found && !isAutoRevealed && styles.rankNumberFound,
            isAutoRevealed && styles.rankNumberAutoRevealed,
          ]}
        >
          {slot.rank}
        </Text>

        {/* Player name - revealed on find */}
        <Animated.View style={[styles.nameContainer, contentAnimatedStyle]}>
          <Text style={[styles.answerName, { color: textColor }]} numberOfLines={1}>
            {slot.answer?.name?.toUpperCase() ?? ''}
          </Text>
        </Animated.View>

        {/* Stat badge - revealed on find */}
        {slot.answer?.info && (
          <Animated.Text
            style={[styles.statBadge, { color: textColor }, contentAnimatedStyle]}
            numberOfLines={1}
          >
            {slot.answer.info}
          </Animated.Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    opacity: 0.3,
  },
  rankNumber: {
    fontFamily: fonts.headline,
    fontSize: 20,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.3)',
    width: 32,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rankNumberFound: {
    color: 'rgba(15, 23, 42, 0.5)',
  },
  rankNumberAutoRevealed: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  nameContainer: {
    flex: 1,
  },
  answerName: {
    fontFamily: fonts.headline,
    fontSize: 18,
    lineHeight: 24,
    color: colors.stadiumNavy,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statBadge: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.stadiumNavy,
    opacity: 0.6,
    includeFontPadding: false,
  },
});
