/**
 * TheChainScreen Component
 *
 * Main screen for The Chain game mode.
 * Players connect two footballers through shared club history.
 * Uses Inverse Par scoring system.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Link2, HelpCircle } from "lucide-react-native";
import { colors, fonts, spacing, borderRadius } from "@/theme";
import {
  usePuzzle,
  useOnboarding,
  GameIntroScreen,
  GameIntroModal,
} from "@/features/puzzles";
import { GameContainer } from "@/components/GameContainer";
import { GlassCard } from "@/components/GlassCard";
import { ElevatedButton } from "@/components/ElevatedButton";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ReviewModeBanner } from "@/components/ReviewMode";
import { PlayerSearchOverlay } from "@/components/PlayerSearchOverlay";
import { SuccessParticleBurst } from "@/components/SuccessParticleBurst";
import { AdBanner } from "@/features/ads";
import { useTheChainGame } from "../hooks/useTheChainGame";
import { ChainProgress } from "../components/ChainProgress";
import { ChainProgressBar } from "../components/ChainProgressBar";
import { TheChainResultModal } from "../components/TheChainResultModal";
import {
  parseTheChainContent,
  ChainLink,
  TheChainAttemptMetadata,
} from "../types/theChain.types";
import { ParsedLocalAttempt } from "@/types/database";
import { UnifiedPlayer } from "@/services/oracle/types";

export interface TheChainScreenProps {
  /** Puzzle ID to play (optional - uses today's puzzle if not provided) */
  puzzleId?: string;
  /** Pre-loaded attempt for review mode */
  attempt?: ParsedLocalAttempt;
}

/**
 * TheChainScreen - Main game screen for The Chain.
 */
export function TheChainScreen({
  puzzleId: propPuzzleId,
  attempt,
}: TheChainScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ puzzleId?: string }>();
  const puzzleId = propPuzzleId || params.puzzleId;

  // Onboarding state - show intro for first-time users
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding("the_chain");
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get puzzle - either by ID or today's puzzle
  const { puzzle, isLoading } = usePuzzle(puzzleId || "the_chain");

  // Check if this is review mode (completed attempt provided)
  const isReviewMode = !!attempt?.completed;

  // Game state
  const {
    state,
    chainContent,
    lastPlayer,
    stepsTaken,
    openSearch,
    closeSearch,
    submitPlayerSelection,
    undoLastLink,
    giveUp,
    shareResult,
  } = useTheChainGame(puzzle);

  // Modal visibility
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  // Track burst origin for particle effect
  const [burstOrigin, setBurstOrigin] = useState<{ x: number; y: number } | null>(null);

  // Show result modal when game completes or player gives up
  useEffect(() => {
    if (
      (state.gameStatus === "complete" || state.gameStatus === "gave_up") &&
      !isReviewMode
    ) {
      // Show modal immediately if attempt saved, or after timeout as fallback
      if (state.attemptSaved) {
        setShowResultModal(true);
      } else {
        // Fallback: show modal after 500ms even if save hasn't completed
        const fallbackTimer = setTimeout(() => setShowResultModal(true), 500);
        return () => clearTimeout(fallbackTimer);
      }
    }
  }, [state.gameStatus, state.attemptSaved, isReviewMode]);

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

  // Parse review mode chain from attempt metadata
  const reviewChain: ChainLink[] | null = React.useMemo(() => {
    if (!isReviewMode || !attempt?.metadata) return null;

    if (
      typeof attempt.metadata !== "object" ||
      Array.isArray(attempt.metadata) ||
      attempt.metadata === null
    ) {
      return null;
    }

    const metadata = attempt.metadata as TheChainAttemptMetadata;
    if (!metadata.chain || !Array.isArray(metadata.chain)) {
      return null;
    }
    return metadata.chain;
  }, [isReviewMode, attempt?.metadata]);

  // Handle player selection from overlay
  const handleSelectPlayer = async (player: UnifiedPlayer) => {
    // Get the button position for burst effect (approximate center of button area)
    const origin = { x: 180, y: 400 }; // Approximate, could be measured
    await submitPlayerSelection(player, origin);
  };

  // Handle share
  const handleShare = async () => {
    const result = await shareResult();
    if (result.success && result.method === "clipboard") {
      // Could show a toast here
    }
    return result;
  };

  // Handle close result modal
  const handleCloseResult = useCallback(() => {
    setShowResultModal(false);
    router.back();
  }, [router]);

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer title="The Chain" testID="the-chain-screen">
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
        gameMode="the_chain"
        onStart={completeIntro}
        testID="the-chain-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="The Chain" testID="the-chain-screen">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
        </View>
      </GameContainer>
    );
  }

  // Error state - no content
  if (!puzzle || !chainContent) {
    return (
      <GameContainer title="The Chain" testID="the-chain-screen">
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Puzzle not available</Text>
          <ElevatedButton title="Go Back" onPress={() => router.back()} />
        </View>
      </GameContainer>
    );
  }

  const displayChain = isReviewMode && reviewChain ? reviewChain : state.chain;
  const isComplete =
    isReviewMode ||
    state.gameStatus === "complete" ||
    state.gameStatus === "gave_up";

  return (
    <GameContainer
      title="The Chain"
      onHelpPress={() => setShowHelpModal(true)}
      testID="the-chain-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Review Mode Banner */}
        {isReviewMode && <ReviewModeBanner />}

        {/* Instructions */}
        <Text style={styles.instructions}>
          Connect {chainContent.start_player.name} to {chainContent.end_player.name}
        </Text>

        {/* Progress Bar */}
        <ChainProgressBar
          stepsTaken={
            isReviewMode && reviewChain
              ? reviewChain.length - 1
              : stepsTaken
          }
          par={chainContent.par}
          isComplete={isComplete}
          testID="chain-progress-bar"
        />

        {/* Chain Progress */}
        <ChainProgress
          chain={displayChain}
          startPlayer={chainContent.start_player}
          endPlayer={chainContent.end_player}
          isComplete={isComplete}
          testID="chain-progress"
        />

        {/* Review Mode Score Display */}
        {isReviewMode && attempt?.score !== undefined && (
          <GlassCard style={styles.reviewScoreCard}>
            <Text style={styles.reviewScoreLabel}>Final Score</Text>
            <Text style={styles.reviewScoreValue}>
              {attempt.score} points
            </Text>
            {attempt.score_display && (
              <Text style={styles.reviewScoreDisplay}>
                {attempt.score_display}
              </Text>
            )}
          </GlassCard>
        )}
      </ScrollView>

      {/* Fixed Footer - Action Buttons */}
      {!isReviewMode && state.gameStatus === "playing" && (
        <View style={styles.fixedFooter}>
          <ElevatedButton
            title="Add Next Link"
            onPress={openSearch}
            icon={<Link2 size={18} color={colors.stadiumNavy} />}
            fullWidth
            testID="add-link-button"
          />
          <View style={styles.footerLinks}>
            {state.chain.length > 1 && (
              <Pressable
                onPress={undoLastLink}
                style={({ pressed }) => [
                  styles.footerLink,
                  pressed && styles.footerLinkPressed,
                ]}
                testID="undo-button"
              >
                <Text style={styles.undoText}>Undo</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleGiveUpPress}
              style={({ pressed }) => [
                styles.footerLink,
                pressed && styles.footerLinkPressed,
              ]}
              testID="give-up-button"
            >
              <Text style={styles.giveUpText}>Give up</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Player Search Overlay */}
      <PlayerSearchOverlay
        visible={!isReviewMode && state.isSearchOpen}
        onSelectPlayer={handleSelectPlayer}
        onClose={closeSearch}
        title={`Link from ${lastPlayer?.name ?? "..."}`}
        showError={state.lastLinkInvalid}
        isLoading={state.isValidating}
        testID="player-search-overlay"
      />

      {/* Success Particle Burst */}
      <SuccessParticleBurst
        active={state.showSuccessBurst}
        originX={state.burstOrigin?.x}
        originY={state.burstOrigin?.y}
        testID="success-burst"
      />

      {/* Result Modal */}
      <TheChainResultModal
        visible={showResultModal}
        score={state.score}
        chain={state.chain}
        puzzleId={puzzle.id}
        puzzleDate={puzzle.puzzle_date}
        par={chainContent.par}
        gaveUp={state.gameStatus === "gave_up"}
        onClose={handleCloseResult}
        onShare={handleShare}
        testID="result-modal"
      />

      {/* Give Up Confirmation */}
      <ConfirmationModal
        visible={showGiveUpModal}
        title="Give Up?"
        message="Your chain will end here and you won't be able to continue."
        confirmLabel="Give Up"
        cancelLabel="Keep Playing"
        onConfirm={handleGiveUpConfirm}
        onCancel={handleGiveUpCancel}
        variant="danger"
        testID="give-up-modal"
      />

      {/* Help Modal */}
      <GameIntroModal
        visible={showHelpModal}
        gameMode="the_chain"
        onClose={() => setShowHelpModal(false)}
        testID="help-modal"
      />

      {/* Ad Banner */}
      <AdBanner testID="ad-banner" />
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  instructions: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  fixedFooter: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.stadiumNavy,
    gap: spacing.sm,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
  },
  footerLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  footerLinkPressed: {
    opacity: 0.7,
  },
  undoText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
  reviewScoreCard: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  reviewScoreLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reviewScoreValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.pitchGreen,
  },
  reviewScoreDisplay: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.floodlightWhite,
    marginTop: spacing.xs,
  },
});
