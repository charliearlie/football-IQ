/**
 * PlayerMarker Component
 *
 * Individual player marker on the pitch with "Solid Layer" 3D architecture.
 * Now enhanced with rich feedback animations:
 * - Golden Reveal: 3D flip animation with color transition + surname pop
 * - Error Shake: High-frequency shake + local red flash
 * - Duplicate Bounce: Attention-grabbing bounce on already-found markers
 *
 * Uses two absolute-positioned layers for cross-platform 3D depth effect.
 */

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts, borderRadius, depthOffset, spacing } from '@/theme';
import { triggerSelection, triggerIncomplete } from '@/lib/haptics';
import type { PlayerSlotState, SlotIndex, GuessResult } from '../types/startingXI.types';

export interface PlayerMarkerProps {
  /** Slot data including position, name, and state */
  slot: PlayerSlotState;
  /** Slot index (0-10) */
  index: SlotIndex;
  /** Whether this marker is currently selected */
  isSelected: boolean;
  /** Whether the game is over (disables interaction) */
  isGameOver: boolean;
  /** Callback when marker is pressed */
  onPress: (index: SlotIndex) => void;
  /** The result of the last guess ('correct' | 'incorrect' | 'duplicate' | null) */
  lastGuessResult?: GuessResult;
  /** The slot index that was guessed (for targeted animations) */
  lastGuessedId?: SlotIndex | null;
  /** Callback when reveal animation completes (for particle burst) */
  onRevealComplete?: (position: { x: number; y: number }) => void;
  /** Optional test ID */
  testID?: string;
}

const MARKER_SIZE = 72; // Large circles for readable names
const MARKER_DEPTH = depthOffset.cell; // 3px depth

// Standard press animation spring
const PRESS_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

// "Trading card" flip - heavy, weighty feel
const FLIP_SPRING = {
  damping: 18,
  stiffness: 180,
  mass: 1.2,
};

// Surname pop - bouncy reveal
const NAME_POP_SPRING = {
  damping: 12,
  stiffness: 200,
  mass: 0.8,
};

// Error shake recovery - sharp, punchy
const SHAKE_SPRING = {
  damping: 6,
  stiffness: 500,
  mass: 0.3,
};

// Duplicate bounce - attention-grabbing
const BOUNCE_SPRING = {
  damping: 10,
  stiffness: 400,
  mass: 0.5,
};

/**
 * PlayerMarker - Individual player position on the pitch with rich feedback animations.
 *
 * States:
 * - Hidden (guessable): Glass background, "?" icon, tappable
 * - Found: Green background, surname displayed (with flip animation)
 * - Revealed (pre-filled): Muted background, surname displayed, not tappable
 * - Selected: Yellow border on hidden state
 *
 * Animations:
 * - Golden Reveal: 3D flip (rotateY) + color transition + surname scale pop
 * - Error Shake: High-frequency X-axis shake + local red flash
 * - Duplicate Bounce: Y-axis bounce to show "already found"
 */
export function PlayerMarker({
  slot,
  index,
  isSelected,
  isGameOver,
  onPress,
  lastGuessResult,
  lastGuessedId,
  onRevealComplete,
  testID,
}: PlayerMarkerProps) {
  // Track if this slot was just revealed (for triggering animation)
  const wasFoundRef = useRef(slot.isFound);
  const containerRef = useRef<View>(null);

  // Press animation for 3D depth effect
  const pressed = useSharedValue(0);

  // Flip animation progress (0 = front/hidden, 1 = back/revealed)
  const flipProgress = useSharedValue(slot.isFound ? 1 : 0);

  // Surname scale for pop effect
  const nameScale = useSharedValue(slot.isFound ? 1 : 0.8);

  // Error shake X position
  const shakeX = useSharedValue(0);

  // Duplicate bounce Y position
  const bounceY = useSharedValue(0);

  // Local error flash opacity
  const localFlashOpacity = useSharedValue(0);
  // Flash color type: 0 = red (error), 1 = amber (wrong position)
  const flashColorType = useSharedValue(0);

  // Determine visual state
  const isHiddenAndUnfound = slot.isHidden && !slot.isFound;
  const isRevealed = !slot.isHidden || slot.isFound;
  const canPress = isHiddenAndUnfound && !isGameOver;

  // Check if this marker should animate based on guess result
  const shouldTriggerReveal =
    lastGuessResult === 'correct' && lastGuessedId === index && slot.isFound;
  const shouldTriggerError = lastGuessResult === 'incorrect' && lastGuessedId === index;
  const shouldTriggerBounce = lastGuessResult === 'duplicate' && lastGuessedId === index;
  const shouldTriggerWrongPosition =
    lastGuessResult === 'wrong_position' && lastGuessedId === index;

  // Handle reveal animation when slot becomes found
  useEffect(() => {
    if (slot.isFound && !wasFoundRef.current) {
      // Slot just became found - trigger flip animation
      flipProgress.value = withSpring(1, FLIP_SPRING, (finished) => {
        if (finished && onRevealComplete) {
          // Measure position and trigger particle burst
          runOnJS(measureAndNotify)();
        }
      });

      // Pop the surname after flip (delayed slightly)
      nameScale.value = withSequence(
        withTiming(0.8, { duration: 150 }), // Brief hold
        withSpring(1.15, NAME_POP_SPRING), // Pop up
        withSpring(1.0, { damping: 15, stiffness: 200 }) // Settle
      );
    }
    wasFoundRef.current = slot.isFound;
  }, [slot.isFound, flipProgress, nameScale, onRevealComplete]);

  // Handle error shake animation
  useEffect(() => {
    if (shouldTriggerError) {
      // Set flash to red
      flashColorType.value = 0;

      // High-frequency X-axis shake (6 oscillations, faster than input shake)
      shakeX.value = withSequence(
        withTiming(-8, { duration: 40, easing: Easing.linear }),
        withTiming(8, { duration: 40, easing: Easing.linear }),
        withTiming(-8, { duration: 40, easing: Easing.linear }),
        withTiming(8, { duration: 40, easing: Easing.linear }),
        withTiming(-6, { duration: 40, easing: Easing.linear }),
        withTiming(6, { duration: 40, easing: Easing.linear }),
        withSpring(0, SHAKE_SPRING)
      );

      // Local red flash pulse
      localFlashOpacity.value = withSequence(
        withTiming(0.4, { duration: 100 }),
        withTiming(0.4, { duration: 80 }), // Hold
        withTiming(0, { duration: 150 })
      );
    }
  }, [shouldTriggerError, shakeX, localFlashOpacity, flashColorType]);

  // Handle duplicate bounce animation
  useEffect(() => {
    if (shouldTriggerBounce) {
      bounceY.value = withSequence(
        withSpring(-10, BOUNCE_SPRING),
        withSpring(0, { damping: 12, stiffness: 300 })
      );
    }
  }, [shouldTriggerBounce, bounceY]);

  // Handle wrong position amber flash animation
  useEffect(() => {
    if (shouldTriggerWrongPosition) {
      // Set flash to amber
      flashColorType.value = 1;

      // Amber flash with longer hold to indicate "close but wrong"
      localFlashOpacity.value = withSequence(
        withTiming(0.5, { duration: 100 }),
        withTiming(0.5, { duration: 200 }), // Hold longer than error
        withTiming(0, { duration: 200 })
      );
      // Gentle bounce to draw attention
      bounceY.value = withSequence(
        withSpring(-6, { damping: 12, stiffness: 300 }),
        withSpring(0, { damping: 15, stiffness: 250 })
      );
    }
  }, [shouldTriggerWrongPosition, localFlashOpacity, bounceY, flashColorType]);

  // Measure marker position for particle burst
  const measureAndNotify = () => {
    if (containerRef.current && onRevealComplete) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        onRevealComplete({
          x: pageX + width / 2,
          y: pageY + height / 2,
        });
      });
    }
  };

  const handlePressIn = () => {
    if (canPress) {
      pressed.value = withSpring(1, PRESS_SPRING);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, PRESS_SPRING);
  };

  const handlePress = () => {
    if (!canPress) {
      // Gentle feedback when tapping non-interactive marker
      triggerIncomplete();
      return;
    }
    triggerSelection();
    onPress(index);
  };

  // Animated press style for top layer (3D depth)
  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * MARKER_DEPTH }],
  }));

  // Animated shake + bounce style (applied to outer container)
  const animatedShakeBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { translateY: bounceY.value }],
  }));

  // Animated flip style for front face (question mark)
  const animatedFrontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipProgress.value, [0, 0.5], [1, 0]);

    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Animated flip style for back face (surname) - starts rotated 180deg
  const animatedBackStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    const opacity = interpolate(flipProgress.value, [0.5, 1], [0, 1]);

    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Animated surname scale
  const animatedNameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nameScale.value }],
  }));

  // Animated background color for flip transition
  const animatedColorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      flipProgress.value,
      [0, 0.5, 1],
      [
        'rgba(255, 255, 255, 0.08)', // Glass (hidden)
        'rgba(255, 255, 255, 0.6)', // Mid-transition (whitening)
        colors.floodlightWhite, // White (found) - high contrast on pitch!
      ]
    );

    return { backgroundColor };
  });

  // Animated local flash (red for error, amber for wrong position)
  const animatedFlashStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      flashColorType.value,
      [0, 1],
      [colors.redCard, '#F59E0B'] // Red → Amber
    );
    return {
      opacity: localFlashOpacity.value,
      backgroundColor,
    };
  });

  // Determine border color based on state
  const getBorderColor = () => {
    if (isSelected) return colors.cardYellow;
    if (slot.isFound) return colors.pitchGreen;
    if (!slot.isHidden) return 'rgba(255, 255, 255, 0.2)';
    return 'rgba(255, 255, 255, 0.1)';
  };

  // Determine shadow color based on state
  const getShadowColor = () => {
    if (slot.isFound) return 'rgba(200, 200, 200, 0.8)'; // Light gray for white marker
    if (!slot.isHidden) return 'rgba(255, 255, 255, 0.05)';
    return 'rgba(0, 0, 0, 0.3)';
  };

  // Determine text color - dark on light backgrounds for readability
  const getTextColor = () => {
    if (slot.isFound) return colors.stadiumNavy;
    if (!slot.isHidden) return colors.stadiumNavy; // Pre-revealed also needs dark text
    return colors.textSecondary;
  };

  // Get top color for non-animated states
  const getTopColor = () => {
    if (isSelected && isHiddenAndUnfound) {
      return 'rgba(250, 204, 21, 0.25)'; // Yellow tint for selected hidden
    }
    if (slot.isFound) {
      return colors.floodlightWhite; // White for high contrast on pitch
    }
    if (!slot.isHidden) {
      return 'rgba(255, 255, 255, 0.85)'; // Solid cream for pre-revealed - readable with dark text
    }
    return 'rgba(255, 255, 255, 0.08)'; // Glass for hidden
  };

  // Shared style for both layers
  const layerStyle = {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: getBorderColor(),
  };

  // Pre-revealed players (not hidden) don't need flip animation
  const isPreRevealed = !slot.isHidden && !slot.isFound;

  return (
    <Animated.View
      ref={containerRef}
      style={[styles.outerContainer, animatedShakeBounceStyle]}
      collapsable={false}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!canPress && !isRevealed}
        style={[
          styles.container,
          {
            height: MARKER_SIZE + MARKER_DEPTH,
            paddingBottom: MARKER_DEPTH,
            opacity: isGameOver && isHiddenAndUnfound ? 0.6 : 1,
          },
        ]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={
          isHiddenAndUnfound
            ? isSelected
              ? `Position ${slot.positionKey}: Selected, tap to guess`
              : `Position ${slot.positionKey}: Hidden, tap to guess`
            : `Position ${slot.positionKey}: ${slot.displayName}`
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
              ...(isHiddenAndUnfound && {
                borderTopWidth: 2,
                borderTopColor: 'rgba(0, 0, 0, 0.2)',
              }),
            },
          ]}
        />

        {/* Top/Face Layer with 3D Flip */}
        <Animated.View style={[styles.layer, styles.topLayer, animatedPressStyle]}>
          {/* For hidden+unfound or pre-revealed: simple static display */}
          {(isHiddenAndUnfound || isPreRevealed) && (
            <View style={[layerStyle, { backgroundColor: getTopColor() }, styles.faceContent]}>
              {isHiddenAndUnfound ? (
                <Text style={styles.questionMark}>?</Text>
              ) : (
                <Text
                  style={[styles.playerName, { color: getTextColor() }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {slot.displayName}
                </Text>
              )}
            </View>
          )}

          {/* For found players (hidden that were guessed): animated flip */}
          {slot.isHidden && slot.isFound && (
            <>
              {/* Front face (question mark - hidden) */}
              <Animated.View
                style={[
                  layerStyle,
                  styles.faceContent,
                  styles.flipFace,
                  { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                  animatedFrontStyle,
                ]}
              >
                <Text style={styles.questionMark}>?</Text>
              </Animated.View>

              {/* Back face (surname - revealed) */}
              <Animated.View
                style={[
                  layerStyle,
                  styles.faceContent,
                  styles.flipFace,
                  animatedColorStyle,
                  animatedBackStyle,
                ]}
              >
                <Animated.Text
                  style={[
                    styles.playerName,
                    { color: colors.stadiumNavy },
                    animatedNameStyle,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {slot.displayName}
                </Animated.Text>
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* Local Error Flash Overlay */}
        <Animated.View
          style={[
            styles.errorFlash,
            { borderRadius: borderRadius.full },
            animatedFlashStyle,
          ]}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: MARKER_SIZE,
  },
  container: {
    width: MARKER_SIZE,
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
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
  faceContent: {
    alignItems: 'center',
    justifyContent: 'center',
    // No padding here - let text use full circle width
  },
  flipFace: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  questionMark: {
    fontFamily: fonts.headline,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  playerName: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 2, // Minimal padding - let text hit edges before wrapping
  },
  errorFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    // backgroundColor set dynamically via animatedFlashStyle
  },
});
