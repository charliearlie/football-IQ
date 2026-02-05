/**
 * GridCell Component
 *
 * Individual cell in The Grid with "Solid Layer" 3D architecture.
 * Stadium Broadcast Edition styling:
 * - Empty cells: Dark background with "+" icon
 * - Filled cells: Pitch stripe gradient with player name + rarity badge
 * - Uses two absolute-positioned layers for cross-platform consistency
 */

import React, { useMemo } from 'react';
import { Text, StyleSheet, Pressable, View, ActivityIndicator } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
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

const PRESS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * Get color for rarity percentage display.
 * Lower rarity = more prestigious color.
 */
function getRarityColor(rarityPct: number): string {
  if (rarityPct < 1) return '#FFD700'; // Gold for <1% (legendary)
  if (rarityPct < 5) return '#A855F7'; // Purple for <5% (epic)
  if (rarityPct < 20) return '#3B82F6'; // Blue for <20% (rare)
  return colors.pitchGreen; // Green for common
}

/**
 * GridCell - A single cell in the 3x3 grid.
 *
 * States:
 * - Empty: Shows "?" with sunk appearance (darker shadow visible at top)
 * - Filled: Shows player name with green background + rarity percentage
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
  const hasRarity = cell?.rarityPct !== undefined && !cell.rarityLoading;

  // Animation values
  const pressed = useSharedValue(0);

  // Use different depths for empty vs filled cells
  const depth = isFilled ? FILLED_DEPTH : EMPTY_DEPTH;
  const layerHeight = CELL_SIZE;

  const handlePressIn = () => {
    if (!isFilled && !disabled) {
      pressed.value = withSpring(1, PRESS_SPRING);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, PRESS_SPRING);
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

  // Animate only translateY on the top layer (press effect)
  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
  }));

  // Determine colors based on state
  const getTopColor = () => {
    if (isSelected && !isFilled) return 'rgba(250, 204, 21, 0.15)'; // Yellow tint for selected empty
    if (isFilled) return colors.pitchGreen; // Base color (gradient overlay used)
    return 'rgba(30, 41, 59, 0.8)'; // Dark background for empty cells
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

  // Rarity display formatting
  const rarityText = useMemo(() => {
    if (!cell?.rarityPct) return '';
    if (cell.rarityPct < 1) return '<1%';
    return `${Math.round(cell.rarityPct)}%`;
  }, [cell?.rarityPct]);

  const rarityColor = useMemo(() => {
    return cell?.rarityPct !== undefined ? getRarityColor(cell.rarityPct) : colors.pitchGreen;
  }, [cell?.rarityPct]);

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
          ? `Cell ${index + 1}: ${cell.player}${hasRarity ? `, ${rarityText} rarity` : ''}`
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
      <Animated.View style={[styles.layer, styles.topLayer, animatedPressStyle]}>
        {/* Empty state - "+" icon on dark background */}
        {!isFilled && (
          <View style={[layerStyle, { backgroundColor: getTopColor() }, styles.faceContent]}>
            <Text style={styles.emptyIcon}>+</Text>
          </View>
        )}

        {/* Filled state - pitch stripe gradient with player name + rarity badge */}
        {isFilled && (
          <View style={[layerStyle, styles.faceContent, styles.filledCell]}>
            {/* Pitch stripe background using SVG gradient */}
            <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="pitchStripe" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#4CB302" />
                  <Stop offset="0.16" stopColor="#4CB302" />
                  <Stop offset="0.16" stopColor="#58CC02" />
                  <Stop offset="0.33" stopColor="#58CC02" />
                  <Stop offset="0.33" stopColor="#4CB302" />
                  <Stop offset="0.5" stopColor="#4CB302" />
                  <Stop offset="0.5" stopColor="#58CC02" />
                  <Stop offset="0.66" stopColor="#58CC02" />
                  <Stop offset="0.66" stopColor="#4CB302" />
                  <Stop offset="0.83" stopColor="#4CB302" />
                  <Stop offset="0.83" stopColor="#58CC02" />
                  <Stop offset="1" stopColor="#58CC02" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#pitchStripe)" />
            </Svg>

            {/* Player name - broadcast style */}
            <Text
              style={styles.playerNameBroadcast}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {cell.player}
            </Text>

            {/* Rarity badge - bottom right corner */}
            {hasRarity && (
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityBadgeText}>{rarityText}</Text>
              </View>
            )}

            {/* Loading spinner (while rarity loads) */}
            {cell.rarityLoading && (
              <ActivityIndicator
                size="small"
                color={colors.floodlightWhite}
                style={styles.spinner}
              />
            )}
          </View>
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
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  faceContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledCell: {
    overflow: 'hidden', // Clip gradient to border radius
  },
  emptyIcon: {
    fontFamily: fonts.body,
    fontSize: 28,
    fontWeight: '300', // Light weight for elegant "+"
    color: 'rgba(255, 255, 255, 0.4)', // Subtle gray
  },
  playerNameBroadcast: {
    fontFamily: fonts.headline, // Bebas Neue for broadcast feel
    fontSize: 14,
    color: colors.floodlightWhite, // White text on green
    textAlign: 'center',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rarityBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityBadgeText: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    color: colors.stadiumNavy,
  },
  spinner: {
    position: 'absolute',
    bottom: 6,
  },
});
