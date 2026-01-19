/**
 * Hero Section Component
 *
 * Displays the 3D floating game icon with animation.
 * Uses a two-layer structure for depth effect.
 */

import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Grid3X3 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GameRules } from '../../constants/rules';
import { colors, spacing, borderRadius, shadows } from '@/theme';

interface HeroSectionProps {
  /** Game rules containing icon and accent color */
  rules: GameRules;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Hero section with 3D floating game icon
 */
export function HeroSection({ rules, testID }: HeroSectionProps) {
  const floatY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Start floating animation on mount
  useEffect(() => {
    // Gentle floating up/down
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite
      true // Reverse
    );

    // Subtle scale pulse
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite
      true // Reverse
    );
  }, [floatY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: scale.value }],
  }));

  // Render icon - either Image or Lucide icon fallback
  const renderIcon = () => {
    if (rules.icon) {
      return (
        <Image
          source={rules.icon}
          style={styles.iconImage}
          resizeMode="contain"
        />
      );
    }

    // Fallback for the_grid which uses Lucide icon
    return <Grid3X3 size={64} color={rules.accentColor} strokeWidth={1.5} />;
  };

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        {/* Shadow layer (3D depth) */}
        <View
          style={[styles.iconShadow, { backgroundColor: rules.accentColor }]}
        />
        {/* Main icon container */}
        <View
          style={[styles.iconBackground, { borderColor: rules.accentColor }]}
        >
          {renderIcon()}
        </View>
      </Animated.View>
    </View>
  );
}

const ICON_SIZE = 120;
const SHADOW_OFFSET = 6;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconWrapper: {
    position: 'relative',
    width: ICON_SIZE,
    height: ICON_SIZE + SHADOW_OFFSET,
  },
  iconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: borderRadius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    zIndex: 1,
    ...shadows.lg,
  },
  iconImage: {
    width: 72,
    height: 72,
  },
  iconShadow: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: borderRadius['2xl'],
    top: SHADOW_OFFSET,
    left: 0,
    opacity: 0.3,
    zIndex: 0,
  },
});
