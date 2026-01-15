/**
 * PlayerGrade - FIFA/EAFC-style player grade badge
 *
 * Displays a dynamic grade based on IQ score and global rank percentile.
 * Grades: GOAT (top 1%), World Class (top 10%), Division 1/2, Prospect
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';

export type PlayerGradeLevel = 'GOAT' | 'WORLD CLASS' | 'DIVISION 1' | 'DIVISION 2' | 'PROSPECT';

interface GradeConfig {
  label: PlayerGradeLevel;
  backgroundColor: string;
  textColor: string;
  hasShimmer: boolean;
  hasGlow: boolean;
  glowColor?: string;
}

/**
 * Determine player grade based on IQ and rank percentile.
 */
export function getPlayerGrade(
  globalIQ: number,
  rankPercentile: number | null
): GradeConfig {
  const pct = rankPercentile ?? 100; // Default to low percentile if no rank

  // GOAT: IQ >= 90 AND top 1%
  if (globalIQ >= 90 && pct <= 1) {
    return {
      label: 'GOAT',
      backgroundColor: '#FFD700', // Gold
      textColor: colors.stadiumNavy,
      hasShimmer: true,
      hasGlow: true,
      glowColor: '#FFD700',
    };
  }

  // World Class: IQ >= 75 AND top 10%
  if (globalIQ >= 75 && pct <= 10) {
    return {
      label: 'WORLD CLASS',
      backgroundColor: colors.pitchGreen,
      textColor: colors.stadiumNavy,
      hasShimmer: false,
      hasGlow: true,
      glowColor: colors.pitchGreen,
    };
  }

  // Division 1: IQ >= 60
  if (globalIQ >= 60) {
    return {
      label: 'DIVISION 1',
      backgroundColor: colors.cardYellow,
      textColor: colors.stadiumNavy,
      hasShimmer: false,
      hasGlow: false,
    };
  }

  // Division 2: IQ >= 40
  if (globalIQ >= 40) {
    return {
      label: 'DIVISION 2',
      backgroundColor: colors.warningOrange,
      textColor: colors.floodlightWhite,
      hasShimmer: false,
      hasGlow: false,
    };
  }

  // Prospect: IQ < 40
  return {
    label: 'PROSPECT',
    backgroundColor: colors.textSecondary,
    textColor: colors.stadiumNavy,
    hasShimmer: false,
    hasGlow: false,
  };
}

export interface PlayerGradeProps {
  globalIQ: number;
  /** User's rank percentile (1 = top 1%, 10 = top 10%, etc.) */
  rankPercentile: number | null;
  testID?: string;
}

export function PlayerGrade({ globalIQ, rankPercentile, testID }: PlayerGradeProps) {
  const grade = getPlayerGrade(globalIQ, rankPercentile);
  const shimmerPosition = useSharedValue(-1);
  const glowOpacity = useSharedValue(0.4);

  // Shimmer animation for GOAT tier
  useEffect(() => {
    if (grade.hasShimmer) {
      shimmerPosition.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false
      );
    }
  }, [grade.hasShimmer, shimmerPosition]);

  // Glow pulse animation
  useEffect(() => {
    if (grade.hasGlow) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [grade.hasGlow, glowOpacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * 100 }],
    opacity: grade.hasShimmer ? 0.3 : 0,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: grade.glowColor ?? 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: grade.hasGlow ? glowOpacity.value : 0,
    shadowRadius: 8,
    elevation: grade.hasGlow ? 8 : 0,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: grade.backgroundColor },
        glowStyle,
      ]}
      testID={testID}
    >
      {/* Shimmer overlay for GOAT */}
      {grade.hasShimmer && (
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      )}

      <Text style={[styles.label, { color: grade.textColor }]}>
        {grade.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
  },
  label: {
    fontFamily: fonts.headline,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
