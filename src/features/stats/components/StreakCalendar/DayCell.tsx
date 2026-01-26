/**
 * DayCell Component
 *
 * Individual day cell in the Streak Calendar with "Solid Layer" 3D architecture.
 * - Empty days: Appear "sunk" with Stadium Navy background
 * - 1-3 games: Pitch Green at 50% opacity
 * - 4+ games (Perfect Day): Pitch Green 100%
 * - Today: Special border highlight
 *
 * Uses two absolute-positioned layers for cross-platform consistency.
 */

import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, fonts, borderRadius, depthOffset } from '@/theme';
import { triggerSelection, triggerLight } from '@/lib/haptics';
import { CalendarDay, CellIntensity, CellPosition } from '../../types/calendar.types';

export interface DayCellProps {
  /** Day data (null for padding cells at start/end of month) */
  day: CalendarDay | null;
  /** Day number to display (1-31, or null for padding) */
  dayNumber: number | null;
  /** Cell size in pixels */
  size: number;
  /** Whether this cell is in a perfect week */
  isInPerfectWeek: boolean;
  /** Whether cell is today */
  isToday: boolean;
  /** Whether this date is in the future (not yet playable) */
  isFutureDate?: boolean;
  /** Whether this date is before the app launch (Jan 20, 2026) */
  isPreLaunchDate?: boolean;
  /** Callback when cell is pressed with position info */
  onPress: (day: CalendarDay, position: CellPosition) => void;
  /** Test ID for testing */
  testID?: string;
}

const DEPTH_EMPTY = depthOffset.sunk; // 1px - sunk effect
const DEPTH_FILLED = depthOffset.cell; // 3px - pop-up effect

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * Get cell intensity based on game count.
 */
function getCellIntensity(count: number): CellIntensity {
  if (count === 0) return 'empty';
  if (count <= 3) return 'low';
  return 'high'; // 4+ games (perfect day)
}

/**
 * DayCell - A single day in the calendar grid.
 *
 * States:
 * - Empty: Stadium Navy with sunk appearance (no completions)
 * - Low: Pitch Green at 50% opacity (1-3 completions)
 * - High: Pitch Green 100% (4+ completions / perfect day)
 * - Today: Bordered highlight
 */
export function DayCell({
  day,
  dayNumber,
  size,
  isInPerfectWeek,
  isToday,
  isFutureDate = false,
  isPreLaunchDate = false,
  onPress,
  testID,
}: DayCellProps) {
  const pressed = useSharedValue(0);
  const pulseAnim = useSharedValue(2);
  const viewRef = React.useRef<View>(null);

  // Check if today has incomplete games (for pulse animation)
  // Uses dynamic game count from day.gameModes (can be 3 to n games per day)
  const totalGamesForDay = day?.gameModes.length ?? 0;
  const isIncompleteToday = isToday && day !== null && totalGamesForDay > 0 && day.count < totalGamesForDay;

  // Calculate these values before hooks for use in useAnimatedStyle
  const hasCompletions = day && day.count > 0;
  const depth = hasCompletions ? DEPTH_FILLED : DEPTH_EMPTY;

  // Pulse animation for today's cell when incomplete
  useEffect(() => {
    if (isIncompleteToday) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 1000 }),
          withTiming(2, { duration: 1000 })
        ),
        -1, // infinite
        true // reverse
      );
    } else {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 2;
    }

    return () => {
      cancelAnimation(pulseAnim);
    };
  }, [isIncompleteToday, pulseAnim]);

  // IMPORTANT: All hooks must be called BEFORE any early returns
  // to satisfy React's rules of hooks
  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
    // Pulse border for incomplete today
    ...(isIncompleteToday && {
      borderWidth: pulseAnim.value,
      borderColor: colors.cardYellow,
    }),
  }));

  // Padding cell (no day number) - return AFTER all hooks are called
  if (dayNumber === null) {
    return <View style={[styles.container, { width: size, height: size }]} />;
  }

  const intensity = day ? getCellIntensity(day.count) : 'empty';

  // Disabled cells: future dates and pre-launch dates
  const isDisabled = isFutureDate || isPreLaunchDate;

  const handlePressIn = () => {
    // Don't animate press for disabled dates
    if (day && !isDisabled) {
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = () => {
    // Don't respond to presses for disabled dates
    if (day && !isDisabled) {
      triggerSelection();
      // Position not used by bottom sheet - pass dummy values
      onPress(day, { x: 0, y: 0, width: 0, height: 0 });
    }
    // No action for padding cells, future dates, or pre-launch dates
  };

  // Determine colors based on intensity and disabled state
  const getTopColor = () => {
    // Future dates and pre-launch dates get muted/disabled appearance
    if (isDisabled) {
      return '#0D1520'; // Very dark, muted appearance
    }
    switch (intensity) {
      case 'empty':
        return '#16212B'; // Stadium Navy darker
      case 'low':
        return 'rgba(88, 204, 2, 0.5)'; // Pitch Green 50%
      case 'high':
        return colors.pitchGreen; // Pitch Green 100%
    }
  };

  const getShadowColor = () => {
    // Future dates and pre-launch dates get muted shadow
    if (isDisabled) {
      return 'rgba(0, 0, 0, 0.15)';
    }
    switch (intensity) {
      case 'empty':
        return 'rgba(0, 0, 0, 0.3)';
      case 'low':
        return 'rgba(70, 163, 2, 0.5)'; // Grass shadow 50%
      case 'high':
        return colors.grassShadow;
    }
  };

  // Shared style for both layers
  const layerStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius.sm,
  };

  return (
    <Pressable
      ref={viewRef}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          width: size,
          height: size + depth,
          paddingBottom: depth,
        },
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={
        isPreLaunchDate
          ? `Day ${dayNumber}, before app launch`
          : isFutureDate
            ? `Day ${dayNumber}, not yet available`
            : day
              ? `${day.date}, ${day.count} games played, ${day.totalIQ} IQ earned`
              : `Day ${dayNumber}, no games played`
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
            ...(intensity === 'empty' && {
              borderTopWidth: 1,
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
            // Today highlight (static, only when complete - pulse handles incomplete)
            ...(isToday && !isIncompleteToday && {
              borderWidth: 2,
              borderColor: colors.cardYellow,
            }),
            // Empty cell inset border (skip if today is pulsing)
            ...(intensity === 'empty' &&
              !isIncompleteToday && {
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
              }),
          },
          animatedTopStyle,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            isDisabled && styles.dayNumberFuture,
            !isDisabled && intensity === 'empty' && styles.dayNumberEmpty,
            !isDisabled && intensity !== 'empty' && styles.dayNumberFilled,
          ]}
        >
          {dayNumber}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible', // Critical for Android - prevents layer clipping
  },
  layer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  dayNumber: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  dayNumberEmpty: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  dayNumberFilled: {
    color: colors.stadiumNavy,
  },
  dayNumberFuture: {
    color: 'rgba(255, 255, 255, 0.15)', // Very muted for disabled future dates
  },
});
