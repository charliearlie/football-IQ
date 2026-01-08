/**
 * GoalscorerRecallScreen - Main screen for Goalscorer Recall game mode.
 *
 * Displays a classic match and challenges players to name all goalscorers
 * within 60 seconds.
 */

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useStablePuzzle } from '@/features/puzzles';
import { colors, spacing, textStyles, layout } from '@/theme';
import { GameContainer } from '@/components';
import { useGoalscorerRecallGame } from '../hooks/useGoalscorerRecallGame';
import { MatchHeader } from '../components/MatchHeader';
import { Scoreboard } from '../components/Scoreboard';
import { TimerDisplay } from '../components/TimerDisplay';
import { RecallActionZone } from '../components/RecallActionZone';
import { StartOverlay } from '../components/StartOverlay';
import { GoalFlash } from '../components/GoalFlash';
import { RecallResultModal } from '../components/RecallResultModal';
import { AdBanner } from '@/features/ads';
import type { GoalscorerRecallContent } from '../types/goalscorerRecall.types';

/**
 * Props for GoalscorerRecallScreen.
 */
interface GoalscorerRecallScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's guess_the_goalscorers puzzle.
   */
  puzzleId?: string;
}

/** Approximate height of the MatchHeader GlassCard */
const MATCH_HEADER_HEIGHT = 140;

export function GoalscorerRecallScreen({ puzzleId }: GoalscorerRecallScreenProps) {
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'guess_the_goalscorers');
  const [lastFoundGoalId, setLastFoundGoalId] = useState<string | undefined>();
  const scrollRef = useRef<ScrollView>(null);

  // Keyboard visibility for collapsible match header animation
  const keyboardVisible = useSharedValue(0);

  // Listen for keyboard show/hide events (for match header animation)
  useEffect(() => {
    // Use 'Will' events on iOS for smoother animation, 'Did' on Android
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardVisible.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardVisible.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardVisible]);

  // Animated style for collapsible match header
  const matchHeaderAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(keyboardVisible.value, [0, 1], [MATCH_HEADER_HEIGHT, 0]),
    opacity: interpolate(keyboardVisible.value, [0, 0.3], [1, 0]),
    overflow: 'hidden' as const,
    marginBottom: interpolate(keyboardVisible.value, [0, 1], [spacing.sm, 0]),
  }));

  const {
    state,
    timeRemaining,
    totalScorers,
    foundScorersCount,
    homeGoals,
    awayGoals,
    startGame,
    submitGuess,
    setCurrentGuess,
    giveUp,
    resetGame,
  } = useGoalscorerRecallGame(puzzle);

  // Track when a new goal is found for animation
  const handleGuessCorrect = () => {
    // Find the most recently found goal
    const justFound = state.goals.find((g) => g.found && g.id !== lastFoundGoalId);
    if (justFound) {
      setLastFoundGoalId(justFound.id);
    }
  };

  // Auto-scroll when a correct guess is made
  useEffect(() => {
    if (state.lastGuessCorrect) {
      // Small delay to allow the UI to update first
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.lastGuessCorrect]);

  // Loading state
  if (isLoading) {
    return (
      <GameContainer
        title="Goalscorer Recall"
        collapsible
        keyboardAvoiding={false}
        testID="goalscorer-recall-screen"
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
  if (!puzzle) {
    return (
      <GameContainer
        title="Goalscorer Recall"
        collapsible
        keyboardAvoiding={false}
        testID="goalscorer-recall-screen"
      >
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Goalscorer Recall challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  const content = puzzle.content as GoalscorerRecallContent;
  const isPlaying = state.gameStatus === 'playing';
  const isIdle = state.gameStatus === 'idle';
  const isGameOver = state.gameStatus === 'won' || state.gameStatus === 'lost';

  const matchInfo = {
    homeTeam: content.home_team,
    awayTeam: content.away_team,
    homeScore: content.home_score,
    awayScore: content.away_score,
    competition: content.competition,
    matchDate: content.match_date,
  };

  return (
    <GameContainer
      title="Goalscorer Recall"
      collapsible
      keyboardAvoiding={false}
      testID="goalscorer-recall-screen"
    >
      {/* Match Header - Collapses when keyboard is visible */}
      <Animated.View style={[styles.matchHeaderContainer, matchHeaderAnimatedStyle]}>
        <MatchHeader
          homeTeam={content.home_team}
          awayTeam={content.away_team}
          homeScore={content.home_score}
          awayScore={content.away_score}
          competition={content.competition}
          matchDate={content.match_date}
        />
      </Animated.View>

      {/* Timer */}
      <TimerDisplay
        timeRemaining={timeRemaining}
        isRunning={isPlaying}
      />

      {/* Progress indicator */}
      <Text style={styles.progressText}>
        <Text style={styles.progressHighlight}>{foundScorersCount}</Text>
        {' / '}
        <Text style={styles.progressHighlight}>{totalScorers}</Text>
        {' scorers found'}
      </Text>

      {/* Scoreboard */}
      <View style={styles.scoreboardContainer}>
        <Scoreboard
          homeTeam={content.home_team}
          awayTeam={content.away_team}
          homeGoals={homeGoals}
          awayGoals={awayGoals}
          lastFoundGoalId={lastFoundGoalId}
          scrollRef={scrollRef}
        />
      </View>

      {/* Action Zone */}
      <RecallActionZone
        currentGuess={state.currentGuess}
        onGuessChange={setCurrentGuess}
        onSubmit={submitGuess}
        onGiveUp={giveUp}
        isPlaying={isPlaying}
        showError={state.lastGuessIncorrect}
      />

      {/* Start Overlay */}
      {isIdle && (
        <StartOverlay
          totalScorers={totalScorers}
          onStart={startGame}
        />
      )}

      {/* Goal Flash */}
      <GoalFlash
        visible={state.lastGuessCorrect}
      />

      {/* Result Modal */}
      <RecallResultModal
        visible={isGameOver}
        score={state.score}
        goals={state.goals}
        matchInfo={matchInfo}
        puzzleDate={puzzle.puzzle_date}
        onContinue={() => router.back()}
      />

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="goalscorer-recall-ad-banner" />
    </GameContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: layout.screenPadding,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  noPuzzleText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  progressText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressHighlight: {
    color: colors.pitchGreen,
    fontWeight: '600',
  },
  matchHeaderContainer: {
    paddingHorizontal: layout.screenPadding,
    // marginBottom is animated based on keyboard visibility
  },
  scoreboardContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
});
