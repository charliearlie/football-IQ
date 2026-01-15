/**
 * GridCell Component
 *
 * Individual cell in The Grid with "Solid Layer" 3D architecture.
 * - Empty cells: Appear "sunk" with minimal depth (1px)
 * - Filled cells: Pop up with 3px depth and green background
 * - Uses two absolute-positioned layers for cross-platform consistency
 */

import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, borderRadius, depthOffset, spacing } from '@/theme';
import { triggerSelection, triggerIncomplete } from '@/lib/haptics';
import { FilledCell, CellIndex } from '../types/theGrid.types';

export interface GridCellProps {
  index: CellIndex;
  cell: FilledCell | null;
  isSelected: boolean;
  onPress: (index: CellIndex) => void;
  disabled?: boolean;
  testID?: string;
}

const CELL_SIZE = 90;
const EMPTY_DEPTH = depthOffset.sunk; // 1px - sunk effect
const FILLED_DEPTH = depthOffset.cell; // 3px - pop-up effect

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * GridCell - A single cell in the 3x3 grid.
 *
 * States:
 * - Empty: Shows "?" with sunk appearance (darker shadow visible at top)
 * - Filled: Shows player name with pop-up green block
 * - Selected: Has yellow border highlight
 */
export function GridCell({
  index,
  cell,
  isSelected,
  onPress,
  disabled = false,
  testID,
}: GridCellProps) {
  const isFilled = cell !== null;
  const pressed = useSharedValue(0);

  // Use different depths for empty vs filled cells
  const depth = isFilled ? FILLED_DEPTH : EMPTY_DEPTH;
  const layerHeight = CELL_SIZE;

  const handlePressIn = () => {
    if (!isFilled && !disabled) {
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = () => {
    if (isFilled) {
      // Gentle feedback when tapping already-filled cell
      triggerIncomplete();
      return;
    }
    if (!disabled) {
      // Selection feedback when tapping empty cell
      triggerSelection();
      onPress(index);
    }
  };

  // Animate only translateY on the top layer
  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
  }));

  // Determine colors based on state
  const getTopColor = () => {
    if (isSelected && !isFilled) return 'rgba(250, 204, 21, 0.15)'; // Yellow tint for selected empty
    if (isFilled) return colors.pitchGreen;
    return 'rgba(255, 255, 255, 0.08)'; // Glass background for empty
  };

  const getShadowColor = () => {
    if (isFilled) return colors.grassShadow;
    // For empty cells, use a darker shade to create "sunk" effect
    return 'rgba(0, 0, 0, 0.3)';
  };

  const getBorderColor = () => {
    if (isSelected) return colors.cardYellow;
    return 'transparent';
  };

  // Shared style for both layers
  const layerStyle = {
    width: CELL_SIZE,
    height: layerHeight,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: getBorderColor(),
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled && isFilled}
      style={[
        styles.container,
        {
          height: CELL_SIZE + depth,
          paddingBottom: depth,
          opacity: disabled && !isFilled ? 0.6 : 1,
        },
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={
        isFilled
          ? `Cell ${index + 1}: ${cell.player}`
          : isSelected
            ? `Cell ${index + 1}: Selected`
            : `Cell ${index + 1}: Empty, tap to select`
      }
    >
      {/* Shadow/Depth Layer - Fixed at bottom */}
      <View
        style={[
          styles.layer,
          styles.shadowLayer,
          layerStyle,
          {
            backgroundColor: getShadowColor(),
            // For empty cells, add a subtle top border to enhance "sunk" effect
            ...(!isFilled && {
              borderTopWidth: 2,
              borderTopColor: 'rgba(0, 0, 0, 0.2)',
            }),
          },
        ]}
      />

      {/* Top/Face Layer - Animates down on press */}
      <Animated.View
        style={[
          styles.layer,
          styles.topLayer,
          layerStyle,
          {
            backgroundColor: getTopColor(),
          },
          animatedTopStyle,
        ]}
      >
        {isFilled ? (
          <Text
            style={styles.playerName}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {cell.player}
          </Text>
        ) : (
          <Text style={styles.emptyIcon}>?</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CELL_SIZE,
    overflow: 'visible', // Critical for Android - prevents layer clipping
  },
  layer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  emptyIcon: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.textSecondary,
  },
  playerName: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: colors.stadiumNavy,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
