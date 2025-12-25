/**
 * TicTacToeScreen
 *
 * Main screen for the Tic Tac Toe game mode.
 * Players compete against AI on a 3x3 grid where each cell
 * requires naming a player who fits both row and column categories.
 */

import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Bot } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { colors, spacing, textStyles, borderRadius } from '@/theme';
import { GlassCard } from '@/components/GlassCard';
import { usePuzzle } from '@/features/puzzles/hooks/usePuzzle';
import { useTicTacToeGame } from '../hooks/useTicTacToeGame';
import { TicTacToeGrid } from '../components/TicTacToeGrid';
import { TicTacToeActionZone } from '../components/TicTacToeActionZone';
import { TicTacToeResultModal } from '../components/TicTacToeResultModal';

/**
 * TicTacToeScreen - Main game screen
 */
export function TicTacToeScreen() {
  const insets = useSafeAreaInsets();
  const { puzzle, isLoading } = usePuzzle('tic_tac_toe');
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

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

  const handleShare = useCallback(async () => {
    const result = await shareResult();
    if (result.success) {
      setShareStatus('shared');
    }
  }, [shareResult]);

  const handlePlayAgain = useCallback(() => {
    setShareStatus('idle');
    resetGame();
  }, [resetGame]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={[textStyles.body, styles.loadingText]}>
          Loading puzzle...
        </Text>
      </View>
    );
  }

  // No puzzle available
  if (!puzzle || !puzzleContent) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={textStyles.h2}>NO PUZZLE TODAY</Text>
        <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
          Check back later for today's Tic Tac Toe challenge
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
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
          onShare={handleShare}
          onPlayAgain={handlePlayAgain}
          shareStatus={shareStatus}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.stadiumNavy,
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
    fontFamily: 'BebasNeue_400Regular',
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
