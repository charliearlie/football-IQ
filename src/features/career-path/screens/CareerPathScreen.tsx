import { useCallback, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
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
  GameIntroModal,
} from "@/features/puzzles";
import { useReviewMode } from "@/hooks";
import { colors, spacing, textStyles, layout } from "@/theme";
import {
  GameContainer,
  ConfirmationModal,
  ReviewAnswerSection,
  ReviewGuessesSection,
  ReviewModeActionZone,
  ReviewModeBanner,
} from "@/components";
import { useCareerPathGame } from "../hooks/useCareerPathGame";
import { TimelineStepRow } from "../components/TimelineStepRow";
import { ActionZone } from "../components/ActionZone";
import { GameOverActionZone } from "../components/GameOverActionZone";
import { GameResultModal } from "../components/GameResultModal";
import { ScoutingDisclaimer } from "../components/ScoutingDisclaimer";
import { ReportErrorSheet, ReportType } from "../components/ReportErrorSheet";
import { submitReport } from "../services/reportService";
import { CareerStep } from "../types/careerPath.types";
import { AdBanner } from "@/features/ads";
import { useOnboarding as useAuthOnboarding } from "@/features/auth";

/**
 * Content metadata structure embedded in puzzle content.
 */
interface ContentMetadata {
  scouted_at?: string;
  wikipedia_revision_id?: string;
  wikipedia_revision_date?: string;
  generated_by?: "manual" | "ai_oracle" | "ai_scout";
}

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
  gameMode?: "career_path" | "career_path_pro";
}

/**
 * Get the screen title based on game mode and review state.
 */
function getScreenTitle(
  gameMode: "career_path" | "career_path_pro",
  isReviewMode: boolean,
): string {
  const baseTitle =
    gameMode === "career_path_pro" ? "Career Path Pro" : "Career Path";
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
  gameMode = "career_path",
}: CareerPathScreenProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  // Auth onboarding for tutorial tracking
  const { completeTutorial } = useAuthOnboarding();

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding(gameMode);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
    allCluesRevealed,
    revealNext,
    submitPlayerGuess,
    submitTextGuess,
    giveUp,
    shareResult,
    flatListRef,
    isVictoryRevealing,
    completeVictoryReveal,
  } = useCareerPathGame(puzzle, isFocused);

  // Haptics for victory celebration
  const { triggerCompletion } = useHaptics();

  // Modal and view path state
  const [showResultModal, setShowResultModal] = useState(false);
  const [viewingFullPath, setViewingFullPath] = useState(false);

  // Report error sheet state
  const [showReportSheet, setShowReportSheet] = useState(false);

  // Give up confirmation modal state
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  // Track keyboard visibility to hide ad banner when typing
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Extract metadata from puzzle content for scouting provenance
  const scoutedAt = useMemo(() => {
    if (!puzzle?.content) return null;
    const content = puzzle.content as { _metadata?: ContentMetadata };
    return content._metadata?.scouted_at ?? null;
  }, [puzzle?.content]);

  // Animation constants
  const STAGGER_DELAY = 200; // ms between each card reveal
  const POST_REVEAL_DELAY = 1500; // ms before modal appears

  // Victory reveal orchestration
  useEffect(() => {
    if (!isVictoryRevealing) return;

    const hiddenSteps = careerSteps.length - state.revealedCount;
    const totalAnimationTime = hiddenSteps * STAGGER_DELAY;

    // After staggered animation completes, trigger haptics and complete reveal
    const completeTimer = setTimeout(() => {
      triggerCompletion();
      completeVictoryReveal();
    }, totalAnimationTime + 300); // Buffer for final animation

    // Delayed modal appearance
    const modalTimer = setTimeout(() => {
      setShowResultModal(true);
    }, totalAnimationTime + POST_REVEAL_DELAY);

    // Scroll to top to show full path
    const scrollTimer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, totalAnimationTime + 200);

    return () => {
      clearTimeout(completeTimer);
      clearTimeout(modalTimer);
      clearTimeout(scrollTimer);
    };
  }, [
    isVictoryRevealing,
    careerSteps.length,
    state.revealedCount,
    triggerCompletion,
    completeVictoryReveal,
    flatListRef,
  ]);

  // NOTE: No auto-show for losses. The GameOverActionZone displays the answer
  // and the user taps "See how you scored" to open the result modal.
  // Previously, an auto-show useEffect here caused a dual-Modal animation
  // conflict with the ConfirmationModal (give-up flow), leaving an invisible
  // Modal overlay that blocked all touch events (scroll + button presses).

  // Handlers for view path toggle
  const handleViewPath = useCallback(() => {
    setShowResultModal(false);
    setViewingFullPath(true);
  }, []);

  // Focus-snap: scroll to center latest revealed step when input focuses
  const handleInputFocus = useCallback(() => {
    if (flatListRef.current && state.revealedCount > 0) {
      flatListRef.current.scrollToIndex({
        index: state.revealedCount - 1, // Latest revealed (0-indexed)
        animated: true,
        viewPosition: 0.5, // Center in viewport
      });
    }
  }, [state.revealedCount]);

  // Give up handlers
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

  // Report error handlers
  const handleOpenReportSheet = useCallback(() => {
    setShowReportSheet(true);
  }, []);

  const handleCloseReportSheet = useCallback(() => {
    setShowReportSheet(false);
  }, []);

  const handleSubmitReport = useCallback(
    async (reportType: ReportType, comment?: string) => {
      if (!puzzle?.id) return;
      const result = await submitReport(puzzle.id, reportType, comment);
      if (!result.success) {
        console.error(
          "[CareerPathScreen] Report submission failed:",
          result.error,
        );
        throw new Error(result.error);
      }
    },
    [puzzle?.id],
  );

  // Fetch saved attempt data for review mode
  const { metadata: reviewMetadata, isLoading: isReviewLoading } =
    useReviewMode<CareerPathMetadata>(puzzleId, isReviewMode);

  // renderStep must be defined before early returns to maintain hooks order
  const renderStep = useCallback(
    ({ item, index }: { item: CareerStep; index: number }) => {
      const stepNumber = index + 1;
      // After winning, all steps should be revealed (prevents revert to locked state)
      const isRevealed =
        stepNumber <= state.revealedCount || state.gameStatus === "won";
      const isLatest =
        stepNumber === state.revealedCount &&
        state.gameStatus === "playing" &&
        !isVictoryRevealing;
      const isVictoryHiddenStep =
        isVictoryRevealing && stepNumber > state.revealedCount;

      return (
        <TimelineStepRow
          step={item}
          stepNumber={stepNumber}
          isRevealed={isRevealed}
          isLatest={isLatest}
          isFirstStep={index === 0}
          isLastStep={index === careerSteps.length - 1}
          // Victory reveal props
          forceReveal={isVictoryHiddenStep}
          revealDelay={(stepNumber - state.revealedCount - 1) * STAGGER_DELAY}
          isVictoryReveal={isVictoryHiddenStep}
          isWinningStep={
            state.gameStatus === "won" && stepNumber === state.revealedCount
          }
          shouldShake={state.lastGuessIncorrect && isLatest}
          testID={`step-${stepNumber}`}
        />
      );
    },
    [
      state.revealedCount,
      state.gameStatus,
      state.lastGuessIncorrect,
      isVictoryRevealing,
      careerSteps.length,
      STAGGER_DELAY,
    ],
  );

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer title={screenTitle} testID="career-path-screen">
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
        gameMode={gameMode}
        subtitle="Welcome to Football IQ! Here's your first challenge."
        onStart={() => {
          completeIntro();
          completeTutorial();
        }}
        testID="career-path-intro"
      />
    );
  }

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
      ? reviewMetadata.revealedCount - 1
      : null;
    const missedStepIndex =
      reviewMetadata && !reviewMetadata.won ? careerSteps.length - 1 : null;

    return (
      <GameContainer title={reviewTitle} testID="career-path-review">
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          {/* All career steps revealed with winning/missed highlighting */}
          {careerSteps.map((step, index) => (
            <TimelineStepRow
              key={index}
              step={step}
              stepNumber={index + 1}
              isRevealed={true}
              isLatest={false}
              isFirstStep={index === 0}
              isLastStep={index === careerSteps.length - 1}
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

  const isGameOver = state.gameStatus !== "playing";
  const canRevealMore =
    state.revealedCount < totalSteps && state.gameStatus === "playing";

  // Progress indicator for header (hidden when viewing full path)
  const progressIndicator = viewingFullPath ? (
    <Pressable onPress={() => router.back()} hitSlop={8}>
      <Text style={styles.backLink}>Home</Text>
    </Pressable>
  ) : (
    <Text style={[textStyles.body, styles.progress]}>
      Step <Text style={styles.progressHighlight}>{state.revealedCount}</Text>{" "}
      of <Text style={styles.progressHighlight}>{totalSteps}</Text>
    </Text>
  );

  // Modal visibility: show when game over AND showResultModal is true AND not viewing full path AND not during victory reveal
  const shouldShowModal =
    state.gameStatus !== "playing" &&
    showResultModal &&
    !viewingFullPath &&
    !isVictoryRevealing;

  // Dynamic title when viewing full path
  const displayTitle = viewingFullPath
    ? `${screenTitle} - Full Path`
    : screenTitle;

  return (
    <GameContainer
      title={displayTitle}
      headerRight={progressIndicator}
      onHelpPress={() => setShowHelpModal(true)}
      testID="career-path-screen"
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
{/* Timeline Container - holds axis line and career steps */}
        <View style={styles.timelineContainer}>
          {/* Continuous Timeline Axis - handled by individual TimelineStepRow components now */}

          {/* Career Steps List */}
          <FlatList
            ref={flatListRef}
            data={careerSteps}
            renderItem={renderStep}
            keyExtractor={(_, index: number) => `step-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            windowSize={5}
            keyboardDismissMode="on-drag"
            testID="career-steps-list"
            ListFooterComponent={
              <ScoutingDisclaimer
                scoutedAt={scoutedAt}
                onReportError={handleOpenReportSheet}
                testID="scouting-disclaimer"
              />
            }
          />
        </View>

        {/* Game Result Modal */}
        {state.score && (
          <GameResultModal
            visible={shouldShowModal}
            won={state.gameStatus === "won"}
            score={state.score}
            correctAnswer={answer}
            totalSteps={totalSteps}
            puzzleId={puzzle?.id ?? ""}
            puzzleDate={puzzle?.puzzle_date ?? ""}
            gameMode={gameMode}
            onShare={shareResult}
            onViewPath={state.gameStatus === "won" ? handleViewPath : undefined}
            onClose={() => router.back()}
            testID="game-result-modal"
          />
        )}

        {/* Bottom bar: Action Zone + Ad Banner */}
        {!viewingFullPath && (
          <View style={styles.bottomBar}>
            {isGameOver ? (
              <GameOverActionZone
                answer={answer}
                won={state.gameStatus === "won"}
                onSeeScore={() => setShowResultModal(true)}
                testID="game-over-zone"
              />
            ) : (
              <ActionZone
                onPlayerSelect={submitPlayerGuess}
                onTextSubmit={submitTextGuess}
                onRevealNext={revealNext}
                canRevealMore={canRevealMore}
                shouldShake={state.lastGuessIncorrect}
                isGameOver={isGameOver}
                onFocus={handleInputFocus}
                onGiveUp={handleGiveUpPress}
                allCluesRevealed={allCluesRevealed}
                testID="action-zone"
              />
            )}
            {!keyboardVisible && <AdBanner testID="career-path-ad-banner" />}
          </View>
        )}


        {/* Help Modal */}
        <GameIntroModal
          gameMode={gameMode}
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          testID="career-path-help-modal"
        />

        {/* Give Up Confirmation Modal */}
        <ConfirmationModal
          visible={showGiveUpModal}
          onConfirm={handleGiveUpConfirm}
          onCancel={handleGiveUpCancel}
          testID="give-up-modal"
        />

        {/* Report Error Sheet */}
        <ReportErrorSheet
          visible={showReportSheet}
          puzzleId={puzzle?.id ?? null}
          onDismiss={handleCloseReportSheet}
          onSubmit={handleSubmitReport}
          testID="report-error-sheet"
        />
      </KeyboardAvoidingView>
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  timelineContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: colors.stadiumNavy, // Ensure background is set
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: layout.screenPadding,
    backgroundColor: colors.stadiumNavy,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.floodlightWhite,
  },
  noPuzzleText: {
    textAlign: "center",
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  progress: {
    color: colors.textSecondary,
  },
  progressHighlight: {
    color: colors.pitchGreen,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 300, // ActionZone/GameOverActionZone + AdBanner + safe area + buffer
    gap: 0, // Remove gap, as rows handle their own spacing/connecting
  },
  reviewContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.xs, // Tight gap for timeline rows (no ActionZone in review)
  },
  backLink: {
    ...textStyles.bodySmall,
    color: colors.pitchGreen,
    fontWeight: "600",
  },
});
