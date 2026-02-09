import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Calendar, Shirt, Flag, Lock } from 'lucide-react-native';
import { colors, spacing, fonts, borderRadius, depthOffset } from '@/theme';
import { FlagIcon } from '@/components/FlagIcon';
import { HintLabel } from '../types/transferGuess.types';

/** Regex to detect ISO 3166-1 alpha-2 codes (e.g. "BR", "GB-ENG") */
const ISO_CODE_PATTERN = /^[A-Z]{2}(-[A-Z]{2,3})?$/;

/** Depth for 3D effect (4px as per Solid Layer pattern) */
const DEPTH = depthOffset.tictacCell;

/** Slot height for consistent sizing */
const SLOT_HEIGHT = 100;

/** Spring config for reveal pop animation */
const POP_SPRING = {
  damping: 12,
  stiffness: 200,
  mass: 0.8,
};

const SETTLE_SPRING = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

/** Map hint labels to lucide-react-native icon components */
const SLOT_ICONS = {
  Year: Calendar,
  Position: Shirt,
  Nation: Flag,
} as const;

export interface DossierSlotProps {
  /** The hint label (Year, Position, Nation) */
  label: HintLabel;
  /** The hint text content */
  hint: string;
  /** Whether the hint has been revealed */
  isRevealed: boolean;
  /** Whether in review mode (shows different styling for unrevealed) */
  isReviewMode?: boolean;
  /** Optional style overrides for flex layout */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * DossierSlot - A single "Scouting Card" in the hint grid.
 *
 * Uses Solid Layer 3D architecture with lucide-react-native icons.
 * Locked: Glass background, icon + label, lock icon in top-right corner
 * Revealed: Green-tinted background, value "pops" in, category label at bottom
 */
export function DossierSlot({
  label,
  hint,
  isRevealed,
  isReviewMode = false,
  style,
  testID,
}: DossierSlotProps) {
  const wasRevealedRef = useRef(false);
  const Icon = SLOT_ICONS[label];

  // Animation values
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(isRevealed ? 1 : 0);
  const pressOffset = useSharedValue(0);

  // Trigger reveal animation when hint is unlocked
  useEffect(() => {
    if (isRevealed && !wasRevealedRef.current) {
      // Scale animation: compress -> pop -> settle
      scale.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withSpring(1.05, POP_SPRING),
        withSpring(1.0, SETTLE_SPRING)
      );

      // Border color transition: navy -> green
      borderProgress.value = withTiming(1, { duration: 300 });

      wasRevealedRef.current = true;
    }
  }, [isRevealed, scale, borderProgress]);

  // Top layer animated style (scale + translateY + border color)
  const animatedTopStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      borderProgress.value,
      [0, 1],
      [colors.stadiumNavy, colors.pitchGreen]
    );

    return {
      transform: [
        { scale: scale.value },
        { translateY: pressOffset.value * DEPTH },
      ],
      borderColor,
      backgroundColor: borderProgress.value > 0.5
        ? 'rgba(88, 204, 2, 0.1)'
        : 'rgba(255, 255, 255, 0.05)',
    };
  });

  // Determine content opacity for review mode (unrevealed slots are dimmed)
  const contentOpacity = !isRevealed && isReviewMode ? 0.4 : 1;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Shadow Layer - Fixed at bottom */}
      <View style={styles.shadowLayer} />

      {/* Top Layer - Animates on reveal */}
      <Animated.View style={[styles.topLayer, animatedTopStyle]}>
        {/* Lock icon in top-right corner (hidden state only) */}
        {!isRevealed && (
          <View style={styles.lockIcon}>
            <Lock size={12} color={colors.textSecondary} strokeWidth={2} />
          </View>
        )}

        <View style={[styles.content, { opacity: contentOpacity }]}>
          {/* Icon (hidden state) or Value (revealed state) */}
          {isRevealed ? (
            label === 'Nation' && ISO_CODE_PATTERN.test(hint) ? (
              <View testID={`${testID}-flag`} style={styles.flagContainer}>
                <FlagIcon code={hint} size={28} />
              </View>
            ) : (
              <Text
                style={styles.revealedValue}
                testID={`${testID}-value`}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {hint}
              </Text>
            )
          ) : (
            <>
              <Icon
                size={24}
                color={colors.textSecondary}
                strokeWidth={1.5}
                testID={`${testID}-icon`}
              />
              <Text style={styles.hiddenLabel}>{label.toUpperCase()}</Text>
            </>
          )}
        </View>

        {/* Category label at bottom (revealed state) */}
        {isRevealed && (
          <Text style={styles.revealedLabel}>{label.toUpperCase()}</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SLOT_HEIGHT + DEPTH,
    paddingBottom: DEPTH,
    overflow: 'visible', // Critical for Android 3D effect
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SLOT_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.8)',
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLOT_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  lockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  flagContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  hiddenLabel: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  revealedValue: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.pitchGreen,
    textAlign: 'center',
    letterSpacing: 1,
  },
  revealedLabel: {
    position: 'absolute',
    bottom: 8,
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
