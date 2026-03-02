import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { HOME_FONTS, HOME_COLORS } from '@/theme/home-design';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DailyProgressRingProps {
  percent: number; // 0 to 100
  countString: string; // e.g., "2/4"
  isComplete: boolean;
  size?: number; // default 140
}

export function DailyProgressRing({ percent, countString, isComplete, size = 140 }: DailyProgressRingProps) {
  const strokeWidth = Math.round(size * 14 / 140);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percent / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [percent]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={HOME_COLORS.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        {percent > 0 && (
            <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={HOME_COLORS.pitchGreen}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            animatedProps={animatedProps}
            />
        )}
      </Svg>
      
      <View style={styles.centerContent}>
        <Text style={[styles.label, size < 140 && { fontSize: Math.round(11 * size / 140) }]}>DAILY GOAL</Text>
        <Text style={[styles.count, size < 140 && { fontSize: Math.round(42 * size / 140), lineHeight: Math.round(46 * size / 140) }]}>{countString}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: HOME_COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  count: {
    fontFamily: HOME_FONTS.stats,
    fontSize: 42,
    color: HOME_COLORS.textMain,
    lineHeight: 46,
  },
});
