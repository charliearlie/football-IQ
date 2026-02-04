/**
 * GridCell Component
 *
 * Individual cell in The Grid with "Solid Layer" 3D architecture and flip animation.
 * - Empty cells: Appear "sunk" with minimal depth (1px)
 * - Filled cells: Pop up with 3px depth and green background
 * - Filled + rarity loaded: Flip to reveal "Player Card" with flag + rarity %
 * - Uses two absolute-positioned layers for cross-platform consistency
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Text, StyleSheet, Pressable, View, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, fonts, borderRadius, depthOffset, spacing } from '@/theme';
import { triggerSelection, triggerIncomplete } from '@/lib/haptics';
import { FlagIcon } from '@/components/FlagIcon';
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

// "Trading card" flip - heavy, weighty feel (from PlayerMarker)
const FLIP_SPRING = {
  damping: 18,
  stiffness: 180,
  mass: 1.2,
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
 * GridCell - A single cell in the 3x3 grid with flip animation.
 *
 * States:
 * - Empty: Shows "?" with sunk appearance (darker shadow visible at top)
 * - Filled (loading): Shows player name with green background + spinner
 * - Filled (rarity loaded): Flips to show Player Card (flag + name + rarity %)
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
  const wasFilledRef = useRef(isFilled);
  const wasRarityLoadedRef = useRef(hasRarity);

  // Animation values
  const pressed = useSharedValue(0);
  const flipProgress = useSharedValue(hasRarity ? 1 : 0);

  // Use different depths for empty vs filled cells
  const depth = isFilled ? FILLED_DEPTH : EMPTY_DEPTH;
  const layerHeight = CELL_SIZE;

  // Handle flip animation when rarity loads
  useEffect(() => {
    if (hasRarity && !wasRarityLoadedRef.current) {
      // Delay flip slightly for visual effect
      const timeout = setTimeout(() => {
        flipProgress.value = withSpring(1, FLIP_SPRING);
      }, 200);
      return () => clearTimeout(timeout);
    }
    wasRarityLoadedRef.current = hasRarity;
  }, [hasRarity, flipProgress]);

  // Reset flip when cell becomes empty (game reset)
  useEffect(() => {
    if (!isFilled && wasFilledRef.current) {
      flipProgress.value = 0;
    }
    wasFilledRef.current = isFilled;
  }, [isFilled, flipProgress]);

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

  // Animated flip style for front face (name only)
  const animatedFrontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipProgress.value, [0, 0.5], [1, 0]);

    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Animated flip style for back face (player card) - starts rotated 180deg
  const animatedBackStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    const opacity = interpolate(flipProgress.value, [0.5, 1], [0, 1]);

    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Animated background color for flip transition
  const animatedColorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      flipProgress.value,
      [0, 0.5, 1],
      [
        colors.pitchGreen, // Green (front)
        'rgba(255, 255, 255, 0.8)', // Mid-transition (whitening)
        colors.floodlightWhite, // White (back - player card)
      ]
    );

    return { backgroundColor };
  });

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
        {/* Empty state */}
        {!isFilled && (
          <View style={[layerStyle, { backgroundColor: getTopColor() }, styles.faceContent]}>
            <Text style={styles.emptyIcon}>?</Text>
          </View>
        )}

        {/* Filled state with flip animation */}
        {isFilled && (
          <>
            {/* Front face (green with name + loading) */}
            <Animated.View
              style={[
                layerStyle,
                styles.faceContent,
                styles.flipFace,
                { backgroundColor: colors.pitchGreen },
                animatedFrontStyle,
              ]}
            >
              <Text
                style={styles.playerName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {cell.player}
              </Text>
              {cell.rarityLoading && (
                <ActivityIndicator
                  size="small"
                  color={colors.stadiumNavy}
                  style={styles.spinner}
                />
              )}
            </Animated.View>

            {/* Back face (player card with flag + rarity) */}
            <Animated.View
              style={[
                layerStyle,
                styles.faceContent,
                styles.flipFace,
                animatedColorStyle,
                animatedBackStyle,
              ]}
            >
              {/* Flag */}
              {cell.nationalityCode && (
                <View style={styles.flagContainer}>
                  <FlagIcon code={cell.nationalityCode} size={14} />
                </View>
              )}

              {/* Player name */}
              <Text
                style={styles.cardName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {cell.player}
              </Text>

              {/* Rarity percentage */}
              {hasRarity && (
                <Text style={[styles.rarityText, { color: rarityColor }]}>
                  {rarityText}
                </Text>
              )}
            </Animated.View>
          </>
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
  flipFace: {
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
  spinner: {
    position: 'absolute',
    bottom: 6,
  },
  // Player card (back face) styles
  flagContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  cardName: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    color: colors.stadiumNavy,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  rarityText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
