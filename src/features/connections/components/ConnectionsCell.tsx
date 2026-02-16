/**
 * ConnectionsCell Component
 *
 * Individual player cell in the Connections grid.
 * Shows player name with different states: default, selected, disabled.
 */

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, borderRadius, spacing } from '@/theme';

export interface ConnectionsCellProps {
  playerName: string;
  displayName: string;
  isSelected: boolean;
  disabled?: boolean;
  onPress: (name: string) => void;
  testID?: string;
}

const PRESS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * ConnectionsCell - A single player cell in the grid.
 *
 * States:
 * - Default: Dark background with white text
 * - Selected: Yellow background with navy text (highlight)
 * - Disabled: Greyed out (already solved)
 */
export function ConnectionsCell({
  playerName,
  displayName,
  isSelected,
  disabled = false,
  onPress,
  testID,
}: ConnectionsCellProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    if (!disabled) {
      pressed.value = withSpring(1, PRESS_SPRING);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, PRESS_SPRING);
  };

  const handlePress = () => {
    if (!disabled) {
      onPress(playerName);
    }
  };

  // Animate scale on press
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.05 }],
  }));

  // Determine colors based on state
  const backgroundColor = isSelected
    ? colors.cardYellow // Yellow highlight for selected
    : colors.stadiumNavy; // Dark background for default

  const textColor = isSelected ? colors.stadiumNavy : colors.floodlightWhite;

  const borderColor = isSelected ? colors.cardYellow : 'rgba(255, 255, 255, 0.1)';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.4 : 1,
        },
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${playerName}${isSelected ? ', selected' : ''}`}
    >
      <Animated.View
        style={[
          styles.cell,
          {
            backgroundColor,
            borderColor,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[styles.playerName, { color: textColor }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {displayName}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 64,
    minWidth: 0, // Allow flex shrink
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  playerName: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
