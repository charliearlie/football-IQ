import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/theme';
import { getTimelineConfig } from '../constants/timeline';

const config = getTimelineConfig();

export interface TimelineAxisProps {
  /** Total number of steps in the career path */
  totalSteps: number;
  /** Number of currently revealed steps (1-indexed) */
  revealedCount: number;
  /** Whether victory reveal animation is in progress */
  isVictoryRevealing?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TimelineAxis - Continuous vertical line behind the career path nodes.
 *
 * Renders a single unbroken navy line spanning all steps, with an animated
 * green progress line that grows as steps are revealed.
 *
 * Must be positioned absolutely behind the FlatList/ScrollView content.
 */
export function TimelineAxis({
  totalSteps,
  revealedCount,
  isVictoryRevealing = false,
  testID,
}: TimelineAxisProps) {
  // Calculate total height: (stepHeight * totalSteps) + (gap * (totalSteps - 1))
  // Note: gap is handled by FlatList contentContainerStyle, so we account for it
  const stepGap = 4; // xs spacing from CareerPathScreen styles
  const totalHeight = (config.stepHeight * totalSteps) + (stepGap * Math.max(0, totalSteps - 1));

  // Track if victory reveal has ever happened (to keep line at bottom after win)
  const hasCompletedVictoryReveal = useRef(false);

  // Progress line height - grows from first node center to current revealed node center
  const progressHeight = useSharedValue(config.stepHeight / 2); // Start at first node center

  // Mark victory as complete when victory reveal starts
  useEffect(() => {
    if (isVictoryRevealing) {
      hasCompletedVictoryReveal.current = true;
    }
  }, [isVictoryRevealing]);

  useEffect(() => {
    // Calculate target height: from first node center to revealed node center
    // Each step is stepHeight + stepGap apart (except last)
    const stepsToReveal = Math.max(1, revealedCount);
    const targetHeight = ((stepsToReveal - 1) * (config.stepHeight + stepGap)) + (config.stepHeight / 2);

    // Keep at bottom if victory reveal is active OR has completed
    const shouldShowFullPath = isVictoryRevealing || hasCompletedVictoryReveal.current;
    const finalTarget = shouldShowFullPath
      ? totalHeight - (config.stepHeight / 2)
      : targetHeight;

    progressHeight.value = withSpring(finalTarget, {
      damping: 15,
      stiffness: 120,
    });
  }, [revealedCount, isVictoryRevealing, totalHeight, progressHeight]);

  const progressStyle = useAnimatedStyle(() => ({
    height: progressHeight.value,
  }));

  // Position the axis in the center of the axisContainer width
  const axisLeft = (config.axisWidth - config.lineWidth) / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: config.axisWidth,
          height: totalHeight,
          left: 0,
        },
      ]}
      testID={testID}
      pointerEvents="none"
    >
      {/* Base line - full height, Stadium Navy */}
      <View
        style={[
          styles.baseLine,
          {
            left: axisLeft,
            width: config.lineWidth,
            height: totalHeight,
          },
        ]}
      />

      {/* Progress line - animated height, Pitch Green */}
      <Animated.View
        style={[
          styles.progressLine,
          {
            left: axisLeft,
            width: config.lineWidth,
            top: config.stepHeight / 2, // Start from first node center
          },
          progressStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  baseLine: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.stadiumNavy,
    borderRadius: 1,
  },
  progressLine: {
    position: 'absolute',
    backgroundColor: colors.pitchGreen,
    borderRadius: 1,
  },
});
