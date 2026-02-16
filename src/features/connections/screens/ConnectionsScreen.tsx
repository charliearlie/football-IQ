/**
 * ConnectionsScreen Component
 *
 * Main screen for the Connections game mode.
 * Players identify 4 groups of 4 related footballers from a 4x4 grid.
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
import { colors, fonts, spacing } from '@/theme';
import { usePuzzle, useOnboarding, GameIntroScreen, GameIntroModal } from '@/features/puzzles';
import { GameContainer } from '@/components/GameContainer';
import { AdBanner } from '@/features/ads';
import { useConnectionsGame } from '../hooks/useConnectionsGame';
import { ConnectionsGrid } from '../components/ConnectionsGrid';
import { ConnectionsActionBar } from '../components/ConnectionsActionBar';
import { MistakeIndicator } from '../components/MistakeIndicator';
import { ConnectionsResultModal } from '../components/ConnectionsResultModal';

export interface ConnectionsScreenProps {
  /** Puzzle ID to play (optional - uses today's puzzle if not provided) */
  puzzleId?: string;
}

/**
 * ConnectionsScreen - Main game screen for Connections.
 */
export function ConnectionsScreen({ puzzleId: propPuzzleId }: ConnectionsScreenProps) {
  // Onboarding state - show intro for first-time users
  const { shouldShowIntro, isReady: isOnboardingReady, completeIntro } = useOnboarding('connections');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get puzzle - either by ID or today's puzzle
  const { puzzle, isLoading } = usePuzzle(propPuzzleId || 'connections');

  // Game state
  const {
    state,
    content,
    togglePlayer,
    submitGuess,
    shufflePlayers,
    deselectAll,
    shareResult,
  } = useConnectionsGame(puzzle);

  // Modal visibility
  const [showResultModal, setShowResultModal] = useState(false);

  // Show result modal when game completes
  useEffect(() => {
    if ((state.gameStatus === 'won' || state.gameStatus === 'lost') && state.attemptSaved) {
      setShowResultModal(true);
    }
  }, [state.gameStatus, state.attemptSaved]);

  // Handle share
  const handleShare = async () => {
    const result = await shareResult();
    if (result.success && result.method === 'clipboard') {
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
        <Text style={styles.loadingText}>Loading puzzle...</Text>
      </View>
    );
  }

  // No puzzle available
  if (!puzzle || !content) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noPuzzleText}>No puzzle available today</Text>
        <Text style={styles.noPuzzleSubtext}>Check back later!</Text>
      </View>
    );
  }

  const isPlaying = state.gameStatus === 'playing';

  return (
    <GameContainer
      title="Connections"
      onHelpPress={() => setShowHelpModal(true)}
      testID="connections-screen"
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Find groups of four footballers with something in common
            </Text>
          </View>

          {/* Mistake indicator */}
          {isPlaying && (
            <View style={styles.mistakeContainer}>
              <Text style={styles.mistakeLabel}>Mistakes remaining:</Text>
              <MistakeIndicator mistakes={state.mistakes} testID="mistake-indicator" />
            </View>
          )}

          {/* Main Grid */}
          <View style={styles.gridContainer}>
            <ConnectionsGrid
              solvedGroups={state.solvedGroups}
              remainingPlayers={state.remainingPlayers}
              selectedPlayers={state.selectedPlayers}
              onTogglePlayer={togglePlayer}
              disabled={!isPlaying}
              testID="connections-grid"
            />
          </View>

          {/* Utility buttons */}
          {isPlaying && (
            <View style={styles.utilityRow}>
              <Pressable
                style={[styles.utilityButton, state.selectedPlayers.length === 0 && styles.utilityButtonDisabled]}
                onPress={deselectAll}
                disabled={state.selectedPlayers.length === 0}
              >
                <Text style={[styles.utilityButtonText, state.selectedPlayers.length === 0 && styles.utilityButtonTextDisabled]}>
                  DESELECT ALL
                </Text>
              </Pressable>
              <Pressable style={styles.utilityButton} onPress={shufflePlayers}>
                <Text style={styles.utilityButtonText}>SHUFFLE</Text>
              </Pressable>
            </View>
          )}

          {/* Feedback messages */}
          {state.lastGuessResult === 'close' && (
            <Text style={styles.feedbackClose}>One away! Try again.</Text>
          )}
          {state.lastGuessResult === 'incorrect' && (
            <Text style={styles.feedbackIncorrect}>Not quite. Keep trying!</Text>
          )}
        </ScrollView>

        {/* Action Bar */}
        {isPlaying && (
          <ConnectionsActionBar
            canSubmit={state.selectedPlayers.length === 4}
            onSubmit={submitGuess}
            testID="connections-actions"
          />
        )}

        {/* Result Modal */}
        <ConnectionsResultModal
          visible={showResultModal}
          score={state.score}
          guesses={state.guesses}
          allGroups={content.groups}
          puzzleId={puzzle.id}
          puzzleDate={puzzle.puzzle_date}
          onClose={() => setShowResultModal(false)}
          onShare={handleShare}
          testID="result-modal"
        />

        {/* Ad Banner (non-premium users) */}
        <AdBanner testID="connections-ad-banner" />

        {/* Help Modal */}
        <GameIntroModal
          gameMode="connections"
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          testID="connections-help-modal"
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
  mistakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  mistakeLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContainer: {
    paddingHorizontal: spacing.lg,
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  utilityButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  utilityButtonDisabled: {
    opacity: 0.3,
  },
  utilityButtonText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.floodlightWhite,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  utilityButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  feedbackClose: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.cardYellow,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  feedbackIncorrect: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
