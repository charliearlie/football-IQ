/**
 * Game Intro Screen Component
 *
 * Full-screen intro overlay showing game rules and scoring.
 * Used for first-time onboarding and in-game help modal.
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { GameMode } from '../../types/puzzle.types';
import { getGameRules } from '../../constants/rules';
import { ElevatedButton } from '@/components';
import { useHaptics } from '@/hooks';
import { colors, spacing, fonts, layout } from '@/theme';
import { HeroSection } from './HeroSection';
import { RulesSection } from './RulesSection';

interface GameIntroScreenProps {
  /** Game mode to show intro for */
  gameMode: GameMode;
  /** Callback when user taps Start Game / Got It */
  onStart: () => void;
  /** Button text override (default: "Start Game") */
  buttonText?: string;
  /** Whether this is being shown in a modal (affects some styling) */
  isModal?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Full-screen intro overlay showing game rules and scoring
 */
export function GameIntroScreen({
  gameMode,
  onStart,
  buttonText = 'Start Game',
  isModal = false,
  testID,
}: GameIntroScreenProps) {
  const rules = getGameRules(gameMode);
  const { triggerSelection } = useHaptics();
  const hasStarted = useRef(false);

  // Scale pulse animation for CTA button
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Delayed start for scale pulse (after content animations settle)
    const timeout = setTimeout(() => {
      buttonScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        true // Reverse
      );
    }, 1000);

    return () => {
      clearTimeout(timeout);
      // Cancel animation on unmount
      buttonScale.value = 1;
    };
  }, [buttonScale]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleStart = () => {
    // Prevent double-tap
    if (hasStarted.current) return;
    hasStarted.current = true;

    triggerSelection();
    onStart();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.overlay, isModal && styles.modalOverlay]}
      testID={testID}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title */}
          <Animated.Text
            entering={FadeIn.delay(100).duration(300)}
            style={styles.title}
          >
            {rules.displayTitle}
          </Animated.Text>

          {/* Hero Icon */}
          <HeroSection rules={rules} testID={testID ? `${testID}-hero` : undefined} />

          {/* Rules */}
          <RulesSection rules={rules} testID={testID ? `${testID}-rules` : undefined} />

          {/* Spacer for button */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* CTA Button */}
        <View style={styles.ctaContainer}>
          <Animated.View style={buttonAnimatedStyle}>
            <ElevatedButton
              title={buttonText}
              onPress={handleStart}
              size="large"
              fullWidth
              testID={testID ? `${testID}-start-button` : undefined}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.stadiumNavy,
    zIndex: 100,
  },
  modalOverlay: {
    // In modal mode, don't use absoluteFill
    position: 'relative',
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 42,
    color: colors.floodlightWhite,
    textAlign: 'center',
    letterSpacing: 2,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xl,
  },
  ctaContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.stadiumNavy,
  },
});
