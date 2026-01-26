/**
 * TierCrest - Simple tier badge display
 *
 * A clean pill-shaped badge showing the user's current tier.
 * Higher tiers get subtle glow effects.
 */

import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';

export interface TierCrestProps {
  /** The tier name to display (e.g., "TRIALIST", "BENCHWARMER") */
  tierName: string;
  /** The tier's associated color */
  tierColor: string;
  /** Tier level 1-10, used for glow intensity */
  tierLevel: number;
  testID?: string;
}

/**
 * Determines if a tier should have a glow effect.
 * Tiers 5+ (Starting XI and above) get glow effects.
 */
function shouldGlow(tierLevel: number): boolean {
  return tierLevel >= 5;
}

export function TierCrest({
  tierName,
  tierColor,
  tierLevel,
  testID,
}: TierCrestProps) {
  const hasGlow = shouldGlow(tierLevel);
  const glowIntensity = Math.min((tierLevel - 4) / 6, 1);
  const glowOpacity = useSharedValue(0.3);

  // Glow pulse animation for higher tiers
  useEffect(() => {
    if (hasGlow) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6 + glowIntensity * 0.2, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.3, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = 0;
    }
  }, [hasGlow, glowIntensity, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: tierColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: hasGlow ? glowOpacity.value : 0,
    shadowRadius: 10 + glowIntensity * 6,
    elevation: hasGlow ? 6 : 0,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.badge, { backgroundColor: tierColor }, glowStyle]}
      testID={testID}
    >
      <Text style={styles.tierName} numberOfLines={1} adjustsFontSizeToFit>
        {tierName}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontFamily: fonts.headline,
    fontSize: 16,
    fontWeight: fontWeights.bold,
    color: colors.stadiumNavy,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
