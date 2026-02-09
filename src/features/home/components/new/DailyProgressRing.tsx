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
}

export function DailyProgressRing({ percent, countString, isComplete }: DailyProgressRingProps) {
  const size = 140; // From HTML spec
  const strokeWidth = 14; 
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
          stroke="#1E293B" 
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
        <Text style={styles.label}>DAILY GOAL</Text>
        <Text style={styles.count}>{countString}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: HOME_FONTS.body,
    fontWeight: '600',
    fontSize: 11,
    color: 'rgba(248, 250, 252, 0.7)',
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  count: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 42,
    color: '#fff', // Fixed: White color for visibility
    lineHeight: 46,
  },
});
