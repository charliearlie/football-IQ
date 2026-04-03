/**
 * Who Am I? Game Screen
 *
 * Players guess a footballer from 5 progressive clues.
 * Each clue gets more obvious. Fewer clues = higher score.
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
import { GameContainer, ConfirmationModal } from '@/components';
import { AdBanner } from '@/features/ads';
import { UnifiedPlayer } from '@/services/oracle/types';
import { useWhoAmIGame } from '../hooks/useWhoAmIGame';
import { ClueCard } from '../components/ClueCard';
import { WhoAmIActionZone } from '../components/WhoAmIActionZone';
import { WhoAmIResultModal } from '../components/WhoAmIResultModal';

interface WhoAmIScreenProps {
  puzzleId?: string;
  isReviewMode?: boolean;
}

export function WhoAmIScreen({
  puzzleId,
  isReviewMode = false,
}: WhoAmIScreenProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  // Onboarding state
  const {
    shouldShowIntro,
    isReady: isOnboardingReady,
    completeIntro,
  } = useOnboarding('who_am_i');

  // Puzzle loading
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'who_am_i');

  // Game hook
  const {
    state,
    whoAmIContent,
    visibleClues,
    isGameOver,
    canRevealMore,
    totalClues,
    submitGuess,
    revealNextClue,
    giveUp,
    shareResult,
  } = useWhoAmIGame(puzzle, isFocused);

  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

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
      submitGuess(player.name, player.id);
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

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
    handleBackToHome();
  }, [handleBackToHome]);

  // Onboarding loading state
  if (!isOnboardingReady) {
    return (
      <GameContainer title="Who Am I?" testID="who-am-i-screen">
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
        gameMode="who_am_i"
        onStart={completeIntro}
        testID="who-am-i-intro"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Who Am I?" testID="who-am-i-screen">
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
  if (!puzzle || !whoAmIContent) {
    return (
      <GameContainer title="Who Am I?" testID="who-am-i-screen">
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
    <GameContainer title="Who Am I?" testID="who-am-i-screen">
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Scrollable clue area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Who Am I?</Text>
            <Text style={styles.headerSubtitle}>
              Guess the footballer from the clues
            </Text>
          </View>

          {/* Clue cards */}
          {visibleClues.map((clue, index) => (
            <ClueCard
              key={clue.number}
              clue={clue}
              index={index}
              isLatest={index === visibleClues.length - 1}
              testID={`clue-${clue.number}`}
            />
          ))}

          {/* Incorrect guesses */}
          {state.guesses.length > 0 && !isGameOver && (
            <View style={styles.guessHistory}>
              <Text style={styles.guessHistoryLabel}>
                Incorrect: {state.guesses.join(', ')}
              </Text>
            </View>
          )}

          {/* Answer revealed on game over */}
          {isGameOver && !state.score?.won && (
            <View style={styles.answerReveal}>
              <Text style={styles.answerLabel}>The answer was</Text>
              <Text style={styles.answerName}>
                {whoAmIContent.correct_player_name}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Zone */}
        <WhoAmIActionZone
          onPlayerSelect={handlePlayerSelect}
          onTextSubmit={handleTextSubmit}
          onRevealNextClue={revealNextClue}
          canRevealMore={canRevealMore}
          shouldShake={state.lastGuessIncorrect}
          isGameOver={isGameOver}
          onGiveUp={handleGiveUpPress}
          cluesRevealed={state.cluesRevealed}
          totalClues={totalClues}
          testID="action-zone"
        />

        {/* Ad Banner */}
        {!keyboardVisible && !isGameOver && (
          <AdBanner testID="who-am-i-ad-banner" />
        )}
      </KeyboardAvoidingView>

      {/* Result Modal */}
      {state.score && (
        <WhoAmIResultModal
          visible={showResultModal}
          score={state.score}
          correctPlayerName={whoAmIContent.correct_player_name}
          puzzleId={puzzle.id}
          puzzleDate={puzzle.puzzle_date}
          onShare={shareResult}
          onClose={handleCloseModal}
          gaveUp={state.gameStatus === 'revealed'}
          funFact={whoAmIContent.fun_fact}
          showNextPuzzle={!isReviewMode && puzzle?.puzzle_date === new Date().toISOString().split('T')[0]}
          testID="result-modal"
        />
      )}

      {/* Give Up Confirmation Modal */}
      <ConfirmationModal
        visible={showGiveUpModal}
        title="Give Up?"
        message="Are you sure you want to give up? The answer will be revealed."
        confirmLabel="Give Up"
        cancelLabel="Keep Trying"
        onConfirm={handleGiveUpConfirm}
        onCancel={handleGiveUpCancel}
        variant="danger"
        testID="give-up-modal"
      />
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
    color: colors.cardYellow,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  guessHistory: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  guessHistoryLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: colors.redCard,
    opacity: 0.7,
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
