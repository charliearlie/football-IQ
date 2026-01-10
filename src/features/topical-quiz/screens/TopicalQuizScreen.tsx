import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStablePuzzle } from '@/features/puzzles';
import { useReviewMode } from '@/hooks';
import { colors, spacing, textStyles, layout, borderRadius, fonts } from '@/theme';
import { GameContainer, ReviewModeActionZone, ReviewModeBanner } from '@/components';
import { useTopicalQuizGame } from '../hooks/useTopicalQuizGame';
import { useQuizPrefetch } from '../context/QuizPrefetchContext';
import { QuizProgressBar } from '../components/QuizProgressBar';
import { QuizQuestionCard } from '../components/QuizQuestionCard';
import { QuizOptionButton } from '../components/QuizOptionButton';
import { TopicalQuizResultModal } from '../components/TopicalQuizResultModal';
import { AdBanner } from '@/features/ads';
import { OptionButtonState, TopicalQuizContent, QuizAnswer } from '../types/topicalQuiz.types';

/**
 * Metadata structure saved when a Topical Quiz game completes.
 */
interface TopicalQuizMetadata {
  answers: QuizAnswer[];
  correctCount: number;
}

/**
 * Props for TopicalQuizScreen.
 */
interface TopicalQuizScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's topical_quiz puzzle.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows all questions with user's answers and correct answers.
   */
  isReviewMode?: boolean;
}

/**
 * TopicalQuizScreen - The main Topical Quiz game screen.
 *
 * A 5-question multiple-choice quiz with optional images.
 * 2 points per correct answer, max 10 points.
 *
 * Supports review mode for viewing completed games.
 */
export function TopicalQuizScreen({
  puzzleId,
  isReviewMode = false,
}: TopicalQuizScreenProps) {
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'topical_quiz');
  // Images are prefetched in background - they'll load instantly from cache
  const { isPrefetched } = useQuizPrefetch();
  const {
    state,
    currentQuestion,
    isGameOver,
    answerQuestion,
    shareResult,
  } = useTopicalQuizGame(puzzle);

  // Fetch saved attempt data for review mode
  const {
    metadata: reviewMetadata,
    isLoading: isReviewLoading,
  } = useReviewMode<TopicalQuizMetadata>(puzzleId, isReviewMode);

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
      <GameContainer title="Quiz" keyboardAvoiding={false} testID="topical-quiz-screen">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
          <Text style={[textStyles.body, styles.loadingText]}>
            Loading quiz...
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Brief loading state if puzzle is loading but images are ready
  if (isLoading) {
    return (
      <GameContainer title="Quiz" keyboardAvoiding={false} testID="topical-quiz-screen">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
        </View>
      </GameContainer>
    );
  }

  // No puzzle available
  if (!puzzle || !currentQuestion) {
    return (
      <GameContainer title="Quiz" keyboardAvoiding={false} testID="topical-quiz-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Quiz Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Topical Quiz
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Review mode: Show all questions with answers revealed
  if (isReviewMode) {
    // Still loading attempt data
    if (isReviewLoading) {
      return (
        <GameContainer title="Quiz - Review" keyboardAvoiding={false} testID="topical-quiz-review">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={[textStyles.body, styles.loadingText]}>
              Loading review...
            </Text>
          </View>
        </GameContainer>
      );
    }

    const content = puzzle.content as TopicalQuizContent;
    const questions = content.questions ?? [];

    return (
      <GameContainer title="Quiz - Review" keyboardAvoiding={false} testID="topical-quiz-review">
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          {/* Score summary */}
          <View style={styles.reviewScoreSummary}>
            <Text style={styles.reviewScoreValue}>
              {reviewMetadata?.correctCount ?? 0}/5
            </Text>
            <Text style={styles.reviewScoreLabel}>
              {(reviewMetadata?.correctCount ?? 0) * 2} points
            </Text>
          </View>

          {/* All questions with answers */}
          {questions.map((question, qIndex) => {
            const userAnswer = reviewMetadata?.answers?.find(
              (a) => a.questionIndex === qIndex
            );
            return (
              <View key={qIndex} style={styles.reviewQuestionCard}>
                <Text style={styles.reviewQuestionNumber}>Q{qIndex + 1}</Text>
                <Text style={styles.reviewQuestionText}>{question.question}</Text>

                <View style={styles.reviewOptionsContainer}>
                  {question.options.map((option, oIndex) => {
                    const isCorrect = oIndex === question.correctIndex;
                    const isUserChoice = userAnswer?.selectedIndex === oIndex;
                    const isUserCorrect = isUserChoice && isCorrect;
                    const isUserWrong = isUserChoice && !isCorrect;

                    return (
                      <View
                        key={oIndex}
                        style={[
                          styles.reviewOption,
                          isCorrect && styles.reviewOptionCorrect,
                          isUserWrong && styles.reviewOptionWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reviewOptionText,
                            isCorrect && styles.reviewOptionTextCorrect,
                            isUserWrong && styles.reviewOptionTextWrong,
                          ]}
                        >
                          {option}
                        </Text>
                        {isUserChoice && (
                          <Text style={styles.reviewUserIndicator}>
                            {isUserCorrect ? '✓ Your answer' : '✗ Your answer'}
                          </Text>
                        )}
                        {isCorrect && !isUserChoice && (
                          <Text style={styles.reviewCorrectIndicator}>
                            ✓ Correct
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Close Review button */}
        <ReviewModeActionZone
          onClose={() => router.back()}
          testID="review-action-zone"
        />
      </GameContainer>
    );
  }

  // Progress bar for header
  const progressBar = (
    <QuizProgressBar
      currentIndex={state.currentQuestionIndex}
      answers={state.answers}
      testID="quiz-progress"
    />
  );

  return (
    <GameContainer
      title="Quiz"
      headerRight={progressBar}
      keyboardAvoiding={false}
      testID="topical-quiz-screen"
    >
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
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Review mode styles
  reviewContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  reviewScoreSummary: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reviewScoreValue: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.floodlightWhite,
    letterSpacing: 2,
  },
  reviewScoreLabel: {
    ...textStyles.body,
    color: colors.cardYellow,
    marginTop: spacing.xs,
  },
  reviewQuestionCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reviewQuestionNumber: {
    ...textStyles.caption,
    color: colors.pitchGreen,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reviewQuestionText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    marginBottom: spacing.md,
  },
  reviewOptionsContainer: {
    gap: spacing.sm,
  },
  reviewOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reviewOptionCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: colors.pitchGreen,
  },
  reviewOptionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.redCard,
  },
  reviewOptionText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  reviewOptionTextCorrect: {
    color: colors.pitchGreen,
  },
  reviewOptionTextWrong: {
    color: colors.redCard,
  },
  reviewUserIndicator: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reviewCorrectIndicator: {
    ...textStyles.caption,
    color: colors.pitchGreen,
    marginTop: spacing.xs,
  },
});
