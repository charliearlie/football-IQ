import { useCallback } from 'react';
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
import { colors, spacing, textStyles, layout } from '@/theme';
import {
  GameContainer,
  ReviewAnswerSection,
  ReviewGuessesSection,
  ReviewModeActionZone,
  ReviewModeBanner,
} from '@/components';
import { useTransferGuessGame } from '../hooks/useTransferGuessGame';
import { TransferCard } from '../components/TransferCard';
import { HintsSection } from '../components/HintsSection';
import { TransferActionZone } from '../components/TransferActionZone';
import { TransferResultModal } from '../components/TransferResultModal';
import { AdBanner } from '@/features/ads';

/**
 * Metadata structure saved when a Transfer Guess game completes.
 */
interface TransferGuessMetadata {
  guesses: string[];
  hintsRevealed: number;
  won: boolean;
}

/**
 * Props for TransferGuessScreen.
 */
interface TransferGuessScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's guess_the_transfer puzzle.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows all answers and the user's previous guesses.
   */
  isReviewMode?: boolean;
}

/**
 * TransferGuessScreen - The main Guess the Transfer game screen.
 *
 * Displays transfer details (clubs, year, fee) and allows players
 * to guess the footballer. Players can reveal hints for point penalties.
 *
 * Supports review mode for viewing completed games.
 */
export function TransferGuessScreen({
  puzzleId,
  isReviewMode = false,
}: TransferGuessScreenProps) {
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'guess_the_transfer');
  const {
    state,
    transferContent,
    answer,
    hints,
    canRevealHint,
    guessesRemaining,
    isGameOver,
    revealHint,
    submitGuess,
    giveUp,
    setCurrentGuess,
    shareResult,
  } = useTransferGuessGame(puzzle);

  // Fetch saved attempt data for review mode
  const {
    metadata: reviewMetadata,
    isLoading: isReviewLoading,
  } = useReviewMode<TransferGuessMetadata>(puzzleId, isReviewMode);

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
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
  if (!puzzle || !transferContent) {
    return (
      <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Transfer challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Review mode: Show all hints revealed with answer and guesses
  if (isReviewMode) {
    // Still loading attempt data
    if (isReviewLoading) {
      return (
        <GameContainer title="Transfer - Review" testID="transfer-guess-review">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={[textStyles.body, styles.loadingText]}>
              Loading review...
            </Text>
          </View>
        </GameContainer>
      );
    }

    return (
      <GameContainer title="Transfer - Review" testID="transfer-guess-review">
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          {/* Transfer Card */}
          <TransferCard
            fromClub={transferContent.from_club}
            toClub={transferContent.to_club}
            year={transferContent.year}
            fee={transferContent.fee}
            testID="review-transfer-card"
          />

          {/* Answer section - above hints for immediate visibility */}
          <ReviewAnswerSection
            answer={answer}
            won={reviewMetadata?.won ?? false}
            testID="review-answer-section"
          />

          {/* Show hints as they were revealed during gameplay */}
          <HintsSection
            hints={hints as [string, string, string]}
            hintsRevealed={reviewMetadata?.hintsRevealed ?? 0}
            isReviewMode={true}
            testID="review-hints-section"
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

  return (
    <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Transfer Card */}
        <TransferCard
          fromClub={transferContent.from_club}
          toClub={transferContent.to_club}
          year={transferContent.year}
          fee={transferContent.fee}
          testID="transfer-card"
        />

        {/* Hints Section */}
        <HintsSection
          hints={hints as [string, string, string]}
          hintsRevealed={state.hintsRevealed}
          testID="hints-section"
        />

        {/* Spacer for action zone */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Game Result Modal */}
      {state.score && (
        <TransferResultModal
          visible={isGameOver}
          won={state.gameStatus === 'won'}
          score={state.score}
          correctAnswer={answer}
          puzzleId={puzzle?.id ?? ''}
          onShare={shareResult}
          onClose={() => router.back()}
          testID="transfer-result-modal"
        />
      )}

      {/* Action Zone */}
      <TransferActionZone
        currentGuess={state.currentGuess}
        onGuessChange={setCurrentGuess}
        onSubmit={submitGuess}
        onRevealHint={revealHint}
        onGiveUp={giveUp}
        canRevealHint={canRevealHint}
        guessesRemaining={guessesRemaining}
        shouldShake={state.lastGuessIncorrect}
        isGameOver={isGameOver}
        incorrectGuesses={state.guesses.length}
        testID="action-zone"
      />

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="transfer-guess-ad-banner" />
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
    paddingBottom: spacing.lg,
  },
  reviewContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
