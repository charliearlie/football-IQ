import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStablePuzzle } from '@/features/puzzles';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { useReviewMode } from '@/hooks';
import { colors, spacing, textStyles, layout } from '@/theme';
import {
  GameContainer,
  ReviewAnswerSection,
  ReviewGuessesSection,
  ReviewModeActionZone,
  ReviewModeBanner,
} from '@/components';
import { useCareerPathGame } from '../hooks/useCareerPathGame';
import { CareerStepCard } from '../components/CareerStepCard';
import { ActionZone } from '../components/ActionZone';
import { GameResultModal } from '../components/GameResultModal';
import { CareerStep } from '../types/careerPath.types';
import { AdBanner } from '@/features/ads';

/**
 * Metadata structure saved when a Career Path game completes.
 */
interface CareerPathMetadata {
  guesses: string[];
  revealedCount: number;
  won: boolean;
  totalSteps: number;
}

/**
 * Props for CareerPathScreen.
 */
interface CareerPathScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's puzzle for the specified gameMode.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows all answers and the user's previous guesses.
   */
  isReviewMode?: boolean;
  /**
   * Game mode variant. Defaults to 'career_path'.
   * Use 'career_path_pro' for premium Career Path Pro mode.
   */
  gameMode?: 'career_path' | 'career_path_pro';
}

/**
 * Get the screen title based on game mode and review state.
 */
function getScreenTitle(gameMode: 'career_path' | 'career_path_pro', isReviewMode: boolean): string {
  const baseTitle = gameMode === 'career_path_pro' ? 'Career Path Pro' : 'Career Path';
  return isReviewMode ? `${baseTitle} - Review` : baseTitle;
}

/**
 * CareerPathScreen - The main Career Path game screen.
 *
 * Displays a player's career as a series of sequential clues.
 * Players guess the footballer, with each wrong guess revealing
 * the next career step as a penalty.
 *
 * Supports review mode for viewing completed games.
 */
export function CareerPathScreen({
  puzzleId,
  isReviewMode = false,
  gameMode = 'career_path',
}: CareerPathScreenProps) {
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? gameMode);

  // Get dynamic title based on game mode
  const screenTitle = getScreenTitle(gameMode, false);
  const reviewTitle = getScreenTitle(gameMode, true);
  const {
    state,
    careerSteps,
    answer,
    totalSteps,
    revealNext,
    submitGuess,
    setCurrentGuess,
    shareResult,
    flatListRef,
  } = useCareerPathGame(puzzle);

  // Fetch saved attempt data for review mode
  const {
    metadata: reviewMetadata,
    isLoading: isReviewLoading,
  } = useReviewMode<CareerPathMetadata>(puzzleId, isReviewMode);

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title={screenTitle} testID="career-path-screen">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
          <Text style={[textStyles.body, styles.loadingText]}>
            Loading puzzle...
          </Text>
        </View>
      </GameContainer>
    );
  }

  // No puzzle available
  if (!puzzle || careerSteps.length === 0) {
    return (
      <GameContainer title={screenTitle} testID="career-path-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Review mode: Show all steps revealed with answer and guesses
  if (isReviewMode) {
    // Still loading attempt data
    if (isReviewLoading) {
      return (
        <GameContainer title={reviewTitle} testID="career-path-review">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={[textStyles.body, styles.loadingText]}>
              Loading review...
            </Text>
          </View>
        </GameContainer>
      );
    }

    // Calculate winning/missed step indices for review highlighting
    // If won, the winning step is the one where they made the correct guess (revealedCount - 1, 0-indexed)
    // If lost, the missed step is the final step (last in the array)
    const winningStepIndex = reviewMetadata?.won
      ? (reviewMetadata.revealedCount - 1)
      : null;
    const missedStepIndex = reviewMetadata && !reviewMetadata.won
      ? (careerSteps.length - 1)
      : null;

    return (
      <GameContainer
        title={reviewTitle}
        testID="career-path-review"
      >
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          {/* All career steps revealed with winning/missed highlighting */}
          {careerSteps.map((step, index) => (
            <CareerStepCard
              key={index}
              step={step}
              stepNumber={index + 1}
              isRevealed={true}
              isLatest={false}
              isWinningStep={index === winningStepIndex}
              isMissedStep={index === missedStepIndex}
              testID={`review-step-${index + 1}`}
            />
          ))}

          {/* Answer section */}
          <ReviewAnswerSection
            answer={answer}
            won={reviewMetadata?.won ?? false}
            testID="review-answer-section"
          />

          {/* User's incorrect guesses */}
          {reviewMetadata?.guesses && reviewMetadata.guesses.length > 0 && (
            <ReviewGuessesSection
              guesses={reviewMetadata.guesses}
              testID="review-guesses-section"
            />
          )}
        </ScrollView>

        {/* Close Review button */}
        <ReviewModeActionZone
          onClose={() => router.back()}
          testID="review-action-zone"
        />
      </GameContainer>
    );
  }

  const isGameOver = state.gameStatus !== 'playing';
  const canRevealMore =
    state.revealedCount < totalSteps && state.gameStatus === 'playing';

  const renderStep = ({ item, index }: { item: CareerStep; index: number }) => {
    const stepNumber = index + 1;
    const isRevealed = stepNumber <= state.revealedCount;
    const isLatest = stepNumber === state.revealedCount && state.gameStatus === 'playing';

    return (
      <CareerStepCard
        step={item}
        stepNumber={stepNumber}
        isRevealed={isRevealed}
        isLatest={isLatest}
        testID={`step-${stepNumber}`}
      />
    );
  };

  // Progress indicator for header
  const progressIndicator = (
    <Text style={[textStyles.body, styles.progress]}>
      Step{' '}
      <Text style={styles.progressHighlight}>{state.revealedCount}</Text>
      {' '}of{' '}
      <Text style={styles.progressHighlight}>{totalSteps}</Text>
    </Text>
  );

  return (
    <GameContainer
      title={screenTitle}
      headerRight={progressIndicator}
      testID="career-path-screen"
    >
      {/* Career Steps List */}
      <FlatList
        ref={flatListRef}
        data={careerSteps}
        renderItem={renderStep}
        keyExtractor={(_, index) => `step-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={5}
        keyboardDismissMode="on-drag"
        testID="career-steps-list"
      />

      {/* Game Result Modal */}
      {state.score && (
        <GameResultModal
          visible={isGameOver}
          won={state.gameStatus === 'won'}
          score={state.score}
          correctAnswer={answer}
          totalSteps={totalSteps}
          puzzleId={puzzle?.id ?? ''}
          onShare={shareResult}
          onClose={() => router.back()}
          testID="game-result-modal"
        />
      )}

      {/* Action Zone */}
      <ActionZone
        currentGuess={state.currentGuess}
        onGuessChange={setCurrentGuess}
        onSubmit={submitGuess}
        onRevealNext={revealNext}
        canRevealMore={canRevealMore}
        shouldShake={state.lastGuessIncorrect}
        isGameOver={isGameOver}
        testID="action-zone"
      />

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="career-path-ad-banner" />
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
  progress: {
    color: colors.textSecondary,
  },
  progressHighlight: {
    color: colors.pitchGreen,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    gap: layout.listGap,
  },
  reviewContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: layout.listGap,
  },
});
