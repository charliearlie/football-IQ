import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GlassCard } from '@/components';
import { colors, spacing, textStyles, borderRadius } from '@/theme';
import { HintLabel } from '../types/transferGuess.types';

/** Spring configuration for entrance animation */
const ENTRANCE_SPRING = {
  damping: 12,
  stiffness: 100,
  mass: 0.8,
};

export interface HintSlotProps {
  /** The hint label (Nationality, Position, Achievement) */
  label: HintLabel;
  /** The hint text content */
  hint: string;
  /** Whether the hint has been revealed */
  isRevealed: boolean;
  /** The slot number (1, 2, or 3) */
  slotNumber: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * HintSlot - Displays a single hint, either locked or revealed.
 *
 * When locked: Shows blurred content with lock icon.
 * When revealed: Shows hint with spring entrance animation.
 */
export function HintSlot({
  label,
  hint,
  isRevealed,
  slotNumber,
  testID,
}: HintSlotProps) {
  const animatedProgress = useSharedValue(isRevealed ? 1 : 0);

  useEffect(() => {
    if (isRevealed) {
      animatedProgress.value = withSpring(1, ENTRANCE_SPRING);
    }
  }, [isRevealed, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedProgress.value,
    transform: [
      {
        translateY: interpolate(
          animatedProgress.value,
          [0, 1],
          [20, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          animatedProgress.value,
          [0, 1],
          [0.95, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  if (!isRevealed) {
    return (
      <View style={styles.container} testID={testID}>
        <GlassCard style={styles.lockedCard}>
          <View style={styles.content}>
            <View style={styles.slotBadge}>
              <Text style={styles.slotNumber}>{slotNumber}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.lockedLabel}>{label}</Text>
              <Text style={styles.lockedText}>???</Text>
            </View>
          </View>
        </GlassCard>

        {/* Blur overlay */}
        {Platform.OS !== 'web' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={15}
            tint="dark"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webOverlay]} />
        )}

        {/* Lock icon */}
        <View style={styles.lockOverlay}>
          <View style={styles.lockCircle}>
            <Lock size={18} color={colors.textSecondary} strokeWidth={2} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]} testID={testID}>
      <GlassCard style={styles.revealedCard}>
        <View style={styles.content}>
          <View style={[styles.slotBadge, styles.slotBadgeRevealed]}>
            <Text style={[styles.slotNumber, styles.slotNumberRevealed]}>
              {slotNumber}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.revealedLabel}>{label}</Text>
            <Text style={styles.revealedText} testID={`${testID}-hint-text`}>
              {hint}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  lockedCard: {
    opacity: 0.6,
  },
  revealedCard: {
    borderColor: colors.cardYellow,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
  },
  slotBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeRevealed: {
    backgroundColor: colors.cardYellow,
  },
  slotNumber: {
    ...textStyles.subtitle,
    fontSize: 14,
    color: colors.textSecondary,
  },
  slotNumberRevealed: {
    color: colors.stadiumNavy,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  lockedLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockedText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  revealedLabel: {
    ...textStyles.caption,
    color: colors.cardYellow,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revealedText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
  },
  webOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
