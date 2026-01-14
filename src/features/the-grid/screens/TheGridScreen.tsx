/**
 * TheGridScreen Component
 *
 * Main screen for The Grid game mode.
 * Players fill a 3x3 grid by naming footballers who satisfy both row and column criteria.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, spacing } from '@/theme';
import { usePuzzle } from '@/features/puzzles';
import { ReviewModeBanner } from '@/components/ReviewMode';
import { PlayerSearchOverlay } from '@/components/PlayerSearchOverlay';
import { AdBanner } from '@/features/ads';
import { useTheGridGame } from '../hooks/useTheGridGame';
import { TheGridBoard } from '../components/TheGridBoard';
import { TheGridResultModal } from '../components/TheGridResultModal';
import { parseTheGridContent, FilledCell, TheGridAttemptMetadata } from '../types/theGrid.types';
import { ParsedLocalAttempt, ParsedPlayer } from '@/types/database';

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
    shareResult,
  } = useTheGridGame(puzzle);

  // Modal visibility
  const [showResultModal, setShowResultModal] = useState(false);

  // Show result modal when game completes
  useEffect(() => {
    if (state.gameStatus === 'complete' && state.attemptSaved && !isReviewMode) {
      setShowResultModal(true);
    }
  }, [state.gameStatus, state.attemptSaved, isReviewMode]);

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
  const handleSelectPlayer = async (player: ParsedPlayer) => {
    await submitPlayerSelection(player.id, player.name);
  };

  // Handle share
  const handleShare = async () => {
    const result = await shareResult();
    if (result.success && result.method === 'clipboard') {
      // Could show a toast here
    }
  };

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        {/* Review mode banner */}
        {isReviewMode && <ReviewModeBanner />}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>THE GRID</Text>
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
            disabled={isReviewMode || state.gameStatus === 'complete'}
            testID="the-grid-board"
          />
        </View>

        {/* Progress indicator */}
        {!isReviewMode && state.gameStatus === 'playing' && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {state.cells.filter((c) => c !== null).length}/9 cells filled
            </Text>
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
        testID="result-modal"
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
    </KeyboardAvoidingView>
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  instructionsTitle: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.floodlightWhite,
    marginBottom: spacing.xs,
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
