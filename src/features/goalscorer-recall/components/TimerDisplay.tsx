/**
 * Timer Display component for Goalscorer Recall.
 *
 * Shows a countdown timer that:
 * - Displays seconds remaining prominently
 * - Changes from green to red at warning threshold (10s)
 * - Animates color transition smoothly
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme';
import { TIMER_WARNING_THRESHOLD } from '../types/goalscorerRecall.types';

interface TimerDisplayProps {
  timeRemaining: number;
  isRunning: boolean;
}

export function TimerDisplay({ timeRemaining, isRunning }: TimerDisplayProps) {
  const isWarning = timeRemaining <= TIMER_WARNING_THRESHOLD;

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      timeRemaining,
      [0, TIMER_WARNING_THRESHOLD, TIMER_WARNING_THRESHOLD + 1],
      [colors.redCard, colors.redCard, colors.pitchGreen]
    );

    return {
      backgroundColor: withTiming(backgroundColor, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }),
    };
  }, [timeRemaining]);

  const textAnimatedStyle = useAnimatedStyle(() => {
    const scale = isWarning && isRunning ? 1.1 : 1;
    return {
      transform: [
        {
          scale: withTiming(scale, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
          }),
        },
      ],
    };
  }, [isWarning, isRunning]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.timerCircle, animatedStyle]}>
        <Animated.Text style={[styles.timerText, textAnimatedStyle]}>
          {timeRemaining}
        </Animated.Text>
        <Text style={styles.secondsLabel}>seconds</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 48,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },
  secondsLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.floodlightWhite,
    opacity: 0.8,
    textTransform: 'uppercase',
    marginTop: -4,
  },
});
