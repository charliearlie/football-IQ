/**
 * Higher/Lower Game Screen
 *
 * Players guess if Player 2's transfer fee is higher or lower than Player 1's.
 * 10 rounds total — one wrong answer ends the game immediately.
 */

import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import {
  useStablePuzzle,
  useOnboarding,
  GameIntroScreen,
} from '@/features/puzzles';
import { useReviewMode } from '@/hooks';
import { colors, spacing, fonts, textStyles } from '@/theme';
import {
  GameContainer,
  ReviewModeBanner,
  ReviewModeActionZone,
} from '@/components';
import { AdBanner } from '@/features/ads';
import { useHigherLower } from '../hooks/useHigherLower';
import { TransferCard } from '../components/TransferCard';
import { HigherLowerActionZone } from '../components/HigherLowerActionZone';
import { HigherLowerResultModal } from '../components/HigherLowerResultModal';
import { HigherLowerReviewList } from '../components/HigherLowerReviewList';
import { HigherLowerAttemptMetadata } from '../types/higherLower.types';

interface HigherLowerScreenProps {
  puzzleId?: string;
  isReviewMode?: boolean;
}

export function HigherLowerScreen({
  puzzleId,
  isReviewMode = false,
}: HigherLowerScreenProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  // Onboarding state
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding('higher_lower');

  // Puzzle loading
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'higher_lower');

  // Game hook (skip focus-driven persistence while in review mode)
  const {
    state,
    higherLowerContent,
    currentPair,
    isGameOver,
    submitAnswer,
    shareResult,
  } = useHigherLower(puzzle, isFocused && !isReviewMode);

  // Fetch saved attempt for review mode
  const {
    metadata: reviewMetadata,
    isLoading: isReviewLoading,
  } = useReviewMode<HigherLowerAttemptMetadata>(puzzleId, isReviewMode);

  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);

  // Show modal after game ends
  useEffect(() => {
    if (!isGameOver || showResultModal) return;

    const timer = setTimeout(() => {
      setShowResultModal(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [isGameOver, showResultModal]);

  // Handlers
  const handleBackToHome = useCallback(() => {
    router.back();
  }, [router]);

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
    handleBackToHome();
  }, [handleBackToHome]);

  const handleHigher = useCallback(() => {
    submitAnswer('higher');
  }, [submitAnswer]);

  const handleLower = useCallback(() => {
    submitAnswer('lower');
  }, [submitAnswer]);

  // Onboarding loading state
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Higher/Lower" testID="higher-lower-screen">
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
        gameMode="higher_lower"
        onStart={completeIntro}
        testID="higher-lower-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Higher/Lower" testID="higher-lower-screen">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
          <Text style={[textStyles.body, styles.loadingText]}>
            Loading game...
          </Text>
        </View>
      </GameContainer>
    );
  }

  // No puzzle available
  if (!puzzle || !higherLowerContent) {
    return (
      <GameContainer title="Higher/Lower" testID="higher-lower-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Game Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Review mode: show all 10 rounds with answers revealed
  if (isReviewMode) {
    if (isReviewLoading) {
      return (
        <GameContainer title="Higher/Lower - Review" testID="higher-lower-review">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={[textStyles.body, styles.loadingText]}>
              Loading review...
            </Text>
          </View>
        </GameContainer>
      );
    }

    const savedAnswers = reviewMetadata?.answers ?? [];
    const savedResults = reviewMetadata?.results ?? [];
    const correctCount = savedResults.filter(Boolean).length;

    return (
      <GameContainer title="Higher/Lower - Review" testID="higher-lower-review">
        <ScrollView
          contentContainerStyle={styles.reviewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          <View style={styles.reviewSummary}>
            <Text style={styles.reviewScore}>{correctCount}/10</Text>
            <Text style={styles.reviewScoreLabel}>CORRECT</Text>
          </View>

          <HigherLowerReviewList
            pairs={higherLowerContent.pairs}
            answers={savedAnswers}
            results={savedResults}
            testID="review-list"
          />
        </ScrollView>

        <ReviewModeActionZone
          onClose={handleBackToHome}
          testID="review-action-zone"
        />
      </GameContainer>
    );
  }

  const isButtonsDisabled = state.showingResult || isGameOver || !currentPair;

  // Determine the reveal state for player 2
  const hasAnsweredCurrentRound = state.showingResult || isGameOver;
  const currentResult = hasAnsweredCurrentRound
    ? state.results[state.currentRound] ?? state.results[state.results.length - 1]
    : undefined;

  return (
    <GameContainer title="Higher/Lower" testID="higher-lower-screen">
      <View style={styles.container}>
        {/* Cards area */}
        {currentPair && (
          <View style={styles.cardsContainer}>
            {/* Player 1 — compact reference strip */}
            <TransferCard
              playerName={currentPair.player1.name}
              context={currentPair.player1.context}
              statLabel={currentPair.player1.statLabel}
              statType={currentPair.player1.statType}
              value={currentPair.player1.value}
              revealed={true}
              variant="compact"
              testID="player1-card"
            />

            {/* VS divider with question */}
            <View style={styles.vsDivider}>
              <View style={styles.vsLine} />
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.vsLine} />
            </View>

            {/* Player 2 — hero guess card */}
            <TransferCard
              playerName={currentPair.player2.name}
              context={currentPair.player2.context}
              statLabel={currentPair.player2.statLabel}
              statType={currentPair.player2.statType}
              value={currentPair.player2.value}
              revealed={hasAnsweredCurrentRound}
              isCorrect={hasAnsweredCurrentRound ? currentResult : undefined}
              variant="hero"
              testID="player2-card"
            />
          </View>
        )}

        {/* Action Zone */}
        {!isGameOver && (
          <HigherLowerActionZone
            onHigher={handleHigher}
            onLower={handleLower}
            disabled={isButtonsDisabled}
            currentRound={state.currentRound}
            totalRounds={state.totalRounds}
            testID="action-zone"
          />
        )}

        {/* Push ad to bottom */}
        <View style={{ flex: 1 }} />

        {/* Ad Banner */}
        {!isGameOver && (
          <AdBanner testID="higher-lower-ad-banner" />
        )}
      </View>

      {/* Result Modal */}
      {state.score && (
        <HigherLowerResultModal
          visible={showResultModal}
          score={state.score}
          results={state.results}
          puzzleId={puzzle.id}
          puzzleDate={puzzle.puzzle_date}
          onShare={shareResult}
          onClose={handleCloseModal}
          showNextPuzzle={!isReviewMode && puzzle?.puzzle_date === new Date().toISOString().split('T')[0]}
          testID="result-modal"
        />
      )}
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  noPuzzleText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cardsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  vsText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    letterSpacing: 2,
  },
  reviewScrollContent: {
    paddingBottom: spacing.xl,
  },
  reviewSummary: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  reviewScore: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.pitchGreen,
    letterSpacing: 1,
  },
  reviewScoreLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginTop: 4,
  },
});
