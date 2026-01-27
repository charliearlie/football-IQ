import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import {
  useStablePuzzle,
  useOnboarding,
  GameIntroScreen,
  GameIntroModal,
} from "@/features/puzzles";
import { useReviewMode } from "@/hooks";
import { colors, spacing, textStyles, layout } from "@/theme";
import {
  GameContainer,
  ReviewAnswerSection,
  ReviewGuessesSection,
  ReviewModeActionZone,
  ReviewModeBanner,
} from "@/components";
import { useTransferGuessGame } from "../hooks/useTransferGuessGame";
import { MarketMovementHeader } from "../components/MarketMovementHeader";
import { DossierGrid } from "../components/DossierGrid";
import { TransferGameOverZone } from "../components/TransferGameOverZone";
import { TransferActionZone } from "../components/TransferActionZone";
import { TransferResultModal } from "../components/TransferResultModal";
import { AdBanner } from "@/features/ads";

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
  const isFocused = useIsFocused();

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding("guess_the_transfer");
  const [showHelpModal, setShowHelpModal] = useState(false);

  // State for controlling the result modal visibility (must be before early returns)
  const [showResultModal, setShowResultModal] = useState(false);

  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(
    puzzleId ?? "guess_the_transfer",
  );
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
  } = useTransferGuessGame(puzzle, isFocused);

  // Fetch saved attempt data for review mode
  const { metadata: reviewMetadata, isLoading: isReviewLoading } =
    useReviewMode<TransferGuessMetadata>(puzzleId, isReviewMode);

  // Debounce loading state to prevent flicker from async hydration timing
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (isOnboardingReady && !isLoading) {
      // Small delay to debounce rapid state changes during hydration
      const timer = setTimeout(() => setInitialLoadComplete(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingReady, isLoading]);

  // Show loading until initial load is stable
  if (!initialLoadComplete) {
    return (
      <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
        </View>
      </GameContainer>
    );
  }

  // First-time user intro screen (only check after both are ready)
  if (shouldShowIntro) {
    return (
      <GameIntroScreen
        gameMode="guess_the_transfer"
        onStart={completeIntro}
        testID="transfer-guess-intro"
      />
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

          {/* Market Movement Header */}
          <MarketMovementHeader
            fromClub={transferContent.from_club}
            toClub={transferContent.to_club}
            fee={transferContent.fee}
            testID="review-market-header"
          />

          {/* Answer section - above hints for immediate visibility */}
          <ReviewAnswerSection
            answer={answer}
            won={reviewMetadata?.won ?? false}
            testID="review-answer-section"
          />

          {/* Show hints as they were revealed during gameplay */}
          <DossierGrid
            hints={hints as [string, string, string]}
            hintsRevealed={reviewMetadata?.hintsRevealed ?? 0}
            isReviewMode={true}
            testID="review-dossier-grid"
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

  // Handler to show the score breakdown modal
  const handleSeeScore = () => {
    setShowResultModal(true);
  };

  return (
    <GameContainer
      title="Guess the Transfer"
      onHelpPress={() => setShowHelpModal(true)}
      testID="transfer-guess-screen"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {/* Market Movement Header (always visible) */}
          <MarketMovementHeader
            fromClub={transferContent.from_club}
            toClub={transferContent.to_club}
            fee={transferContent.fee}
            testID="market-header"
          />

          {/* Intel Dossier Grid OR Game Over Zone */}
          {isGameOver ? (
            <TransferGameOverZone
              answer={answer}
              won={state.gameStatus === "won"}
              onShare={shareResult}
              onSeeScore={handleSeeScore}
              testID="game-over-zone"
            />
          ) : (
            <DossierGrid
              hints={hints as [string, string, string]}
              hintsRevealed={state.hintsRevealed}
              testID="dossier-grid"
            />
          )}

          {/* Spacer for action zone */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Game Result Modal (shown on demand after game over) */}
      {state.score && (
        <TransferResultModal
          visible={showResultModal}
          won={state.gameStatus === "won"}
          score={state.score}
          correctAnswer={answer}
          puzzleId={puzzle?.id ?? ""}
          puzzleDate={puzzle?.puzzle_date ?? ""}
          onShare={shareResult}
          onClose={() => router.back()}
          testID="transfer-result-modal"
        />
      )}

      {/* Action Zone (hidden when game is over) */}
      {!isGameOver && (
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
      )}

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="transfer-guess-ad-banner" />

      {/* Help Modal */}
      <GameIntroModal
        gameMode="guess_the_transfer"
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        testID="transfer-guess-help-modal"
      />
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: layout.screenPadding,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  noPuzzleText: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
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
