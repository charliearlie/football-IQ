/**
 * LineupPitch Component
 *
 * Main pitch container that renders the background, pitch markings,
 * and all 11 player markers positioned according to their coordinates.
 *
 * Features:
 * - Percentage-based positioning for responsive layout
 * - Progress glow effect that intensifies as players are found
 * - Feedback coordination for marker animations
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { PitchBackground } from './PitchBackground';
import { PlayerMarker } from './PlayerMarker';
import type {
  PlayerSlotState,
  SlotIndex,
  FormationName,
  GuessResult,
} from '../types/startingXI.types';

// Determine platform at module level (not in worklet)
const IS_IOS = Platform.OS === 'ios';

export interface LineupPitchProps {
  /** Array of 11 player slots */
  slots: PlayerSlotState[];
  /** Currently selected slot index (or null) */
  selectedSlot: SlotIndex | null;
  /** Callback when a slot is pressed */
  onSlotPress: (index: SlotIndex) => void;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Team name */
  team: string;
  /** Formation label */
  formation: FormationName;
  /** Match headline */
  matchName: string;
  /** Competition name */
  competition: string;
  /** Match date */
  matchDate?: string;
  /** Number of hidden players found (for progress glow) */
  foundCount?: number;
  /** Total hidden players (for progress calculation) */
  totalHidden?: number;
  /** Result of the last guess for targeted marker animations */
  lastGuessResult?: GuessResult;
  /** Slot index of the last guessed marker */
  lastGuessedId?: SlotIndex | null;
  /** Callback when a marker reveal animation completes (for particle burst) */
  onMarkerReveal?: (position: { x: number; y: number }) => void;
  /** Optional test ID prefix */
  testID?: string;
}

// Marker size for positioning offset calculation
const MARKER_SIZE = 72; // Large circles for readable names

// Progress glow spring configuration (slow, smooth)
const GLOW_SPRING = {
  damping: 20,
  stiffness: 100,
  mass: 1.0,
};

/**
 * LineupPitch - Football pitch with positioned player markers.
 *
 * The pitch uses an aspect ratio of 0.65 (portrait orientation).
 * Markers are positioned using percentage-based coordinates (0-100 scale).
 *
 * Progress glow intensifies as more players are found.
 */
export function LineupPitch({
  slots,
  selectedSlot,
  onSlotPress,
  isGameOver,
  team,
  formation,
  matchName,
  competition,
  matchDate,
  foundCount = 0,
  totalHidden = 1,
  lastGuessResult,
  lastGuessedId,
  onMarkerReveal,
  testID,
}: LineupPitchProps) {
  const [pitchSize, setPitchSize] = useState({ width: 0, height: 0 });

  // Progress ratio for glow effect (0 to 1)
  const progressRatio = totalHidden > 0 ? foundCount / totalHidden : 0;

  // Animated glow intensity
  const glowIntensity = useSharedValue(progressRatio);

  // Update glow when progress changes
  useEffect(() => {
    glowIntensity.value = withSpring(progressRatio, GLOW_SPRING);
  }, [progressRatio, glowIntensity]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPitchSize({ width, height });
  }, []);

  // Animated glow style for the pitch border (iOS uses shadows, Android uses border)
  const animatedGlowStyle = useAnimatedStyle(() => {
    if (IS_IOS) {
      const shadowOpacity = interpolate(glowIntensity.value, [0, 0.5, 1], [0, 0.3, 0.6]);
      const shadowRadius = interpolate(glowIntensity.value, [0, 1], [0, 20]);
      return {
        shadowColor: colors.pitchGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity,
        shadowRadius,
      };
    } else {
      // Android approximation with border (since shadow glow doesn't work well)
      const borderWidth = interpolate(glowIntensity.value, [0, 1], [0, 3]);
      const borderOpacity = interpolate(glowIntensity.value, [0, 1], [0, 0.8]);
      return {
        borderWidth,
        borderColor: `rgba(88, 204, 2, ${borderOpacity})`,
      };
    }
  });

  // Extract year from date if available
  const year = matchDate?.slice(0, 4);

  return (
    <View style={styles.container} testID={testID}>
      {/* Match Info Header */}
      <View style={styles.matchInfo}>
        <Text style={styles.matchName} numberOfLines={1}>
          {matchName}
        </Text>
        <Text style={styles.competition} numberOfLines={1}>
          {competition}
          {year ? ` (${year})` : ''}
        </Text>
        <View style={styles.teamBadge}>
          <Text style={styles.teamText}>
            {team} ({formation})
          </Text>
        </View>
      </View>

      {/* Pitch Container with Progress Glow */}
      <View style={styles.pitchContainer} onLayout={handleLayout}>
        <Animated.View style={[styles.glowWrapper, animatedGlowStyle]}>
          {/* Pitch Background (green) */}
          <View style={styles.pitch}>
            {/* Pitch Markings (SVG) */}
            {pitchSize.width > 0 && (
              <PitchBackground
                width={pitchSize.width}
                height={pitchSize.height}
              />
            )}

            {/* Player Markers */}
            {pitchSize.width > 0 &&
              slots.map((slot, index) => {
                // Convert percentage coords to pixel position
                const left = (slot.coords.x / 100) * pitchSize.width;
                const top = (slot.coords.y / 100) * pitchSize.height;

                return (
                  <View
                    key={`${slot.positionKey}-${index}`}
                    style={[
                      styles.markerWrapper,
                      {
                        left: left - MARKER_SIZE / 2,
                        top: top - MARKER_SIZE / 2,
                      },
                    ]}
                  >
                    <PlayerMarker
                      slot={slot}
                      index={index as SlotIndex}
                      isSelected={selectedSlot === index}
                      isGameOver={isGameOver}
                      onPress={onSlotPress}
                      lastGuessResult={lastGuessResult}
                      lastGuessedId={lastGuessedId}
                      onRevealComplete={onMarkerReveal}
                      testID={`${testID}-marker-${index}`}
                    />
                  </View>
                );
              })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  matchInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  matchName: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  competition: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  teamBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  teamText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.floodlightWhite,
  },
  pitchContainer: {
    width: '100%',
    aspectRatio: 0.8, // Wider = shorter height for tall phones
    paddingHorizontal: spacing.sm,
  },
  glowWrapper: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  pitch: {
    flex: 1,
    backgroundColor: colors.pitchGreen,
    borderRadius: borderRadius.lg,
    overflow: 'visible', // Allow markers to extend beyond pitch bounds
    position: 'relative',
  },
  markerWrapper: {
    position: 'absolute',
    zIndex: 1,
  },
});
