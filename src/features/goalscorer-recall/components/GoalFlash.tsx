/**
 * Goal Flash component for Goalscorer Recall.
 *
 * Shows "GOAL!" celebration overlay when a correct guess is made.
 * Auto-dismisses after animation completes.
 */

import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fonts } from '@/theme';

interface GoalFlashProps {
  visible: boolean;
  onComplete?: () => void;
}

export function GoalFlash({ visible, onComplete }: GoalFlashProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (visible) {
      // Animate in
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 500 }), // Hold
        withTiming(0, { duration: 200 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 150 }),
        withTiming(1.2, { duration: 500 }), // Hold
        withTiming(0.8, { duration: 200 })
      );
    }
  }, [visible, opacity, scale, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Animated.Text style={styles.text}>GOAL!</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 204, 2, 0.2)',
    zIndex: 20,
  },
  text: {
    fontFamily: fonts.headline,
    fontSize: 72,
    color: colors.pitchGreen,
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
