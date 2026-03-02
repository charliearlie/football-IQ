/**
 * ConnectionsCell Component
 *
 * 3D tactile tile with solid layer depth pattern.
 * Shows player name with states: default, selected (pressed down), shaking.
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, depthColors, fonts, borderRadius, spacing, glows } from '@/theme';
import { depthOffset } from '@/theme/spacing';
import { useHaptics } from '@/hooks/useHaptics';

export interface ConnectionsCellProps {
  playerName: string;
  displayName: string;
  isSelected: boolean;
  isShaking: boolean;
  disabled?: boolean;
  onPress: (name: string) => void;
  testID?: string;
}

const DEPTH_OFFSET = depthOffset.cell; // 3
const CELL_HEIGHT = 72;
const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

/**
 * ConnectionsCell - A single player cell with 3D solid layer depth.
 *
 * States:
 * - Default: Glass background, raised (translateY: 0)
 * - Selected: Pitch green, pressed down (translateY: DEPTH_OFFSET)
 * - Shaking: Horizontal shake animation on wrong guess
 */
export function ConnectionsCell({
  playerName,
  displayName,
  isSelected,
  isShaking,
  disabled = false,
  onPress,
  testID,
}: ConnectionsCellProps) {
  const pressed = useSharedValue(isSelected ? 1 : 0);
  const shakeX = useSharedValue(0);
  const { triggerLight } = useHaptics();

  // Sync pressed state when isSelected changes
  useEffect(() => {
    pressed.value = withSpring(isSelected ? 1 : 0, SPRING_CONFIG);
  }, [isSelected]);

  // Trigger shake animation
  useEffect(() => {
    if (isShaking) {
      shakeX.value = withSequence(
        withTiming(-1, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(2, { duration: 50 }),
        withTiming(-1, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [isShaking]);

  const handlePressIn = () => {
    if (!disabled && !isSelected) {
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !isSelected) {
      pressed.value = withSpring(0, SPRING_CONFIG);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      triggerLight();
      onPress(playerName);
    }
  };

  // Animate top face translateY (pressed down effect)
  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * DEPTH_OFFSET }],
  }));

  // Shake animation for outer container
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Determine colors based on state
  const topColor = isSelected ? 'rgba(46, 252, 93, 0.25)' : colors.glassBackground;
  const shadowColor = isSelected ? '#0D5A1E' : depthColors.stadiumNavy;
  const borderColor = isSelected ? colors.pitchGreen : 'rgba(255, 255, 255, 0.1)';
  const textColor = isSelected ? '#FFFFFF' : colors.floodlightWhite;

  // Glow shadow for iOS when selected
  const selectedGlowStyle = undefined;

  return (
    <Animated.View style={[styles.outerContainer, shakeStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[styles.container, { opacity: disabled ? 0.4 : 1 }]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${playerName}${isSelected ? ', selected' : ''}`}
      >
        {/* Shadow/Depth Layer */}
        <View
          style={[
            styles.layer,
            styles.shadow,
            { backgroundColor: shadowColor, borderColor },
          ]}
        />

        {/* Top/Face Layer */}
        <Animated.View
          style={[
            styles.layer,
            styles.top,
            { backgroundColor: topColor, borderColor },
            selectedGlowStyle,
            animatedTopStyle,
          ]}
        >
          <Text
            style={[styles.playerName, { color: textColor }]}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {displayName}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    minWidth: 0, // Allow flex shrink
  },
  container: {
    height: CELL_HEIGHT,
    paddingBottom: DEPTH_OFFSET,
  },
  layer: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: DEPTH_OFFSET,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: DEPTH_OFFSET,
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
