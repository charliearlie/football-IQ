/**
 * Balldle Game Screen
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
import { GameContainer } from '@/components';
import { AdBanner } from '@/features/ads';
import { UnifiedPlayer } from '@/services/oracle/types';
import { useBalldle } from '../hooks/useBalldle';
import { BalldeGrid } from '../components/BalldeGrid';
import { BalldeActionZone } from '../components/BalldeActionZone';
import { BalldeResultModal } from '../components/BalldeResultModal';

interface BalldeScreenProps {
  puzzleId?: string;
  isReviewMode?: boolean;
}

export function BalldeScreen({ puzzleId, isReviewMode = false }: BalldeScreenProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  // Onboarding state
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding('balldle');

  // Puzzle loading
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'balldle');

  // Game hook
  const {
    state,
    balldeContent,
    isGameOver,
    remainingGuesses,
    submitGuess,
    shareResult,
  } = useBalldle(puzzle, isFocused);

  // Modal state
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

  // Show modal after game ends
  useEffect(() => {
    if (!isGameOver || showResultModal) return;

    const timer = setTimeout(() => {
      setShowResultModal(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [isGameOver, showResultModal]);

  // Handlers
  const handleBackToHome = useCallback(() => {
    router.back();
  }, [router]);

  const handlePlayerSelect = useCallback(
    (player: UnifiedPlayer) => {
      // PlayerAutocomplete returns UnifiedPlayer with position_category, birth_year, etc.
      // We pass the player id and name; attribute data must come from a richer source.
      // For now we pass what the oracle provides; the hook will derive age from birth_year
      // if balldeContent has a matching player. In practice, the CMS answer attributes
      // are used for feedback — we supply whatever we have from the autocomplete.
      const currentYear = new Date().getFullYear();
      submitGuess(player.name, player.id, {
        club: '',        // oracle/unified player has no club data — game logic handles this
        league: '',
        nationality: player.nationality_code ?? '',
        position: player.position_category ?? '',
        age: player.birth_year != null ? currentYear - player.birth_year : 0,
      });
    },
    [submitGuess]
  );

  const handleTextSubmit = useCallback(
    (text: string) => {
      if (text.trim()) {
        submitGuess(text.trim());
      }
    },
    [submitGuess]
  );

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
    handleBackToHome();
  }, [handleBackToHome]);

  // Onboarding loading state
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Balldle" testID="balldle-screen">
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
        gameMode="balldle"
        onStart={completeIntro}
        testID="balldle-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Balldle" testID="balldle-screen">
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
  if (!puzzle || !balldeContent) {
    return (
      <GameContainer title="Balldle" testID="balldle-screen">
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
    <GameContainer title="Balldle" testID="balldle-screen">
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
            <Text style={styles.headerTitle}>BALLDLE</Text>
            <Text style={styles.headerSubtitle}>
              Guess the footballer in 6 tries
            </Text>
          </View>

          {/* Attribute legend */}
          <View style={styles.legend}>
            {['Club', 'League', 'Nat.', 'Pos.', 'Age'].map((label) => (
              <Text key={label} style={styles.legendLabel}>
                {label}
              </Text>
            ))}
          </View>

          {/* Guess grid */}
          <BalldeGrid
            guesses={state.guesses}
            testID="balldle-grid"
          />

          {/* Answer revealed on game over (lost) */}
          {isGameOver && !state.score?.won && (
            <View style={styles.answerReveal}>
              <Text style={styles.answerLabel}>The answer was</Text>
              <Text style={styles.answerName}>
                {balldeContent.answer.player_name}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Zone */}
        <BalldeActionZone
          onPlayerSelect={handlePlayerSelect}
          onTextSubmit={handleTextSubmit}
          shouldShake={state.lastGuessIncorrect}
          isGameOver={isGameOver}
          remainingGuesses={remainingGuesses}
          maxGuesses={state.maxGuesses}
          testID="action-zone"
        />

        {/* Ad Banner */}
        {!keyboardVisible && !isGameOver && (
          <AdBanner testID="balldle-ad-banner" />
        )}
      </KeyboardAvoidingView>

      {/* Result Modal */}
      {state.score && (
        <BalldeResultModal
          visible={showResultModal}
          score={state.score}
          correctPlayerName={balldeContent.answer.player_name}
          guesses={state.guesses}
          puzzleId={puzzle.id}
          puzzleDate={puzzle.puzzle_date}
          onShare={shareResult}
          onClose={handleCloseModal}
          showNextPuzzle={!isReviewMode}
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
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: colors.pitchGreen,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
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
});
