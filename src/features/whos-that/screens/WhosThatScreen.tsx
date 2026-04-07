/**
 * Who's That? Game Screen
 *
 * Players guess a footballer in up to 6 tries.
 * Each guess reveals colour-coded feedback for 5 attributes.
 */

import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import {
  useStablePuzzle,
  useOnboarding,
  GameIntroScreen,
} from '@/features/puzzles';
import { colors, spacing, textStyles } from '@/theme';
import { GameContainer, ElevatedButton } from '@/components';
import { AdBanner } from '@/features/ads';
import { UnifiedPlayer } from '@/services/oracle/types';
import { supabase } from '@/lib/supabase';
import { nationalityCodeToName } from '../utils/nationalities';
import { useWhosThat } from '../hooks/useWhosThat';
import { WhosThatGrid } from '../components/WhosThatGrid';
import { WhosThatActionZone } from '../components/WhosThatActionZone';
import { WhosThatResultModal } from '../components/WhosThatResultModal';

interface WhosThatScreenProps {
  puzzleId?: string;
  isReviewMode?: boolean;
}

export function WhosThatScreen({ puzzleId, isReviewMode = false }: WhosThatScreenProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  // Onboarding state
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding('whos-that');

  // Puzzle loading
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'whos-that');

  // Game hook
  const {
    state,
    whosThatContent,
    isGameOver,
    remainingGuesses,
    submitGuess,
    shareResult,
  } = useWhosThat(puzzle, isFocused);

  // Modal state — user taps "See how you scored" to open (no auto-open)
  const [showResultModal, setShowResultModal] = useState(false);

  // Track keyboard visibility
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Track retired-player rejection for inline message
  const [retiredPlayerName, setRetiredPlayerName] = useState<string | null>(null);

  // Handlers
  const handleBackToHome = useCallback(() => {
    router.back();
  }, [router]);

  const handlePlayerSelect = useCallback(
    async (player: UnifiedPlayer) => {
      setRetiredPlayerName(null);
      const nationalityName = nationalityCodeToName(player.nationality_code ?? '');
      let birthYear = player.birth_year ?? 0;
      const position = player.position_category ?? '';

      // Fetch club + league from Supabase for richer feedback
      let club = '';
      let league = '';
      try {
        const { data } = await supabase.rpc('get_balldle_attributes', {
          p_player_id: player.id,
        });
        if (data) {
          const attrs = typeof data === 'string' ? JSON.parse(data) : data;
          club = attrs.club ?? '';
          league = attrs.league ?? '';
          if (attrs.birth_year) birthYear = attrs.birth_year;
          // Clean up Wikidata-style club names (e.g., "Arsenal F.C." → "Arsenal")
          club = club.replace(/ F\.?C\.?$/i, '').replace(/ A\.?F\.?C\.?$/i, '').trim();
        }
      } catch (err) {
        console.warn('[WhosThat] Failed to fetch player attributes:', err);
      }

      // Reject retired players (no current club)
      if (!club) {
        setRetiredPlayerName(player.name);
        return;
      }

      submitGuess(player.name, player.id, {
        club,
        league,
        nationality: nationalityName,
        position,
        birthYear,
      });
    },
    [submitGuess]
  );

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  // Onboarding loading state
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Who's That?" testID="whos-that-screen">
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
        gameMode="whos-that"
        onStart={completeIntro}
        testID="whos-that-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Who's That?" testID="whos-that-screen">
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
  if (!puzzle || !whosThatContent) {
    return (
      <GameContainer title="Who's That?" testID="whos-that-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Game Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Who's That?" testID="whos-that-screen">
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Scrollable grid area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>
              Guess the footballer in 6 tries
            </Text>
            <Text style={styles.disclaimer}>
              Player data accurate as of 4 April 2026
            </Text>
          </View>

          {/* Attribute legend */}
          <View style={styles.legend}>
            {['Club', 'League', 'Nat.', 'Pos.', 'Born'].map((label) => (
              <Text key={label} style={styles.legendLabel}>
                {label}
              </Text>
            ))}
          </View>

          {/* Guess grid */}
          <WhosThatGrid
            guesses={state.guesses}
            testID="whos-that-grid"
          />

          {/* Inline result on game over */}
          {isGameOver && (
            <View style={styles.answerReveal}>
              <Text style={styles.answerLabel}>
                {state.score?.won ? 'Correct!' : 'The answer was'}
              </Text>
              <Text style={[styles.answerName, !state.score?.won && styles.answerNameLoss]}>
                {whosThatContent.answer.player_name}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Zone */}
        {isGameOver ? (
          <View style={styles.gameOverActionZone}>
            <ElevatedButton
              title="See how you scored"
              onPress={() => setShowResultModal(true)}
              fullWidth
              testID="see-score-button"
            />
          </View>
        ) : (
          <>
            {retiredPlayerName && (
              <View style={styles.retiredWarning}>
                <Text style={styles.retiredWarningText}>
                  {retiredPlayerName} doesn't have a current club — try an active player
                </Text>
              </View>
            )}
            <WhosThatActionZone
              onPlayerSelect={handlePlayerSelect}
              shouldShake={state.lastGuessIncorrect}
              isGameOver={isGameOver}
              remainingGuesses={remainingGuesses}
              maxGuesses={state.maxGuesses}
              testID="action-zone"
            />
          </>
        )}

        {/* Ad Banner */}
        {!keyboardVisible && !isGameOver && (
          <AdBanner testID="whos-that-ad-banner" />
        )}
      </KeyboardAvoidingView>

      {/* Result Modal */}
      {state.score && (
        <WhosThatResultModal
          visible={showResultModal}
          score={state.score}
          correctPlayerName={whosThatContent.answer.player_name}
          guesses={state.guesses}
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  headerSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  disclaimer: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.sm,
  },
  legendLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerReveal: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(46, 252, 93, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 252, 93, 0.2)',
  },
  answerLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  answerName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: colors.pitchGreen,
    marginTop: 4,
  },
  answerNameLoss: {
    color: colors.floodlightWhite,
  },
  retiredWarning: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retiredWarningText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  gameOverActionZone: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
  },
});
