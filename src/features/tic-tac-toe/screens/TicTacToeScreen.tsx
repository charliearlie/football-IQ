/**
 * TicTacToeScreen
 *
 * Main screen for the Tic Tac Toe game mode.
 * Players compete against AI on a 3x3 grid where each cell
 * requires naming a player who fits both row and column categories.
 *
 * Supports review mode for viewing completed games.
 */

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Bot, AlertTriangle } from 'lucide-react-native';
import { useCallback } from 'react';
import { colors, spacing, textStyles, borderRadius, fonts } from '@/theme';
import { GameContainer, GlassCard, ReviewModeActionZone, ReviewModeBanner } from '@/components';
import { useStablePuzzle } from '@/features/puzzles';
import { useReviewMode } from '@/hooks';
import { useTicTacToeGame } from '../hooks/useTicTacToeGame';
import { TicTacToeGrid } from '../components/TicTacToeGrid';
import { TicTacToeActionZone } from '../components/TicTacToeActionZone';
import { TicTacToeResultModal } from '../components/TicTacToeResultModal';
import { AdBanner } from '@/features/ads';
import type { CellState, TicTacToeContent } from '../types/ticTacToe.types';

/**
 * Metadata structure saved when a Tic Tac Toe game completes.
 */
interface TicTacToeMetadata {
  cells: CellState[];
  result: 'win' | 'loss' | 'draw';
  playerCells: number;
  aiCells: number;
  winningLine: number[] | null;
}

/**
 * Props for TicTacToeScreen.
 */
interface TicTacToeScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's tic_tac_toe puzzle.
   */
  puzzleId?: string;
  /**
   * Whether to show the game in review mode (read-only).
   * When true, shows the final board state with all cells revealed.
   */
  isReviewMode?: boolean;
}

/**
 * TicTacToeScreen - Main game screen
 */
export function TicTacToeScreen({
  puzzleId,
  isReviewMode = false,
}: TicTacToeScreenProps) {
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'tic_tac_toe');

  const {
    state,
    puzzleContent,
    isGameOver,
    isPlayerTurn,
    selectedCellCategories,
    selectCell,
    deselectCell,
    setCurrentGuess,
    submitGuess,
    resetGame,
    shareResult,
  } = useTicTacToeGame(puzzle);

  // Fetch saved attempt data for review mode
  const {
    metadata: reviewMetadata,
    isLoading: isReviewLoading,
  } = useReviewMode<TicTacToeMetadata>(puzzleId, isReviewMode);

  /**
   * Handle back button - resets game and navigates back
   */
  const handleBack = useCallback(() => {
    resetGame();
    router.back();
  }, [resetGame, router]);

  /**
   * Handle modal close - resets game for replay
   */
  const handleClose = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Loading state
  if (isLoading) {
    return (
      <GameContainer
        title="Tic Tac Toe"
        onBack={handleBack}
        testID="tic-tac-toe-screen"
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
  if (!puzzle || !puzzleContent) {
    return (
      <GameContainer
        title="Tic Tac Toe"
        onBack={handleBack}
        testID="tic-tac-toe-screen"
      >
        <View style={styles.centered}>
          <Text style={textStyles.h2}>NO PUZZLE TODAY</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Tic Tac Toe challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  // Review mode: Show final board state with all cells revealed
  if (isReviewMode) {
    // Still loading attempt data
    if (isReviewLoading) {
      return (
        <GameContainer
          title="Tic Tac Toe - Review"
          testID="tic-tac-toe-review"
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

    // Build cells from saved metadata for the grid display
    // Cast to expected types since metadata stores the raw arrays
    const reviewCells = (reviewMetadata?.cells ?? state.cells) as typeof state.cells;
    const reviewWinningLine = (reviewMetadata?.winningLine ?? null) as typeof state.winningLine;
    const resultText =
      reviewMetadata?.result === 'win'
        ? 'You Won!'
        : reviewMetadata?.result === 'loss'
          ? 'AI Won'
          : 'Draw';
    const resultColor =
      reviewMetadata?.result === 'win'
        ? colors.pitchGreen
        : reviewMetadata?.result === 'loss'
          ? colors.redCard
          : colors.cardYellow;

    return (
      <GameContainer
        title="Tic Tac Toe - Review"
        testID="tic-tac-toe-review"
      >
        <ScrollView
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
        >
          <ReviewModeBanner testID="review-banner" />

          {/* Legacy Mode Notice */}
          <View style={styles.legacyNotice} testID="legacy-notice">
            <AlertTriangle size={16} color={colors.cardYellow} strokeWidth={2} />
            <Text style={styles.legacyNoticeText}>LEGACY MODE - PREVIEW ONLY</Text>
          </View>

          {/* Result summary */}
          <View style={styles.reviewResultSummary}>
            <Text style={[styles.reviewResultText, { color: resultColor }]}>
              {resultText}
            </Text>
            <Text style={styles.reviewScoreText}>
              You: {reviewMetadata?.playerCells ?? 0} | AI: {reviewMetadata?.aiCells ?? 0}
            </Text>
          </View>

          {/* Final Grid State */}
          <View style={styles.gridContainer}>
            <TicTacToeGrid
              cells={reviewCells}
              puzzleContent={puzzleContent}
              selectedCell={null}
              winningLine={reviewWinningLine}
              isPlayerTurn={false}
              isGameOver={true}
              winner={
                reviewMetadata?.result === 'win'
                  ? 'player'
                  : reviewMetadata?.result === 'loss'
                    ? 'ai'
                    : null
              }
              onCellPress={() => {}}
            />
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.pitchGreen }]} />
              <Text style={styles.legendText}>You</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.redCard }]} />
              <Text style={styles.legendText}>AI</Text>
            </View>
          </View>
        </ScrollView>

        {/* Close Review button */}
        <ReviewModeActionZone
          onClose={() => router.back()}
          testID="review-action-zone"
        />
      </GameContainer>
    );
  }

  return (
    <GameContainer
      title="Tic Tac Toe"
      onBack={handleBack}
      testID="tic-tac-toe-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Turn Indicator */}
        <GlassCard style={styles.turnIndicator}>
          <View style={styles.turnContent}>
            {isPlayerTurn ? (
              <>
                <User size={20} color={colors.pitchGreen} />
                <Text style={[styles.turnText, { color: colors.pitchGreen }]}>
                  Your Turn
                </Text>
              </>
            ) : (
              <>
                <Bot size={20} color={colors.cardYellow} />
                <Text style={[styles.turnText, { color: colors.cardYellow }]}>
                  AI Thinking...
                </Text>
              </>
            )}
          </View>
        </GlassCard>

        {/* Instructions */}
        <Text style={styles.instructions}>
          Tap a cell and name a player who fits both categories
        </Text>

        {/* The Grid */}
        <View style={styles.gridContainer}>
          <TicTacToeGrid
            cells={state.cells}
            puzzleContent={puzzleContent}
            selectedCell={state.selectedCell}
            winningLine={state.winningLine}
            isPlayerTurn={isPlayerTurn}
            isGameOver={isGameOver}
            winner={state.winner}
            onCellPress={selectCell}
          />
        </View>

        {/* Action Zone (when cell selected) */}
        {selectedCellCategories && !isGameOver && (
          <View style={styles.actionZoneContainer}>
            <TicTacToeActionZone
              currentGuess={state.currentGuess}
              onGuessChange={setCurrentGuess}
              onSubmit={submitGuess}
              onCancel={deselectCell}
              shouldShake={state.lastGuessIncorrect}
              rowCategory={selectedCellCategories.row}
              columnCategory={selectedCellCategories.column}
              isActive={state.selectedCell !== null}
            />
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.pitchGreen }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.redCard }]} />
            <Text style={styles.legendText}>AI</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.cardYellow }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>
      </ScrollView>

      {/* Result Modal */}
      {isGameOver && state.score && (
        <TicTacToeResultModal
          visible={isGameOver}
          score={state.score}
          cells={state.cells}
          onShare={shareResult}
          onClose={handleClose}
        />
      )}

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="tic-tac-toe-ad-banner" />
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  noPuzzleText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  turnIndicator: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  turnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  turnText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    letterSpacing: 1,
  },
  instructions: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  actionZoneContainer: {
    marginBottom: spacing.lg,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  legendText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  // Review mode styles
  reviewContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  reviewResultSummary: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reviewResultText: {
    fontFamily: fonts.headline,
    fontSize: 32,
    letterSpacing: 2,
  },
  reviewScoreText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  legacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardYellow,
  },
  legacyNoticeText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.cardYellow,
    letterSpacing: 1,
  },
});
