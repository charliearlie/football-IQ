import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePuzzle } from '@/features/puzzles';
import { colors, spacing, textStyles, layout } from '@/theme';
import { useTopicalQuizGame } from '../hooks/useTopicalQuizGame';
import { useQuizPrefetch } from '../context/QuizPrefetchContext';
import { QuizProgressBar } from '../components/QuizProgressBar';
import { QuizQuestionCard } from '../components/QuizQuestionCard';
import { QuizOptionButton } from '../components/QuizOptionButton';
import { TopicalQuizResultModal } from '../components/TopicalQuizResultModal';
import { AdBanner } from '@/features/ads';
import { OptionButtonState } from '../types/topicalQuiz.types';

/**
 * Props for TopicalQuizScreen.
 */
interface TopicalQuizScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's topical_quiz puzzle.
   */
  puzzleId?: string;
}

/**
 * TopicalQuizScreen - The main Topical Quiz game screen.
 *
 * A 5-question multiple-choice quiz with optional images.
 * 2 points per correct answer, max 10 points.
 */
export function TopicalQuizScreen({ puzzleId }: TopicalQuizScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  const { puzzle, isLoading } = usePuzzle(puzzleId ?? 'topical_quiz');
  // Images are prefetched in background - they'll load instantly from cache
  const { isPrefetched } = useQuizPrefetch();
  const {
    state,
    currentQuestion,
    isGameOver,
    answerQuestion,
    shareResult,
  } = useTopicalQuizGame(puzzle);

  // Get option button states based on current state
  const optionStates = useMemo<OptionButtonState[]>(() => {
    if (!currentQuestion) return ['default', 'default', 'default', 'default'];

    const currentAnswer = state.answers.find(
      (a) => a.questionIndex === state.currentQuestionIndex
    );

    // If we haven't answered this question yet
    if (!currentAnswer) {
      return ['default', 'default', 'default', 'default'];
    }

    // During feedback phase
    return currentQuestion.options.map((_, index) => {
      if (index === currentAnswer.selectedIndex) {
        // User's selection
        return currentAnswer.isCorrect ? 'correct' : 'incorrect';
      }
      if (index === currentQuestion.correctIndex && !currentAnswer.isCorrect) {
        // Reveal correct answer if user was wrong
        return 'reveal';
      }
      return 'disabled';
    }) as OptionButtonState[];
  }, [currentQuestion, state.answers, state.currentQuestionIndex]);

  // Loading state - only show if puzzle is loading AND images aren't prefetched
  if (isLoading && !isPrefetched) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={[textStyles.body, styles.loadingText]}>
          Loading quiz...
        </Text>
      </View>
    );
  }

  // Brief loading state if puzzle is loading but images are ready
  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
      </View>
    );
  }

  // No puzzle available
  if (!puzzle || !currentQuestion) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={textStyles.h2}>No Quiz Today</Text>
        <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
          Check back later for today's Topical Quiz
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Quiz</Text>
        <QuizProgressBar
          currentIndex={state.currentQuestionIndex}
          answers={state.answers}
          testID="quiz-progress"
        />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card with Image */}
        <QuizQuestionCard
          question={currentQuestion.question}
          imageUrl={currentQuestion.imageUrl}
          questionNumber={state.currentQuestionIndex + 1}
          animationKey={`question-${state.currentQuestionIndex}`}
          testID="question-card"
        />

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <QuizOptionButton
              key={`option-${index}`}
              label={option}
              index={index}
              state={optionStates[index]}
              onPress={() => answerQuestion(index)}
              testID={`option-${index}`}
            />
          ))}
        </View>
      </ScrollView>

      {/* Game Result Modal */}
      {state.score && (
        <TopicalQuizResultModal
          visible={isGameOver}
          score={state.score}
          answers={state.answers}
          onShare={shareResult}
          onClose={() => router.back()}
          testID="quiz-result-modal"
        />
      )}

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="topical-quiz-ad-banner" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.stadiumNavy,
    gap: spacing.md,
    padding: layout.screenPadding,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  noPuzzleText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing['3xl'],
  },
  optionsContainer: {
    marginTop: spacing.xl,
  },
});
