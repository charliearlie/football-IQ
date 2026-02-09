import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme';
import { QuizAnswer, TOTAL_QUESTIONS } from '../types/topicalQuiz.types';

interface QuizProgressBarProps {
  /** Current question index (0-4) */
  currentIndex: number;
  /** All answers recorded so far */
  answers: QuizAnswer[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * Progress bar showing 5 circles for quiz questions.
 *
 * - Gray: Pending question
 * - Green: Correct answer
 * - Red: Incorrect answer
 * - Current: Slightly larger with border
 */
export function QuizProgressBar({
  currentIndex,
  answers,
  testID,
}: QuizProgressBarProps) {
  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: TOTAL_QUESTIONS }).map((_, index) => (
        <ProgressDot
          key={index}
          index={index}
          currentIndex={currentIndex}
          answer={answers.find((a) => a.questionIndex === index)}
          testID={testID ? `${testID}-dot-${index}` : undefined}
        />
      ))}
    </View>
  );
}

interface ProgressDotProps {
  index: number;
  currentIndex: number;
  answer?: QuizAnswer;
  testID?: string;
}

function ProgressDot({ index, currentIndex, answer, testID }: ProgressDotProps) {
  const isCurrent = index === currentIndex;
  const isAnswered = answer !== undefined;

  const animatedStyle = useAnimatedStyle(() => {
    // Determine color based on state
    let backgroundColor: string;
    if (isAnswered) {
      backgroundColor = answer.isCorrect ? colors.pitchGreen : colors.redCard;
    } else {
      backgroundColor = colors.textSecondary;
    }

    return {
      backgroundColor: withSpring(backgroundColor, { damping: 15 }),
      transform: [{ scale: withSpring(isCurrent ? 1.2 : 1, { damping: 12 }) }],
      borderWidth: withSpring(isCurrent && !isAnswered ? 2 : 0),
    };
  }, [isCurrent, isAnswered, answer?.isCorrect]);

  return (
    <Animated.View
      style={[styles.dot, animatedStyle]}
      testID={testID}
      accessibilityLabel={`Question ${index + 1}${
        isAnswered ? (answer.isCorrect ? ', correct' : ', incorrect') : ''
      }${isCurrent ? ', current' : ''}`}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderColor: colors.floodlightWhite,
  },
});
