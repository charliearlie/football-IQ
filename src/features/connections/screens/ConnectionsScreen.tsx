/**
 * ConnectionsScreen Component
 *
 * Main screen for the Connections game mode.
 * Players identify 4 groups of 4 related footballers from a 4x4 grid.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing } from "@/theme";
import { ElevatedButton } from "@/components";
import {
  usePuzzle,
  useOnboarding,
  GameIntroScreen,
  GameIntroModal,
} from "@/features/puzzles";
import { GameContainer } from "@/components/GameContainer";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ReviewModeBanner } from "@/components/ReviewMode/ReviewModeBanner";
import { ReviewModeActionZone } from "@/components/ReviewMode/ReviewModeActionZone";
import { useReviewMode } from "@/hooks/useReviewMode";
import { AdBanner } from "@/features/ads";
import { useConnectionsGame } from "../hooks/useConnectionsGame";
import { ConnectionsGrid } from "../components/ConnectionsGrid";
import { ConnectionsActionBar } from "../components/ConnectionsActionBar";
import { MistakeIndicator } from "../components/MistakeIndicator";
import { ConnectionsResultModal } from "../components/ConnectionsResultModal";
import {
  ConnectionsAttemptMetadata,
  ConnectionsGroup,
  parseConnectionsContent,
} from "../types/connections.types";

export interface ConnectionsScreenProps {
  /** Puzzle ID to play (optional - uses today's puzzle if not provided) */
  puzzleId?: string;
  /** Whether to show in read-only review mode */
  isReviewMode?: boolean;
}

/**
 * ConnectionsScreen - Main game screen for Connections.
 */
export function ConnectionsScreen({
  puzzleId: propPuzzleId,
  isReviewMode = false,
}: ConnectionsScreenProps) {
  const router = useRouter();

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding("connections");
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get puzzle - either by ID or today's puzzle
  const { puzzle, isLoading } = usePuzzle(propPuzzleId || "connections");

  // Review mode: fetch completed attempt data
  const { metadata: reviewMetadata, isLoading: isReviewLoading } =
    useReviewMode<ConnectionsAttemptMetadata>(propPuzzleId, isReviewMode);

  // Rebuild solved groups from review metadata
  const reviewSolvedGroups = useMemo<ConnectionsGroup[]>(() => {
    if (!isReviewMode || !reviewMetadata?.solvedGroups || !puzzle) return [];
    const content = parseConnectionsContent(puzzle.content);
    if (!content) return [];
    const groups: ConnectionsGroup[] = [];
    for (const category of reviewMetadata.solvedGroups) {
      const group = content.groups.find((g) => g.category === category);
      if (group) groups.push(group);
    }
    // If metadata didn't capture all groups (e.g. gave up), include remaining
    if (groups.length < 4) {
      for (const group of content.groups) {
        if (!groups.some((g) => g.category === group.category)) {
          groups.push(group);
        }
      }
    }
    return groups;
  }, [isReviewMode, reviewMetadata, puzzle]);

  // Game state
  const {
    state,
    content,
    togglePlayer,
    submitGuess,
    shufflePlayers,
    deselectAll,
    giveUp,
    shareResult,
  } = useConnectionsGame(puzzle);

  // Modal visibility state
  const [showResultModal, setShowResultModal] = useState(false);

  // Shake animation state
  const [shakingPlayers, setShakingPlayers] = useState<string[]>([]);

  // Give up confirmation modal
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  const handleGiveUpPress = () => {
    setShowGiveUpModal(true);
  };

  const handleGiveUpConfirm = () => {
    setShowGiveUpModal(false);
    giveUp();
  };

  const handleGiveUpCancel = () => {
    setShowGiveUpModal(false);
  };

  // Consolidate modal visibility logic
  useEffect(() => {
    if (state.gameStatus === "playing") {
      // Reset when playing
      setShowResultModal(false);
    } else {
      // For all other states (won, lost, gave_up), ensure closed initially
      // This prevents auto-opening and lets the user click the button
      setShowResultModal(false);
    }
  }, [state.gameStatus]);

  const handleSeeScore = useCallback(() => {
    setShowResultModal(true);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Trigger shake on incorrect guess
  useEffect(() => {
    if (
      state.lastGuessResult === "incorrect" ||
      state.lastGuessResult === "close"
    ) {
      // Shake the previously selected players
      if (state.guesses.length > 0) {
        const lastGuess = state.guesses[state.guesses.length - 1];
        if (!lastGuess.correct) {
          setShakingPlayers(lastGuess.players);
          // Clear shake after animation completes (500ms)
          const timeout = setTimeout(() => {
            setShakingPlayers([]);
          }, 500);
          return () => clearTimeout(timeout);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lastGuessResult, state.guesses.length]);

  // Handle share
  const handleShare = async () => {
    const result = await shareResult();
    if (result.success && result.method === "clipboard") {
      // Could show a toast here
    }
    return result;
  };

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Connections" testID="connections-screen">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
        </View>
      </GameContainer>
    );
  }

  // First-time user intro screen
  if (shouldShowIntro) {
    return (
      <GameIntroScreen
        gameMode="connections"
        onStart={completeIntro}
        testID="connections-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  // No puzzle available
  if (!puzzle || !content) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noPuzzleText}>No game available today</Text>
        <Text style={styles.noPuzzleSubtext}>Check back later!</Text>
      </View>
    );
  }

  // Review mode: show all groups revealed (read-only)
  if (isReviewMode) {
    if (isReviewLoading) {
      return (
        <GameContainer title="Connections - Review" testID="connections-review">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={styles.loadingText}>Loading review...</Text>
          </View>
        </GameContainer>
      );
    }

    return (
      <GameContainer title="Connections - Review" testID="connections-review">
        <LinearGradient
          colors={[colors.stadiumNavy, colors.surface, colors.stadiumNavy]}
          locations={[0, 0.3, 1]}
          style={styles.container}
        >
          <ReviewModeBanner testID="review-banner" />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.gridContainer}>
              <ConnectionsGrid
                solvedGroups={reviewSolvedGroups}
                remainingPlayers={[]}
                selectedPlayers={[]}
                onTogglePlayer={() => {}}
                disabled
                testID="connections-review-grid"
              />
            </View>
          </ScrollView>

          <ReviewModeActionZone
            onClose={handleClose}
            testID="review-action-zone"
          />
        </LinearGradient>
      </GameContainer>
    );
  }

  const isPlaying = state.gameStatus === "playing";
  const isGameOver =
    state.gameStatus === "won" ||
    state.gameStatus === "lost" ||
    state.gameStatus === "gave_up";

  return (
    <GameContainer
      title="Connections"
      onHelpPress={() => setShowHelpModal(true)}
      testID="connections-screen"
    >
      <LinearGradient
        colors={[colors.stadiumNavy, colors.surface, colors.stadiumNavy]}
        locations={[0, 0.3, 1]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status Bar */}
          {isPlaying && (
            <View style={styles.statusBar}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusLabelGreen}>OBJECTIVE</Text>
                <Text style={styles.statusValue}>Find groups of four</Text>
              </View>
              <View style={styles.statusRight}>
                <Text style={styles.statusLabel}>MISTAKES LEFT</Text>
                <MistakeIndicator
                  mistakes={state.mistakes}
                  testID="mistake-indicator"
                />
              </View>
            </View>
          )}

          {/* Main Grid */}
          <View style={styles.gridContainer}>
            <ConnectionsGrid
              solvedGroups={state.solvedGroups}
              remainingPlayers={state.remainingPlayers}
              selectedPlayers={state.selectedPlayers}
              shakingPlayers={shakingPlayers}
              onTogglePlayer={togglePlayer}
              disabled={!isPlaying}
              testID="connections-grid"
            />
          </View>

          {/* Feedback messages (only while playing) */}
          {isPlaying && state.lastGuessResult === "close" && (
            <Text style={styles.feedbackClose}>One away! Try again.</Text>
          )}
          {isPlaying && state.lastGuessResult === "incorrect" && (
            <Text style={styles.feedbackIncorrect}>
              Not quite. Keep trying!
            </Text>
          )}
        </ScrollView>

        {/* Action Bar (while playing) */}
        {isPlaying && (
          <ConnectionsActionBar
            canSubmit={state.selectedPlayers.length === 4}
            canDeselect={state.selectedPlayers.length > 0}
            onSubmit={submitGuess}
            onShuffle={shufflePlayers}
            onDeselect={deselectAll}
            onGiveUp={handleGiveUpPress}
            testID="connections-actions"
          />
        )}

        {/* Game Over Zone - Show button for all finished states */}
        {isGameOver && (
          <View style={styles.gameOverZone}>
            {state.gameStatus === "won" && (
              <Text style={styles.winText}>
                {state.mistakes === 0 ? "PERFECT!" : "GROUPS COMPLETED!"}
              </Text>
            )}
            <ElevatedButton
              title="See how you compare"
              onPress={handleSeeScore}
              fullWidth
              borderRadius={12}
              testID="connections-see-score"
            />
          </View>
        )}

        {/* Result Modal */}
        {state.score && (
          <ConnectionsResultModal
            visible={showResultModal}
            score={state.score}
            guesses={state.guesses}
            allGroups={content.groups}
            puzzleId={puzzle.id}
            puzzleDate={puzzle.puzzle_date}
            onClose={handleClose}
            onShare={handleShare}
            gaveUp={state.gameStatus === "gave_up"}
            showNextPuzzle={!isReviewMode && puzzle?.puzzle_date === new Date().toISOString().split('T')[0]}
            testID="result-modal"
          />
        )}

        {/* Ad Banner (non-premium users) */}
        <AdBanner testID="connections-ad-banner" />

        {/* Help Modal */}
        <GameIntroModal
          gameMode="connections"
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          testID="connections-help-modal"
        />

        {/* Give Up Confirmation Modal */}
        <ConfirmationModal
          visible={showGiveUpModal}
          title="Give Up?"
          message="Are you sure? All groups will be revealed."
          confirmLabel="Reveal Groups"
          cancelLabel="Back to Game"
          onConfirm={handleGiveUpConfirm}
          onCancel={handleGiveUpCancel}
          testID="connections-giveup-modal"
        />
      </LinearGradient>
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.stadiumNavy,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  noPuzzleText: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    textAlign: "center",
  },
  noPuzzleSubtext: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  statusLeft: {
    alignItems: "flex-start",
  },
  statusRight: {
    alignItems: "flex-end",
  },
  statusLabelGreen: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.pitchGreen,
    marginBottom: 4,
  },
  statusLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  statusValue: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: "500",
    color: colors.floodlightWhite,
  },
  gridContainer: {
    paddingHorizontal: spacing.lg,
  },
  feedbackClose: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.cardYellow,
    textAlign: "center",
    marginTop: spacing.md,
  },
  feedbackIncorrect: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
    textAlign: "center",
    marginTop: spacing.md,
  },
  gameOverZone: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing["2xl"] : spacing.lg,
    backgroundColor: colors.stadiumNavy,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  winText: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.pitchGreen,
    textAlign: "center",
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
});
