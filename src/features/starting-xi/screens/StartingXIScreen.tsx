/**
 * StartingXIScreen Component
 *
 * Main screen for Starting XI game mode.
 * Players guess hidden footballers in a match lineup by tapping positions
 * on a visual pitch and searching for players by name.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GameContainer } from '@/components/GameContainer';
import { GlassCard } from '@/components/GlassCard';
import { SuccessParticleBurst } from '@/components/SuccessParticleBurst';
import { ShareResult } from '@/components/GameResultModal';
import { colors, fonts, spacing } from '@/theme';
import { usePuzzle } from '@/features/puzzles';
import { ReviewModeBanner } from '@/components/ReviewMode';
import { AdBanner } from '@/features/ads';
import { useStartingXIGame } from '../hooks/useStartingXIGame';
import { LineupPitch } from '../components/LineupPitch';
import { StartingXIResultModal } from '../components/StartingXIResultModal';
import { GuessInputOverlay } from '../components/GuessInputOverlay';
import type {
  SlotIndex,
  StartingXIMeta,
  PlayerSlotState,
} from '../types/startingXI.types';
import type { ParsedLocalAttempt } from '@/types/database';

export interface StartingXIScreenProps {
  /** Puzzle ID to play (optional - uses today's puzzle if not provided) */
  puzzleId?: string;
  /** Pre-loaded attempt for review mode */
  attempt?: ParsedLocalAttempt;
}

/**
 * StartingXIScreen - Main game screen for Starting XI.
 */
export function StartingXIScreen({
  puzzleId: propPuzzleId,
  attempt,
}: StartingXIScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ puzzleId?: string }>();
  const puzzleId = propPuzzleId || params.puzzleId;

  // Get puzzle - either by ID or today's puzzle
  const { puzzle, isLoading } = usePuzzle(puzzleId || 'starting_xi');

  // Check if this is review mode (completed attempt provided)
  const isReviewMode = !!attempt?.completed;

  // Game state
  const {
    state,
    puzzleContent,
    isGameOver,
    foundCount,
    totalHidden,
    selectSlot,
    deselectSlot,
    submitGuess,
    giveUp,
    shareResult,
    lastGuessResult,
    lastGuessedId,
  } = useStartingXIGame(puzzle);

  // Modal visibility
  const [showResultModal, setShowResultModal] = useState(false);

  // Particle burst state for correct guess animation
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [particleBurstOrigin, setParticleBurstOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Callback for marker reveal animation (triggers particle burst)
  const handleMarkerReveal = useCallback((position: { x: number; y: number }) => {
    setParticleBurstOrigin(position);
    setShowParticleBurst(true);
  }, []);

  // Clear particle burst after animation completes
  const handleParticleBurstComplete = useCallback(() => {
    setShowParticleBurst(false);
    setParticleBurstOrigin(null);
  }, []);

  // Show result modal when game completes
  useEffect(() => {
    if (state.gameStatus === 'complete' && state.attemptSaved && !isReviewMode) {
      setShowResultModal(true);
    }
  }, [state.gameStatus, state.attemptSaved, isReviewMode]);

  // Parse review mode slots from attempt metadata
  const reviewSlots: PlayerSlotState[] | null = React.useMemo(() => {
    if (!isReviewMode || !attempt?.metadata || !puzzleContent) return null;

    if (
      typeof attempt.metadata !== 'object' ||
      Array.isArray(attempt.metadata) ||
      attempt.metadata === null
    ) {
      return null;
    }

    const metadata = attempt.metadata as StartingXIMeta;
    if (!metadata.foundSlots || !Array.isArray(metadata.foundSlots)) {
      return null;
    }

    // Reconstruct slots with found state from metadata
    return puzzleContent.players.map((player, index) => ({
      positionKey: player.position_key,
      coords: {
        x: player.override_x ?? 50,
        y: player.override_y ?? 50,
      },
      fullName: player.player_name,
      displayName: player.player_name.split(' ').pop() || player.player_name,
      isHidden: player.is_hidden,
      isFound: metadata.foundSlots.includes(index as SlotIndex),
    }));
  }, [isReviewMode, attempt?.metadata, puzzleContent]);

  // Handle share - returns result for BaseResultModal button state
  const handleShare = async (): Promise<ShareResult> => {
    const result = await shareResult();
    // Adapt the local ShareResult to the modal's expected ShareResult type
    return {
      success: result.success,
      method: result.method === 'none' ? undefined : result.method,
    };
  };

  // Get title for search overlay based on selected slot
  const getSearchTitle = (): string => {
    if (state.selectedSlot === null) return 'Who is this player?';
    const slot = state.slots[state.selectedSlot];
    return `Who plays ${slot.positionKey}?`;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={styles.loadingText}>Loading lineup...</Text>
      </View>
    );
  }

  // No puzzle available
  if (!puzzle || !puzzleContent) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noPuzzleText}>No lineup available today</Text>
        <Text style={styles.noPuzzleSubtext}>Check back later!</Text>
      </View>
    );
  }

  // Slots to display (review mode uses reconstructed slots)
  const displaySlots = isReviewMode && reviewSlots ? reviewSlots : state.slots;

  // Header right content (Give up link)
  const headerRight = !isReviewMode && state.gameStatus === 'playing' ? (
    <Pressable onPress={giveUp} hitSlop={12} testID="give-up-button">
      <Text style={styles.giveUpText}>Give up</Text>
    </Pressable>
  ) : undefined;

  return (
    <GameContainer
      title="Starting XI"
      headerRight={headerRight}
      testID="starting-xi-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        {/* Review mode banner */}
        {isReviewMode && <ReviewModeBanner />}

        {/* Instructions */}
        <Text style={styles.instructionsText}>
          {isReviewMode
            ? 'Review your completed game'
            : 'Tap the hidden players to guess who they are'}
        </Text>

        {/* Progress indicator */}
        {!isReviewMode && state.gameStatus === 'playing' && (
          <GlassCard style={styles.progressCard}>
            <Text style={styles.progressText}>
              Found: {foundCount}/{totalHidden}
            </Text>
          </GlassCard>
        )}

        {/* Lineup Pitch with Progress Glow and Feedback */}
        <View style={styles.pitchContainer}>
          <LineupPitch
            slots={displaySlots}
            selectedSlot={isReviewMode ? null : state.selectedSlot}
            onSlotPress={isReviewMode ? () => {} : selectSlot}
            isGameOver={isReviewMode || isGameOver}
            team={puzzleContent.team}
            formation={puzzleContent.formation}
            matchName={puzzleContent.match_name}
            competition={puzzleContent.competition}
            matchDate={puzzleContent.match_date}
            foundCount={foundCount}
            totalHidden={totalHidden}
            lastGuessResult={isReviewMode ? null : lastGuessResult}
            lastGuessedId={isReviewMode ? null : lastGuessedId}
            onMarkerReveal={isReviewMode ? undefined : handleMarkerReveal}
            testID="lineup-pitch"
          />
        </View>

        {/* Review mode score display */}
        {isReviewMode && attempt && (
          <View style={styles.reviewScoreContainer}>
            <Text style={styles.reviewScoreLabel}>Final Score</Text>
            <Text style={styles.reviewScoreValue}>
              {typeof attempt.score === 'number' ? attempt.score : 0}
              <Text style={styles.reviewScoreMax}>/{totalHidden || 11}</Text>
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Result Modal */}
      <StartingXIResultModal
        visible={showResultModal}
        score={state.score}
        slots={state.slots}
        matchName={puzzleContent.match_name}
        puzzleId={puzzle?.id ?? ''}
        onClose={() => {
          setShowResultModal(false);
          router.back();
        }}
        onShare={handleShare}
        testID="result-modal"
      />

      {/* Guess Input Overlay - opens when slot is selected */}
      <GuessInputOverlay
        visible={
          !isReviewMode &&
          state.selectedSlot !== null &&
          state.gameStatus === 'playing'
        }
        onSubmit={submitGuess}
        onClose={deselectSlot}
        title={getSearchTitle()}
        lastGuessIncorrect={state.lastGuessIncorrect}
        lastGuessResult={lastGuessResult}
        testID="guess-input-overlay"
      />

      {/* Ad Banner (non-premium users) */}
      <AdBanner testID="starting-xi-ad-banner" />

      {/* Success Particle Burst (screen-level absolute positioning) */}
      {showParticleBurst && particleBurstOrigin && (
        <SuccessParticleBurst
          active={showParticleBurst}
          originX={particleBurstOrigin.x}
          originY={particleBurstOrigin.y}
          onComplete={handleParticleBurstComplete}
        />
      )}
    </GameContainer>
  );
}

const styles = StyleSheet.create({
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
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  instructionsText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
  },
  pitchContainer: {
    paddingHorizontal: spacing.sm,
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
