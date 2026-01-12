import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { HintLabel } from '../types/transferGuess.types';

/** Spring configuration for reveal animation */
const REVEAL_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

/** Icon placeholders for each hint type (will be replaced with real icons later) */
const ICON_PLACEHOLDERS: Record<HintLabel, string> = {
  Number: '#',
  Position: '⚽',
  Nation: '🏴',
};

export interface HintSlotProps {
  /** The hint label (Number, Position, Nation) */
  label: HintLabel;
  /** The hint text content */
  hint: string;
  /** Whether the hint has been revealed */
  isRevealed: boolean;
  /** The slot number (1, 2, or 3) - kept for compatibility */
  slotNumber: number;
  /** Whether in review mode (shows different styling for unrevealed) */
  isReviewMode?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * HintSlot - Displays a single hint as an icon box.
 *
 * Hidden: Shows placeholder icon (e.g., #, ⚽, 🏴)
 * Revealed: Shows actual value (e.g., 7, ATT, 🇧🇷)
 */
export function HintSlot({
  label,
  hint,
  isRevealed,
  isReviewMode = false,
  testID,
}: HintSlotProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRevealed) {
      // Pop animation on reveal
      scale.value = withSpring(1.1, { damping: 10, stiffness: 300 });
      setTimeout(() => {
        scale.value = withSpring(1, REVEAL_SPRING);
      }, 100);
    }
  }, [isRevealed, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // What to display in the box
  const displayValue = isRevealed ? hint : ICON_PLACEHOLDERS[label];
  const isPlaceholder = !isRevealed;

  return (
    <Animated.View style={[styles.box, animatedStyle]} testID={testID}>
      <View
        style={[
          styles.iconContainer,
          isRevealed && styles.iconContainerRevealed,
          !isRevealed && isReviewMode && styles.iconContainerNotRevealed,
        ]}
      >
        <Text
          style={[
            styles.iconText,
            isRevealed && styles.iconTextRevealed,
            isPlaceholder && styles.iconTextPlaceholder,
          ]}
          testID={`${testID}-hint-text`}
        >
          {displayValue}
        </Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerRevealed: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: colors.cardYellow,
  },
  iconContainerNotRevealed: {
    opacity: 0.5,
    borderStyle: 'dashed',
  },
  iconText: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.textSecondary,
  },
  iconTextRevealed: {
    color: colors.cardYellow,
  },
  iconTextPlaceholder: {
    fontSize: 28,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
