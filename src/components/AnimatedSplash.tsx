import React, { useEffect, useRef } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/theme';

interface AnimatedSplashProps {
  onComplete: () => void;
  ready: boolean;
  fontsReady?: boolean;
}

const MIN_DISPLAY_MS = 800;

/**
 * AnimatedSplash - Custom animated splash screen overlay.
 *
 * The native splash shows the icon on stadiumNavy, so this component
 * starts with the icon already visible and only animates "FOOTBALL IQ"
 * text sliding up. It then holds until `ready` is true before fading out.
 *
 * Timeline: text in (0-600ms) → hold → ready signal → fade out (300ms)
 */
export function AnimatedSplash({ onComplete, ready, fontsReady = true }: AnimatedSplashProps) {
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);
  const mountTime = useRef(Date.now());
  const fadeStarted = useRef(false);

  // Phase 1: Text animates in once fonts are loaded
  useEffect(() => {
    if (!fontsReady) return;
    textOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    textTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [fontsReady]);

  // Phase 2: Fade out once ready (with minimum display time)
  useEffect(() => {
    if (!ready || fadeStarted.current) return;
    fadeStarted.current = true;

    const elapsed = Date.now() - mountTime.current;
    const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(
        0,
        { duration: 300, easing: Easing.in(Easing.cubic) },
        () => { runOnJS(onComplete)(); }
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [ready]);

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.iconContainer}>
        <Image
          source={require('../../assets/images/footballiq-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Animated.Text style={[styles.title, textAnimatedStyle, fontsReady && styles.titleFont]}>
        FOOTBALL IQ
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  title: {
    fontSize: 48,
    color: colors.floodlightWhite,
    letterSpacing: 4,
  },
  titleFont: {
    fontFamily: 'BebasNeue-Regular',
  },
});
