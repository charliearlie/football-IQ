/**
 * The Thread Game Screen
 *
 * Players guess a football club from a chronological list of kit sponsors or suppliers.
 * Some brands are hidden and can be revealed as hints (costs points).
 *
 * Scoring (hint-based): 10/6/4/2/0 based on hints revealed.
 */

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useHaptics } from "@/hooks/useHaptics";
import {
  useStablePuzzle,
  useOnboarding,
  GameIntroScreen,
} from "@/features/puzzles";
import { colors, spacing, textStyles } from "@/theme";
import { GameContainer, ConfirmationModal } from "@/components";
import { AdBanner } from "@/features/ads";
import { useTheThreadGame } from "../hooks/useTheThreadGame";
import { LaundryLine } from "../components/LaundryLine";
import { TheThreadActionZone } from "../components/TheThreadActionZone";
import { GuessHistoryRow } from "../components/GuessHistoryRow";
import { TheThreadResultModal } from "../components/TheThreadResultModal";
import { LAYOUT, TIMELINE_ANIMATIONS } from "../constants/timeline";

/**
 * Props for TheThreadScreen.
 */
interface TheThreadScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's The Thread puzzle.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows the answer and user's previous guesses.
   */
  isReviewMode?: boolean;
}

/**
 * TheThreadScreen - The main The Thread game screen.
 *
 * Displays a vertical timeline of kit sponsors/suppliers.
 * Players guess which club had these kit partners.
 */
export function TheThreadScreen({
  puzzleId,
  isReviewMode = false,
}: TheThreadScreenProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding("the_thread");

  // Use puzzleId if provided, otherwise fall back to game mode lookup
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? "the_thread");

  // Game hook
  const {
    state,
    threadContent,
    threadType,
    brands,
    kitLore,
    isGameOver,
    canShowKitLore,
    visibleBrands,
    canRevealHint,
    totalHiddenBrands,
    hintsRevealed,
    submitGuess,
    giveUp,
    revealHint,
    shareResult,
  } = useTheThreadGame(puzzle, isFocused);

  // Haptics for game end celebration
  const { triggerCompletion } = useHaptics();

  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  // Track keyboard visibility to hide ad banner when typing
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animation timing for reveal
  const totalAnimationTime = useMemo(() => {
    return brands.length * TIMELINE_ANIMATIONS.nodeStaggerDelay;
  }, [brands.length]);

  // Show modal after game ends
  useEffect(() => {
    if (!isGameOver || showResultModal) return;

    // On give-up, delay for the brand reveal animation.
    // On win, brands are already visible so show modal quickly.
    const delay = state.gameStatus === "revealed"
      ? totalAnimationTime + 500
      : 400;

    const timer = setTimeout(() => {
      setShowResultModal(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isGameOver, showResultModal, totalAnimationTime, state.gameStatus]);

  // Handlers
  const handleBackToHome = useCallback(() => {
    router.back();
  }, [router]);

  const handleGiveUpPress = useCallback(() => {
    setShowGiveUpModal(true);
  }, []);

  const handleGiveUpConfirm = useCallback(() => {
    setShowGiveUpModal(false);
    giveUp();
  }, [giveUp]);

  const handleGiveUpCancel = useCallback(() => {
    setShowGiveUpModal(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
    handleBackToHome();
  }, [handleBackToHome]);

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Threads" testID="the-thread-screen">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
        </View>
      </GameContainer>
    );
  }

  // First-time user intro screen
  if (shouldShowIntro) {
    return (
      <GameIntroScreen
        gameMode="the_thread"
        onStart={completeIntro}
        testID="the-thread-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Threads" testID="the-thread-screen">
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
  if (!puzzle || !threadContent || brands.length === 0) {
    return (
      <GameContainer title="Threads" testID="the-thread-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Filter incorrect guesses for history display
  const incorrectGuesses = state.guesses.filter(
    (guess) =>
      guess.id !== threadContent.correct_club_id &&
      guess.name.toLowerCase() !== threadContent.correct_club_name.toLowerCase()
  );

  return (
    <GameContainer title="The Thread" testID="the-thread-screen">
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Scrollable content area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* LaundryLine - Vertical timeline */}
          <LaundryLine
            brands={brands}
            threadType={threadType!}
            gameStatus={state.gameStatus}
            brandVisibility={visibleBrands.map((b) => b.visible)}
            testID="laundry-line"
          />
        </ScrollView>

        {/* Guess History (shown when there are incorrect guesses) */}
        {incorrectGuesses.length > 0 && !isGameOver && (
          <GuessHistoryRow guesses={incorrectGuesses} testID="guess-history" />
        )}

        {/* Action Zone (input area) */}
        <TheThreadActionZone
          onClubSelect={submitGuess}
          shouldShake={state.lastGuessIncorrect}
          isGameOver={isGameOver}
          onGiveUp={handleGiveUpPress}
          onRevealHint={revealHint}
          canRevealHint={canRevealHint}
          hintsRevealed={hintsRevealed}
          totalHiddenBrands={totalHiddenBrands}
          testID="action-zone"
        />

        {/* Ad Banner (hidden when keyboard visible or game over) */}
        {!keyboardVisible && !isGameOver && (
          <AdBanner testID="the-thread-ad-banner" />
        )}
      </KeyboardAvoidingView>

      {/* Result Modal */}
      {state.score && (
        <TheThreadResultModal
          visible={showResultModal}
          won={state.gameStatus === "won"}
          score={state.score}
          correctClubName={threadContent.correct_club_name}
          threadType={threadContent.thread_type}
          kitLore={canShowKitLore ? kitLore : null}
          puzzleId={puzzle.id}
          puzzleDate={puzzle.puzzle_date}
          onShare={shareResult}
          onClose={handleCloseModal}
          testID="result-modal"
        />
      )}

      {/* Give Up Confirmation Modal */}
      <ConfirmationModal
        visible={showGiveUpModal}
        title="Give Up?"
        message="Are you sure you want to give up? The answer will be revealed."
        confirmLabel="Give Up"
        cancelLabel="Keep Trying"
        onConfirm={handleGiveUpConfirm}
        onCancel={handleGiveUpCancel}
        variant="danger"
        testID="give-up-modal"
      />
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: LAYOUT.actionZoneHeight + spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  noPuzzleText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
