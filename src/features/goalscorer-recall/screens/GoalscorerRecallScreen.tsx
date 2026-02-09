/**
 * GoalscorerRecallScreen - Main screen for Goalscorer Recall game mode.
 *
 * Displays a classic match and challenges players to name all goalscorers
 * within 60 seconds.
 *
 * Supports review mode for viewing completed games.
 */

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
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
  ReviewModeActionZone,
  ReviewModeBanner,
} from "@/components";
import { useGoalscorerRecallGame } from "../hooks/useGoalscorerRecallGame";
import { MatchHeader } from "../components/MatchHeader";
import { CompactMatchHeader } from "../components/CompactMatchHeader";
import { Scoreboard } from "../components/Scoreboard";
import { TimerDisplay } from "../components/TimerDisplay";
import { RecallActionZone } from "../components/RecallActionZone";
import { GoalFlash } from "../components/GoalFlash";
import { RecallResultModal } from "../components/RecallResultModal";
import { RecallComparisonView } from "../components/RecallComparisonView";
import { AdBanner } from "@/features/ads";
import type { GoalscorerRecallContent } from "../types/goalscorerRecall.types";

/**
 * Metadata structure saved when a Goalscorer Recall game completes.
 */
interface GoalscorerRecallMetadata {
  scorersFound: number;
  totalScorers: number;
  won: boolean;
  foundScorerNames: string[];
}

/**
 * Props for GoalscorerRecallScreen.
 */
interface GoalscorerRecallScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's guess_the_goalscorers puzzle.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows all scorers and highlights which ones the user found.
   */
  isReviewMode?: boolean;
}

/** Approximate height of the MatchHeader GlassCard */
const MATCH_HEADER_HEIGHT = 140;

export function GoalscorerRecallScreen({
  puzzleId,
  isReviewMode = false,
}: GoalscorerRecallScreenProps) {
  const router = useRouter();

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding("guess_the_goalscorers");

  const [showHelpModal, setShowHelpModal] = useState(false);

  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(
    puzzleId ?? "guess_the_goalscorers",
  );

  const {
    state,
    timeRemaining,
    totalScorers,
    foundScorersCount,
    homeGoals,
    awayGoals,
    startGame,
    submitGuess,
    setCurrentGuess,
    giveUp,
    resetGame,
  } = useGoalscorerRecallGame(puzzle);

  // Auto-start game for returning users (skip intro)
  // MUST be at top level before any conditional returns
  useEffect(() => {
    if (
      !isReviewMode &&
      !!puzzle &&
      !shouldShowIntro &&
      state.gameStatus === "idle" &&
      isOnboardingReady
    ) {
      startGame();
    }
  }, [isReviewMode, puzzle, shouldShowIntro, state.gameStatus, isOnboardingReady, startGame]);
  const [lastFoundGoalId, setLastFoundGoalId] = useState<string | undefined>();
  const scrollRef = useRef<ScrollView>(null);

  // Fetch saved attempt data for review mode
  const { metadata: reviewMetadata, isLoading: isReviewLoading } =
    useReviewMode<GoalscorerRecallMetadata>(puzzleId, isReviewMode);

  // Keyboard visibility for collapsible match header animation
  const keyboardVisible = useSharedValue(0);

  // Listen for keyboard show/hide events (for match header animation)
  useEffect(() => {
    // Use 'Will' events on iOS for smoother animation, 'Did' on Android
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardVisible.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardVisible.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardVisible]);

  // Animated style for full match header (fades out when keyboard opens)
  const matchHeaderAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      keyboardVisible.value,
      [0, 1],
      [MATCH_HEADER_HEIGHT, 0],
    ),
    opacity: interpolate(keyboardVisible.value, [0, 0.5], [1, 0]),
    overflow: "hidden" as const,
    marginBottom: interpolate(keyboardVisible.value, [0, 1], [spacing.sm, 0]),
  }));

  // Animated style for compact match header (fades in when keyboard opens)
  const compactHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(keyboardVisible.value, [0.5, 1], [0, 1]),
    height: interpolate(keyboardVisible.value, [0, 0.5, 1], [0, 0, 44]),
    overflow: "hidden" as const,
    marginBottom: interpolate(keyboardVisible.value, [0, 1], [0, spacing.sm]),
  }));

  // Animated style to shrink timer when keyboard opens
  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(keyboardVisible.value, [0, 1], [1, 0.7]) },
    ],
    marginVertical: interpolate(
      keyboardVisible.value,
      [0, 1],
      [0, -spacing.md],
    ),
  }));



  // Track when a new goal is found for animation
  const handleGuessCorrect = () => {
    // Find the most recently found goal
    const justFound = state.goals.find(
      (g) => g.found && g.id !== lastFoundGoalId,
    );
    if (justFound) {
      setLastFoundGoalId(justFound.id);
    }
  };

  // Auto-scroll when a correct guess is made
  useEffect(() => {
    if (state.lastGuessCorrect) {
      // Small delay to allow the UI to update first
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.lastGuessCorrect]);

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer
        title="Goalscorer Recall"
        collapsible
        keyboardAvoiding={false}
        testID="goalscorer-recall-screen"
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
        </View>
      </GameContainer>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer
        title="Goalscorer Recall"
        collapsible
        keyboardAvoiding={false}
        testID="goalscorer-recall-screen"
      >
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
  if (!puzzle) {
    return (
      <GameContainer
        title="Goalscorer Recall"
        collapsible
        keyboardAvoiding={false}
        testID="goalscorer-recall-screen"
      >
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Goalscorer Recall challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  const content = puzzle.content as GoalscorerRecallContent;

  // First-time user intro screen (show while game is idle, after puzzle loads)
  if (shouldShowIntro && state.gameStatus === "idle") {
    return (
      <GameIntroScreen
        gameMode="guess_the_goalscorers"
        onStart={async () => {
          await completeIntro();
          startGame();
        }}
        testID="goalscorer-recall-intro"
      />
    );
  }



  // Review mode: Show all scorers with found/missed status
  if (isReviewMode) {
    // Still loading attempt data
    if (isReviewLoading) {
      return (
        <GameContainer
          title="Recall - Review"
          collapsible={false}
          keyboardAvoiding={false}
          testID="goalscorer-recall-review"
        >
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={[textStyles.body, styles.loadingText]}>
              Loading review...
            </Text>
          </View>
        </GameContainer>
      );
    }

    const allGoals = content.goals ?? [];

    return (
      <GameContainer
        title="Recall - Review"
        collapsible={false}
        keyboardAvoiding={false}
        testID="goalscorer-recall-review"
      >
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Review Mode Banner */}
          <ReviewModeBanner testID="review-banner" />

          {/* Match Header */}
          <MatchHeader
            homeTeam={content.home_team}
            awayTeam={content.away_team}
            homeScore={content.home_score}
            awayScore={content.away_score}
            competition={content.competition}
            matchDate={content.match_date}
          />

          {/* Stats summary */}
          <View style={styles.reviewStats}>
            <Text style={styles.reviewStatsText}>
              You found{" "}
              <Text style={styles.reviewStatsHighlight}>
                {reviewMetadata?.scorersFound ?? 0}
              </Text>
              {" of "}
              <Text style={styles.reviewStatsHighlight}>
                {reviewMetadata?.totalScorers ?? allGoals.length}
              </Text>
              {" scorers"}
            </Text>
            {reviewMetadata?.won && (
              <Text style={styles.reviewWinText}>Complete!</Text>
            )}
          </View>

          {/* Found vs Missed comparison view */}
          <RecallComparisonView
            goals={allGoals}
            foundScorerNames={reviewMetadata?.foundScorerNames ?? []}
            testID="recall-comparison"
          />
        </ScrollView>

        {/* Close Review button */}
        <ReviewModeActionZone
          onClose={() => router.back()}
          testID="review-action-zone"
        />
      </GameContainer>
    );
  }
  const isPlaying = state.gameStatus === "playing";
  const isGameOver = state.gameStatus === "won" || state.gameStatus === "lost";

  const matchInfo = {
    homeTeam: content.home_team,
    awayTeam: content.away_team,
    homeScore: content.home_score,
    awayScore: content.away_score,
    competition: content.competition,
    matchDate: content.match_date,
  };

  return (
    <GameContainer
      title="Goalscorer Recall"
      collapsible
      keyboardAvoiding
      onHelpPress={() => setShowHelpModal(true)}
      testID="goalscorer-recall-screen"
    >
      {/* Full Match Header - Fades out when keyboard is visible */}
      <Animated.View
        style={[styles.matchHeaderContainer, matchHeaderAnimatedStyle]}
      >
        <MatchHeader
          homeTeam={content.home_team}
          awayTeam={content.away_team}
          homeScore={content.home_score}
          awayScore={content.away_score}
          competition={content.competition}
          matchDate={content.match_date}
        />
      </Animated.View>

      {/* Compact Match Header - Fades in when keyboard is visible */}
      <Animated.View
        style={[styles.compactHeaderContainer, compactHeaderAnimatedStyle]}
      >
        <CompactMatchHeader
          homeTeam={content.home_team}
          awayTeam={content.away_team}
          homeScore={content.home_score}
          awayScore={content.away_score}
        />
      </Animated.View>

      {/* Timer - shrinks when keyboard is visible */}
      <Animated.View style={timerAnimatedStyle}>
        <TimerDisplay timeRemaining={timeRemaining} isRunning={isPlaying} />
      </Animated.View>

      {/* Progress indicator */}
      <Text style={styles.progressText}>
        <Text style={styles.progressHighlight}>{foundScorersCount}</Text>
        {" / "}
        <Text style={styles.progressHighlight}>{totalScorers}</Text>
        {" scorers found"}
      </Text>

      {/* Scoreboard */}
      <View style={styles.scoreboardContainer}>
        <Scoreboard
          homeTeam={content.home_team}
          awayTeam={content.away_team}
          homeGoals={homeGoals}
          awayGoals={awayGoals}
          lastFoundGoalId={lastFoundGoalId}
          scrollRef={scrollRef}
        />
      </View>

      {/* Action Zone - hide when game is over */}
      {!isGameOver && (
        <RecallActionZone
          currentGuess={state.currentGuess}
          onGuessChange={setCurrentGuess}
          onSubmit={submitGuess}
          onGiveUp={giveUp}
          isPlaying={isPlaying}
          showError={state.lastGuessIncorrect}
        />
      )}

      {/* Goal Flash */}
      <GoalFlash visible={state.lastGuessCorrect} />

      {/* Result Modal - shows immediately when game ends */}
      <RecallResultModal
        visible={isGameOver}
        score={state.score}
        goals={state.goals}
        matchInfo={matchInfo}
        puzzleDate={puzzle.puzzle_date}
        puzzleId={puzzle.id}
        onContinue={() => router.back()}
      />

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="goalscorer-recall-ad-banner" />

      {/* Help Modal */}
      <GameIntroModal
        gameMode="guess_the_goalscorers"
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        testID="goalscorer-recall-help-modal"
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
  progressText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  progressHighlight: {
    color: colors.pitchGreen,
    fontWeight: "600",
  },
  matchHeaderContainer: {
    paddingHorizontal: layout.screenPadding,
    // marginBottom is animated based on keyboard visibility
  },
  compactHeaderContainer: {
    paddingHorizontal: layout.screenPadding,
    // height and marginBottom are animated based on keyboard visibility
  },
  scoreboardContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  // Review mode styles
  reviewContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  reviewStats: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  reviewStatsText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  reviewStatsHighlight: {
    color: colors.pitchGreen,
    fontWeight: "600",
  },
  reviewWinText: {
    ...textStyles.body,
    color: colors.pitchGreen,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  reviewScorersContainer: {
    backgroundColor: colors.glassBackground,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reviewSectionTitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reviewScorerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  reviewScorerRowOwnGoal: {
    backgroundColor: "rgba(156, 163, 175, 0.1)",
  },
  reviewScorerRowFound: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  reviewScorerRowMissed: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  reviewScorerMinute: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    width: 36,
  },
  reviewScorerName: {
    ...textStyles.body,
    flex: 1,
  },
  reviewScorerNameOwnGoal: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  reviewScorerNameFound: {
    color: colors.pitchGreen,
  },
  reviewScorerNameMissed: {
    color: colors.redCard,
  },
  reviewScorerTeam: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  reviewScorerStatus: {
    fontSize: 16,
    fontWeight: "600",
    width: 20,
    textAlign: "center",
  },
  reviewStatusFound: {
    color: colors.pitchGreen,
  },
  reviewStatusMissed: {
    color: colors.redCard,
  },
});
