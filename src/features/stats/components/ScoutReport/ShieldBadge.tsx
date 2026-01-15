/**
 * ShieldBadge - 3D collectible badge using Solid Layer architecture
 *
 * A tactile, pressable badge component that displays achievement stats
 * with a shield shape and 3D depth effect following the established
 * Solid Layer pattern (like ElevatedButton and GridCell).
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, fonts, fontWeights, spacing, depthOffset, getDepthColor } from '@/theme';

// Shield dimensions
const SHIELD_WIDTH = 90;
const SHIELD_HEIGHT = 100;

/**
 * SVG path for shield shape
 * Creates a classic shield/crest outline
 */
const SHIELD_PATH = `
  M 45 5
  L 85 15
  C 87 15 88 17 88 19
  L 88 50
  C 88 70 70 88 45 95
  C 20 88 2 70 2 50
  L 2 19
  C 2 17 3 15 5 15
  Z
`;

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

export interface ShieldBadgeProps {
  /** Icon to display in the badge */
  icon: ReactNode;
  /** Main value (e.g., "42", "#5", "78%") */
  value: string;
  /** Label below the value */
  label: string;
  /** Badge color */
  color: string;
  /** Whether this is an earned/active badge */
  isEarned?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Animation delay for staggered entrance (ms) */
  animationDelay?: number;
  /** Test ID */
  testID?: string;
}

export function ShieldBadge({
  icon,
  value,
  label,
  color,
  isEarned = true,
  onPress,
  animationDelay = 0,
  testID,
}: ShieldBadgeProps) {
  const pressed = useSharedValue(0);
  const { triggerMedium } = useHaptics();

  const DEPTH = depthOffset.cell; // 3px
  const shadowColor = getDepthColor(color, 25);
  const displayColor = isEarned ? color : colors.textSecondary;
  const displayShadow = isEarned ? shadowColor : getDepthColor(colors.textSecondary, 25);

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * DEPTH }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      triggerMedium();
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  };

  const content = (
    <>
      {/* Shadow/Depth Layer - Fixed at bottom */}
      <View style={[styles.shadowLayer, { top: DEPTH }]}>
        <Svg width={SHIELD_WIDTH} height={SHIELD_HEIGHT} viewBox="0 0 90 100">
          <Path d={SHIELD_PATH} fill={displayShadow} />
        </Svg>
      </View>

      {/* Top/Face Layer - Animates on press */}
      <Animated.View style={[styles.topLayer, animatedTopStyle]}>
        <Svg
          width={SHIELD_WIDTH}
          height={SHIELD_HEIGHT}
          viewBox="0 0 90 100"
          style={styles.shieldSvg}
        >
          <Defs>
            <LinearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={displayColor} stopOpacity={1} />
              <Stop offset="100%" stopColor={getDepthColor(displayColor, 10)} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Path
            d={SHIELD_PATH}
            fill={`url(#grad-${label})`}
            stroke={isEarned ? colors.floodlightWhite : 'transparent'}
            strokeWidth={isEarned ? 1.5 : 0}
            strokeOpacity={0.3}
          />
        </Svg>

        {/* Content overlay */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>{icon}</View>
          <Text
            style={[
              styles.value,
              { color: isEarned ? colors.stadiumNavy : colors.floodlightWhite },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
          <Text
            style={[
              styles.label,
              { color: isEarned ? colors.stadiumNavy : colors.floodlightWhite },
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </>
  );

  return (
    <Animated.View
      entering={FadeInRight.delay(animationDelay).springify()}
      testID={testID}
    >
      {onPress ? (
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[styles.container, { paddingBottom: DEPTH }]}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}`}
        >
          {content}
        </Pressable>
      ) : (
        <View style={[styles.container, { paddingBottom: DEPTH }]}>{content}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SHIELD_WIDTH,
    height: SHIELD_HEIGHT + depthOffset.cell,
    overflow: 'visible', // Critical for Android
  },
  shadowLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  topLayer: {
    width: SHIELD_WIDTH,
    height: SHIELD_HEIGHT,
    position: 'relative',
  },
  shieldSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: fonts.headline,
    fontSize: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 9,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 11,
    marginTop: 2,
  },
});
