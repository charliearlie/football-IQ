/**
 * GridCell Component
 *
 * Individual cell in The Grid. Shows empty state with "?" or filled state with player name.
 * Uses spring animations for press effect.
 */

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors, fonts, borderRadius } from '@/theme';
import { FilledCell, CellIndex } from '../types/theGrid.types';

export interface GridCellProps {
  index: CellIndex;
  cell: FilledCell | null;
  isSelected: boolean;
  onPress: (index: CellIndex) => void;
  disabled?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * GridCell - A single cell in the 3x3 grid.
 *
 * States:
 * - Empty: Shows "?" and is pressable
 * - Filled: Shows player name with green background
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
  const pressProgress = useSharedValue(0);

  const handlePressIn = () => {
    if (!isFilled && !disabled) {
      pressProgress.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    pressProgress.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!isFilled && !disabled) {
      onPress(index);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressProgress.value, [0, 1], [1, 0.95]);
    return {
      transform: [{ scale }],
    };
  });

  const cellStyle = [
    styles.cell,
    isFilled && styles.cellFilled,
    isSelected && styles.cellSelected,
    disabled && styles.cellDisabled,
  ];

  return (
    <AnimatedPressable
      style={[cellStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
    </AnimatedPressable>
  );
}

const CELL_SIZE = 90;

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellFilled: {
    backgroundColor: colors.pitchGreen,
  },
  cellSelected: {
    borderColor: colors.cardYellow,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
  },
  cellDisabled: {
    opacity: 0.6,
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
