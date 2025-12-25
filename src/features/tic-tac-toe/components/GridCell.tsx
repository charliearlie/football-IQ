/**
 * GridCell Component
 *
 * A single cell in the Tic Tac Toe grid with ElevatedButton-style aesthetics.
 * Displays different states: empty (clickable), player-claimed, AI-claimed.
 */

import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { colors, borderRadius, spacing, textStyles } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';
import type { CellState, CellIndex } from '../types/ticTacToe.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface GridCellProps {
  /** Cell index (0-8) */
  index: CellIndex;
  /** Current cell state */
  cell: CellState;
  /** Whether this cell is currently selected */
  isSelected: boolean;
  /** Whether it's the player's turn */
  isPlayerTurn: boolean;
  /** Whether the cell is part of the winning line */
  isWinningCell: boolean;
  /** Callback when cell is pressed */
  onPress: (index: CellIndex) => void;
  /** Whether the game is over */
  isGameOver: boolean;
}

const SPRING_CONFIG = {
  damping: 12,
  stiffness: 150,
  mass: 0.5,
};

const CELL_SIZE = 90;
const SHADOW_OFFSET = 4;

/**
 * GridCell - Individual cell in the Tic Tac Toe grid
 */
export function GridCell({
  index,
  cell,
  isSelected,
  isPlayerTurn,
  isWinningCell,
  onPress,
  isGameOver,
}: GridCellProps) {
  const pressed = useSharedValue(0);
  const winPulse = useSharedValue(0);
  const { triggerSelection } = useHaptics();

  // Determine cell state
  const isEmpty = cell.owner === null;
  const isPlayer = cell.owner === 'player';
  const isAI = cell.owner === 'ai';
  const canPress = isEmpty && isPlayerTurn && !isGameOver;

  // Pulse animation for winning cells
  if (isWinningCell && winPulse.value === 0) {
    winPulse.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.7, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * SHADOW_OFFSET }],
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isWinningCell ? winPulse.value * 0.1 + 0.95 : 1 }],
  }));

  const handlePressIn = () => {
    if (canPress) {
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = () => {
    if (canPress) {
      triggerSelection();
      onPress(index);
    }
  };

  // Determine colors based on state
  const getTopColor = () => {
    if (isSelected) return colors.cardYellow;
    if (isPlayer) return colors.pitchGreen;
    if (isAI) return colors.redCard;
    return colors.glassBackground;
  };

  const getShadowColor = () => {
    if (isSelected) return '#C9A000';
    if (isPlayer) return colors.grassShadow;
    if (isAI) return '#B91C1C';
    return 'rgba(255, 255, 255, 0.03)';
  };

  const getBorderColor = () => {
    if (isSelected) return colors.cardYellow;
    if (isWinningCell) return colors.pitchGreen;
    return colors.glassBorder;
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!canPress}
      style={[styles.container, animatedScaleStyle]}
      testID={`grid-cell-${index}`}
      accessibilityRole="button"
      accessibilityLabel={
        isEmpty
          ? `Empty cell ${index + 1}`
          : isPlayer
            ? `Your cell with ${cell.playerName}`
            : `AI cell with ${cell.playerName}`
      }
    >
      {/* Shadow layer */}
      <View
        style={[
          styles.layer,
          styles.shadow,
          {
            backgroundColor: getShadowColor(),
            borderColor: getBorderColor(),
          },
        ]}
      />

      {/* Top layer */}
      <Animated.View
        style={[
          styles.layer,
          styles.top,
          {
            backgroundColor: getTopColor(),
            borderColor: getBorderColor(),
          },
          animatedTopStyle,
        ]}
      >
        {/* Empty state - show question mark or tap indicator */}
        {isEmpty && (
          <Text style={styles.emptyText}>?</Text>
        )}

        {/* Player claimed - show name and checkmark */}
        {isPlayer && (
          <View style={styles.claimedContent}>
            <Check
              size={20}
              color={colors.stadiumNavy}
              strokeWidth={3}
            />
            <Text
              style={styles.playerName}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {cell.playerName}
            </Text>
          </View>
        )}

        {/* AI claimed - show AI badge and name */}
        {isAI && (
          <View style={styles.claimedContent}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
            <Text
              style={[styles.playerName, styles.aiPlayerName]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {cell.playerName}
            </Text>
          </View>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    paddingBottom: SHADOW_OFFSET,
  },
  layer: {
    width: CELL_SIZE,
    height: CELL_SIZE - SHADOW_OFFSET,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  emptyText: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.5,
  },
  claimedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  playerName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.stadiumNavy,
    textAlign: 'center',
    lineHeight: 13,
  },
  aiPlayerName: {
    color: colors.floodlightWhite,
  },
  aiBadge: {
    backgroundColor: colors.stadiumNavy,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },
});
