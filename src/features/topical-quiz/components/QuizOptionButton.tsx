import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, textStyles, spacing } from '@/theme';
import { OptionButtonState } from '../types/topicalQuiz.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuizOptionButtonProps {
  /** Option label text */
  label: string;
  /** Option index (0-3) for A/B/C/D prefix */
  index: number;
  /** Called when option is pressed */
  onPress: () => void;
  /** Visual state of the button */
  state: OptionButtonState;
  /** Test ID for testing */
  testID?: string;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

/**
 * Quiz option button with feedback colors.
 *
 * States:
 * - default: Glass background, pressable
 * - correct: Pitch Green (user picked correct)
 * - incorrect: Red (user picked wrong)
 * - reveal: Pitch Green faded (show correct when user wrong)
 * - disabled: Gray (during feedback, not pressable)
 */
export function QuizOptionButton({
  label,
  index,
  onPress,
  state,
  testID,
}: QuizOptionButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = state !== 'default';
  const optionLetter = OPTION_LABELS[index] ?? 'X';

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    // Background color based on state
    let backgroundColor: string;
    let borderColor: string;
    let opacity = 1;

    switch (state) {
      case 'correct':
        backgroundColor = colors.pitchGreen;
        borderColor = colors.grassShadow;
        break;
      case 'incorrect':
        backgroundColor = colors.redCard;
        borderColor = '#B91C1C'; // Darker red
        break;
      case 'reveal':
        backgroundColor = colors.pitchGreen;
        borderColor = colors.grassShadow;
        opacity = 0.7;
        break;
      case 'disabled':
        backgroundColor = 'rgba(255, 255, 255, 0.05)';
        borderColor = 'rgba(255, 255, 255, 0.1)';
        opacity = 0.5;
        break;
      default: // 'default'
        backgroundColor = 'rgba(255, 255, 255, 0.1)';
        borderColor = 'rgba(255, 255, 255, 0.2)';
    }

    return {
      backgroundColor: withTiming(backgroundColor, { duration: 200 }),
      borderColor: withTiming(borderColor, { duration: 200 }),
      opacity: withTiming(opacity, { duration: 200 }),
      transform: [{ scale: scale.value }],
    };
  }, [state]);

  const textColor =
    state === 'correct' || state === 'incorrect' || state === 'reveal'
      ? colors.stadiumNavy
      : colors.floodlightWhite;

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Option ${optionLetter}: ${label}`}
      accessibilityState={{ disabled: isDisabled }}
    >
      <Text style={[styles.letterPrefix, { color: textColor }]}>
        {optionLetter}.
      </Text>
      <Text style={[styles.label, { color: textColor }]} numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    minHeight: 56,
  },
  letterPrefix: {
    ...textStyles.subtitle,
    marginRight: spacing.sm,
    width: 24,
  },
  label: {
    ...textStyles.body,
    flex: 1,
  },
});
