import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { borderRadius, colors, fonts } from '@/theme';

export interface LockedCardProps {
  stepNumber: number;
  testID?: string;
}

export function LockedCard({ testID }: LockedCardProps) {
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <View style={styles.container} testID={testID}>
      <Animated.View style={[styles.content, shimmerStyle]}>
        <HelpCircle size={20} color="rgba(255, 255, 255, 0.3)" strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
