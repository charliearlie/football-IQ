/**
 * TheGridScreen Component
 *
 * Main screen for The Grid game mode.
 * Players fill a 3x3 grid by naming footballers who satisfy both row and column criteria.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, spacing } from '@/theme';
import { usePuzzle, useOnboarding, GameIntroScreen, GameIntroModal } from '@/features/puzzles';
import { GameContainer } from '@/components/GameContainer';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ReviewModeBanner } from '@/components/ReviewMode';
import { PlayerSearchOverlay } from '@/components/PlayerSearchOverlay';
import { AdBanner } from '@/features/ads';
import { useTheGridGame } from '../hooks/useTheGridGame';
import { TheGridBoard } from '../components/TheGridBoard';
import { TheGridResultModal } from '../components/TheGridResultModal';
import { parseTheGridContent, FilledCell, TheGridAttemptMetadata } from '../types/theGrid.types';
import { ParsedLocalAttempt } from '@/types/database';
import { UnifiedPlayer } from '@/services/oracle/types';

export interface TheGridScreenProps {
  /** Puzzle ID to play (optional - uses today's puzzle if not provided) */
  puzzleId?: string;
  /** Pre-loaded attempt for review mode */
  attempt?: ParsedLocalAttempt;
}

/**
 * TheGridScreen - Main game screen for The Grid.
 */
export function TheGridScreen({ puzzleId: propPuzzleId, attempt }: TheGridScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ puzzleId?: string }>();
  const puzzleId = propPuzzleId || params.puzzleId;

  // Onboarding state - show intro for first-time users
  const { shouldShowIntro, isReady: isOnboardingReady, completeIntro } = useOnboarding('the_grid');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get puzzle - either by ID or today's puzzle
  const { puzzle, isLoading } = usePuzzle(puzzleId || 'the_grid');

  // Check if this is review mode (completed attempt provided)
  const isReviewMode = !!attempt?.completed;

  // Game state
  const {
    state,
    gridContent,
    selectedCellCategories,
    selectCell,
    deselectCell,
    submitPlayerSelection,
    giveUp,
    shareResult,
  } = useTheGridGame(puzzle);

  // Modal visibility
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

  // Show result modal when game completes or player gives up
  useEffect(() => {
    if ((state.gameStatus === 'complete' || state.gameStatus === 'gave_up') && state.attemptSaved && !isReviewMode) {
      setShowResultModal(true);
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

  // Parse review mode cells from attempt metadata with defensive type checking
  const reviewCells: (FilledCell | null)[] | null = React.useMemo(() => {
    if (!isReviewMode || !attempt?.metadata) return null;

    // Defensive type check before casting
    if (typeof attempt.metadata !== 'object' || Array.isArray(attempt.metadata) || attempt.metadata === null) {
      return null;
    }

    const metadata = attempt.metadata as TheGridAttemptMetadata;
    // Validate cells array exists and is an array
    if (!metadata.cells || !Array.isArray(metadata.cells)) {
      return null;
    }
    return metadata.cells;
  }, [isReviewMode, attempt?.metadata]);

  // Handle player selection from overlay
  const handleSelectPlayer = async (player: UnifiedPlayer) => {
    await submitPlayerSelection(player.id, player.name);
  };

  // Handle share
  const handleShare = async () => {
    const result = await shareResult();
    if (result.success && result.method === 'clipboard') {
      // Could show a toast here
    }
  };

  // Onboarding loading state (prevent flash)
  if (!isOnboardingReady) {
    return (
      <GameContainer title="The Grid" testID="the-grid-screen">
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
        gameMode="the_grid"
        onStart={completeIntro}
        testID="the-grid-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={styles.loadingText}>Loading puzzle...</Text>
      </View>
    );
  }

  // No puzzle available
  if (!puzzle || !gridContent) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noPuzzleText}>No puzzle available today</Text>
        <Text style={styles.noPuzzleSubtext}>Check back later!</Text>
      </View>
    );
  }

  // Cells to display (review mode uses saved cells, play mode uses game state)
  const displayCells = isReviewMode && reviewCells ? reviewCells : state.cells;

  return (
    <GameContainer
      title="The Grid"
      onHelpPress={() => setShowHelpModal(true)}
      testID="the-grid-screen"
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
        >
          {/* Review mode banner */}
          {isReviewMode && <ReviewModeBanner />}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {isReviewMode
                ? 'Review your completed game'
                : 'Fill the grid with players who match both criteria'}
            </Text>
          </View>

          {/* The Grid Board */}
          <View style={styles.boardContainer}>
            <TheGridBoard
              content={gridContent}
              cells={displayCells}
              selectedCell={isReviewMode ? null : state.selectedCell}
              onCellPress={isReviewMode ? () => {} : selectCell}
              disabled={isReviewMode || state.gameStatus !== 'playing'}
              testID="the-grid-board"
            />
          </View>

          {/* Progress indicator + Give up */}
          {!isReviewMode && state.gameStatus === 'playing' && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {state.cells.filter((c) => c !== null).length}/9 cells filled
              </Text>
              <Pressable
                onPress={handleGiveUpPress}
                style={({ pressed }) => [
                  styles.giveUpLink,
                  pressed && styles.giveUpLinkPressed,
                ]}
                testID="the-grid-giveup"
              >
                <Text style={styles.giveUpText}>Give up</Text>
              </Pressable>
            </View>
          )}

          {/* Review mode score display */}
          {isReviewMode && attempt && (
            <View style={styles.reviewScoreContainer}>
              <Text style={styles.reviewScoreLabel}>Final Score</Text>
              <Text style={styles.reviewScoreValue}>
                {typeof attempt.score === 'number' ? attempt.score : 0}
                <Text style={styles.reviewScoreMax}>/100</Text>
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Result Modal */}
        <TheGridResultModal
          visible={showResultModal}
          score={state.score}
          cells={state.cells}
          puzzleId={puzzle?.id ?? ''}
          onClose={() => {
            setShowResultModal(false);
            router.back();
          }}
          onShare={handleShare}
          gaveUp={state.gameStatus === 'gave_up'}
          testID="result-modal"
        />

        {/* Give Up Confirmation Modal */}
        <ConfirmationModal
          visible={showGiveUpModal}
          confirmLabel="Reveal Answers"
          onConfirm={handleGiveUpConfirm}
          onCancel={handleGiveUpCancel}
          testID="give-up-modal"
        />

        {/* Player Search Overlay - opens when cell is selected */}
        <PlayerSearchOverlay
          visible={!isReviewMode && state.selectedCell !== null && state.gameStatus === 'playing'}
          onSelectPlayer={handleSelectPlayer}
          onClose={deselectCell}
          title={
            selectedCellCategories
              ? `${selectedCellCategories.row.value} & ${selectedCellCategories.col.value}`
              : 'Search Players'
          }
          testID="player-search-overlay"
        />

        {/* Ad Banner (non-premium users) */}
        <AdBanner testID="the-grid-ad-banner" />

        {/* Help Modal */}
        <GameIntroModal
          gameMode="the_grid"
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          testID="the-grid-help-modal"
        />
      </View>
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
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
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  noPuzzleSubtext: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  instructionsText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  boardContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  progressText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  giveUpLink: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  giveUpLinkPressed: {
    opacity: 0.7,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
  reviewScoreContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  reviewScoreLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  reviewScoreValue: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.floodlightWhite,
  },
  reviewScoreMax: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});
