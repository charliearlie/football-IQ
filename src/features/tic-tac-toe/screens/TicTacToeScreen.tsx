/**
 * TicTacToeScreen
 *
 * Main screen for the Tic Tac Toe game mode.
 * Players compete against AI on a 3x3 grid where each cell
 * requires naming a player who fits both row and column categories.
 */

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Bot } from 'lucide-react-native';
import { useCallback } from 'react';
import { colors, spacing, textStyles, borderRadius, fonts } from '@/theme';
import { GameContainer, GlassCard } from '@/components';
import { useStablePuzzle } from '@/features/puzzles';
import { useTicTacToeGame } from '../hooks/useTicTacToeGame';
import { TicTacToeGrid } from '../components/TicTacToeGrid';
import { TicTacToeActionZone } from '../components/TicTacToeActionZone';
import { TicTacToeResultModal } from '../components/TicTacToeResultModal';
import { AdBanner } from '@/features/ads';

/**
 * Props for TicTacToeScreen.
 */
interface TicTacToeScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's tic_tac_toe puzzle.
   */
  puzzleId?: string;
}

/**
 * TicTacToeScreen - Main game screen
 */
export function TicTacToeScreen({ puzzleId }: TicTacToeScreenProps) {
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
});
