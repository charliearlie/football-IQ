/**
 * TopTensScreen - The main Top Tens game screen.
 *
 * Displays a top 10 ranking puzzle where players guess all items.
 * Correct guesses reveal at their rank position.
 *
 * Premium-only game mode.
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStablePuzzle, useOnboarding, GameIntroScreen, GameIntroModal } from '@/features/puzzles';
import { useReviewMode } from '@/hooks';
import { colors, spacing, textStyles, layout } from '@/theme';
import {
  GameContainer,
  ConfirmationModal,
  ReviewModeBanner,
  ReviewModeActionZone,
} from '@/components';
import { useTopTensGame } from '../hooks/useTopTensGame';
import { RankGrid } from '../components/RankGrid';
import { RankCard } from '../components/RankCard';
import { TopTensActionZone } from '../components/TopTensActionZone';
import { TopTensResultModal } from '../components/TopTensResultModal';
import { TopTensAttemptMetadata, parseTopTensContent } from '../types/topTens.types';

/**
 * Props for TopTensScreen.
 */
interface TopTensScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's top_tens puzzle.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows all answers and the user's previous attempt.
   */
  isReviewMode?: boolean;
}

/**
 * TopTensScreen - Guess all 10 items in a ranked list.
 *
 * Features:
 * - 10 rank slots from #1 to #10
 * - Correct guesses reveal at their position
 * - Give up reveals all remaining answers
 * - Supports review mode for completed games
 */
export function TopTensScreen({
  puzzleId,
  isReviewMode = false,
}: TopTensScreenProps) {
  const router = useRouter();

  // Onboarding state - show intro for first-time users
  const { shouldShowIntro, isReady: isOnboardingReady, completeIntro } = useOnboarding('top_tens');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'top_tens');
  const {
    state,
    puzzleContent,
    isGameOver,
    isClimbing,
    setCurrentGuess,
    submitGuess,
    handleClimbComplete,
    giveUp,
    shareResult,
  } = useTopTensGame(puzzle);

  // Fetch saved attempt data for review mode
  const {
    metadata: reviewMetadata,
    isLoading: isReviewLoading,
  } = useReviewMode<TopTensAttemptMetadata>(puzzleId, isReviewMode);

  // Find the most recently found slot index for highlighting
  const latestFoundIndex = useMemo(() => {
    // Find the last found slot
    for (let i = state.rankSlots.length - 1; i >= 0; i--) {
      if (state.rankSlots[i].found) {
        return i;
      }
    }
    return null;
  }, [state.rankSlots]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleGiveUpPress = useCallback(() => {
    setShowGiveUpModal(true);
  }, []);

  const handleGiveUpConfirm = useCallback(() => {
    setShowGiveUpModal(false);
    // Delay giveUp to let ConfirmationModal dismiss first
    setTimeout(() => giveUp(), 350);
  }, [giveUp]);

  const handleGiveUpCancel = useCallback(() => {
    setShowGiveUpModal(false);
  }, []);

  const handleSeeScore = useCallback(() => {
    setShowResultModal(true);
  }, []);

  // Auto-show result modal on win (after a brief celebration delay)
  useEffect(() => {
    if (state.gameStatus === 'won') {
      const timer = setTimeout(() => setShowResultModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [state.gameStatus]);

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Top Tens" testID="top-tens-screen">
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
        gameMode="top_tens"
        onStart={completeIntro}
        testID="top-tens-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Top Tens" testID="top-tens-screen">
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
  if (!puzzle || !puzzleContent) {
    return (
      <GameContainer title="Top Tens" testID="top-tens-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Top Tens challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Review mode: Show all slots revealed with saved attempt data
  if (isReviewMode) {
    if (isReviewLoading) {
      return (
        <GameContainer title="Top Tens - Review" testID="top-tens-review">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={[textStyles.body, styles.loadingText]}>
              Loading review...
            </Text>
          </View>
        </GameContainer>
      );
    }

    // Parse content for review
    const reviewContent = parseTopTensContent(puzzle.content);

    // Create review slots showing all answers
    const reviewSlots = puzzleContent.answers.map((answer, i) => ({
      rank: i + 1,
      found: reviewMetadata?.foundIndices.includes(i) ?? false,
      autoRevealed: !(reviewMetadata?.foundIndices.includes(i) ?? false),
      answer,
    }));

    return (
      <GameContainer title="Top Tens - Review" testID="top-tens-review">
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          {/* Puzzle title */}
          <Text style={styles.puzzleTitle}>{puzzleContent.title}</Text>
          {puzzleContent.category && (
            <Text style={styles.puzzleCategory}>{puzzleContent.category}</Text>
          )}

          {/* All rank slots */}
          <View style={styles.reviewGrid}>
            {reviewSlots.map((slot, index) => (
              <RankCard
                key={slot.rank}
                slot={slot}
                isLatest={false}
                isHighlighted={false}
                highlightType={null}
                testID={`review-rank-${slot.rank}`}
              />
            ))}
          </View>

          {/* Summary */}
          <View style={styles.reviewSummary}>
            <Text style={styles.summaryText}>
              Found: {reviewMetadata?.foundIndices.length ?? 0}/10
            </Text>
            {reviewMetadata?.wrongGuessCount !== undefined && (
              <Text style={styles.summaryText}>
                Wrong guesses: {reviewMetadata.wrongGuessCount}
              </Text>
            )}
          </View>
        </ScrollView>

        <ReviewModeActionZone
          onClose={handleClose}
          testID="review-action-zone"
        />
      </GameContainer>
    );
  }

  // Active game
  return (
    <GameContainer
      title="Top Tens"
      onHelpPress={() => setShowHelpModal(true)}
      testID="top-tens-screen"
    >
      {/* Puzzle title */}
      <View style={styles.titleContainer}>
        {puzzleContent.category && (
          <Text style={styles.puzzleCategory}>{puzzleContent.category}</Text>
        )}
        <Text style={styles.puzzleTitle}>{puzzleContent.title}</Text>
      </View>

      {/* Rank Grid */}
      <RankGrid
        rankSlots={state.rankSlots}
        latestFoundIndex={latestFoundIndex}
        isClimbing={isClimbing}
        climbTargetRank={state.climbing.targetRank}
        onClimbComplete={handleClimbComplete}
        testID="rank-grid"
      />

      {/* Game Result Modal (shown on demand via "See how you scored") */}
      {state.score && (
        <TopTensResultModal
          visible={showResultModal}
          won={state.gameStatus === 'won'}
          score={state.score}
          rankSlots={state.rankSlots}
          puzzleId={puzzle?.id ?? ''}
          puzzleDate={puzzle?.puzzle_date ?? ''}
          onShare={shareResult}
          onClose={handleClose}
          testID="game-result-modal"
        />
      )}

      {/* Action Zone */}
      <TopTensActionZone
        currentGuess={state.currentGuess}
        onGuessChange={setCurrentGuess}
        onSubmit={submitGuess}
        onGiveUp={handleGiveUpPress}
        onSeeScore={handleSeeScore}
        foundCount={state.rankSlots.filter(s => s.found && !s.autoRevealed).length}
        shouldShake={state.lastGuessIncorrect}
        showDuplicate={state.lastGuessDuplicate}
        isGameOver={isGameOver}
        isClimbing={isClimbing}
        testID="action-zone"
      />

      {/* Give Up Confirmation Modal */}
      <ConfirmationModal
        visible={showGiveUpModal}
        confirmLabel="Reveal Answers"
        onConfirm={handleGiveUpConfirm}
        onCancel={handleGiveUpCancel}
        testID="give-up-modal"
      />

      {/* Help Modal */}
      <GameIntroModal
        gameMode="top_tens"
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        testID="top-tens-help-modal"
      />
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
  titleContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  puzzleTitle: {
    ...textStyles.h2,
    textAlign: 'center',
  },
  puzzleCategory: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  reviewContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  reviewGrid: {
    gap: spacing.sm,
  },
  reviewSummary: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.glassBackground,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
});
