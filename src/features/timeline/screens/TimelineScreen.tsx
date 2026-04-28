/**
 * TimelineScreen Component
 *
 * Main screen for the Timeline game mode.
 * Players order 6 events chronologically from a footballer's career.
 *
 * Layout: GameContainer header → Subject bar → DraggableFlatList → ActionBar
 * No ScrollView wrapping — DraggableFlatList handles its own scroll.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import { AdBanner } from "@/features/ads";
import { useTimelineGame } from "../hooks/useTimelineGame";
import { TimelineList } from "../components/TimelineList";
import { TimelineActionBar } from "../components/TimelineActionBar";
import { TimelineResultModal } from "../components/TimelineResultModal";

export interface TimelineScreenProps {
  /** Puzzle ID to play (optional - uses today's puzzle if not provided) */
  puzzleId?: string;
}

/**
 * TimelineScreen - Main game screen for Timeline.
 */
export function TimelineScreen({
  puzzleId: propPuzzleId,
}: TimelineScreenProps) {
  const router = useRouter();

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding("timeline");
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get puzzle - either by ID or today's puzzle
  const { puzzle, isLoading } = usePuzzle(propPuzzleId || "timeline");

  // Game state
  const {
    state,
    content,
    reorderEvents,
    submitOrder,
    revealComplete,
    giveUp,
    shareResult,
    isLoading: isGameLoading,
  } = useTimelineGame(puzzle);

  // Modal visibility state
  const [showResultModal, setShowResultModal] = useState(false);

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

  // Simultaneous reveal — all cards flash for 800ms, then reset
  useEffect(() => {
    if (state.revealPhase === "revealing") {
      const timer = setTimeout(() => revealComplete(), 800);
      return () => clearTimeout(timer);
    }
  }, [state.revealPhase, revealComplete]);

  // Consolidate modal visibility logic
  useEffect(() => {
    setShowResultModal(false);
  }, [state.gameStatus]);

  const handleSeeScore = useCallback(() => {
    setShowResultModal(true);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

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
      <GameContainer title="Timeline" testID="timeline-screen">
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
        gameMode="timeline"
        onStart={completeIntro}
        testID="timeline-intro"
      />
    );
  }

  // Loading state
  if (isLoading || isGameLoading) {
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

  const isPlaying = state.gameStatus === "playing";
  const isGameOver =
    state.gameStatus === "won" ||
    state.gameStatus === "gave_up" ||
    state.gameStatus === "lost";

  return (
    <GameContainer
      title="Timeline"
      onHelpPress={() => setShowHelpModal(true)}
      testID="timeline-screen"
    >
      <LinearGradient
        colors={[colors.stadiumNavy, colors.surface, colors.stadiumNavy]}
        locations={[0, 0.3, 1]}
        style={styles.container}
      >
        {/* Compact Subject/Title Header */}
        {(content.title || content.subject) && (
          <View style={styles.subjectBar}>
            {content.title ? (
              <Text style={styles.subjectName}>
                {content.title.toUpperCase()}
              </Text>
            ) : (
              <>
                <Text style={styles.subjectLabel}>CAREER OF</Text>
                <Text style={styles.subjectDot}> · </Text>
                <Text style={styles.subjectName}>
                  {content.subject!.toUpperCase()}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Instruction — only during play */}
        {isPlaying && (
          <Text style={styles.instructionText}>
            Sort the events into chronological order
          </Text>
        )}

        {/* Timeline List — fills remaining space, handles own scrolling */}
        <TimelineList
          events={state.eventOrder}
          lockedIndices={state.lockedIndices}
          lastAttemptResults={state.lastAttemptResults}
          revealPhase={state.revealPhase}
          onReorder={reorderEvents}
          disabled={!isPlaying || state.revealPhase !== "idle"}
          gameOver={isGameOver}
          testID="timeline-list"
        />

        {/* Action Bar (while playing) */}
        {isPlaying && (
          <TimelineActionBar
            canSubmit={state.revealPhase === "idle"}
            onSubmit={submitOrder}
            onGiveUp={handleGiveUpPress}
            attemptCount={state.attemptCount}
            testID="timeline-actions"
          />
        )}

        {/* Game Over Zone - Show button for all finished states */}
        {isGameOver && (
          <View style={styles.gameOverZone}>
            {state.gameStatus === "won" && (
              <Text style={styles.winText}>
                {state.attemptCount === 1 ? "PERFECT!" : "TIMELINE COMPLETE!"}
              </Text>
            )}
            <ElevatedButton
              title="See how you compare"
              onPress={handleSeeScore}
              fullWidth
              borderRadius={12}
              testID="timeline-see-score"
            />
          </View>
        )}

        {/* Result Modal */}
        {state.score && (
          <TimelineResultModal
            visible={showResultModal}
            score={state.score}
            firstAttemptResults={state.firstAttemptResults}
            subject={content.subject}
            puzzleId={puzzle.id}
            puzzleDate={puzzle.puzzle_date}
            onClose={handleClose}
            onShare={handleShare}
            gaveUp={state.gameStatus === "gave_up"}
            outOfGuesses={state.gameStatus === "lost"}
            showNextPuzzle={true}
            testID="result-modal"
          />
        )}

        {/* Ad Banner (non-premium users) */}
        <AdBanner testID="timeline-ad-banner" />

        {/* Help Modal */}
        <GameIntroModal
          gameMode="timeline"
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          testID="timeline-help-modal"
        />

        {/* Give Up Confirmation Modal */}
        <ConfirmationModal
          visible={showGiveUpModal}
          title="Give Up?"
          message="Are you sure? The correct order will be revealed."
          confirmLabel="Reveal Order"
          cancelLabel="Back to Game"
          onConfirm={handleGiveUpConfirm}
          onCancel={handleGiveUpCancel}
          testID="timeline-giveup-modal"
        />
      </LinearGradient>
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  subjectBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  subjectLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.textSecondary,
  },
  subjectDot: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSecondary,
  },
  subjectName: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
  },
  instructionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
  gameOverZone: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
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
