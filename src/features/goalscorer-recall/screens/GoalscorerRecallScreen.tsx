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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const MATCH_HEADER_HEIGHT = 90;

export function GoalscorerRecallScreen({ puzzleId }: GoalscorerRecallScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'guess_the_goalscorers');
  const [lastFoundGoalId, setLastFoundGoalId] = useState<string | undefined>();
  const scrollRef = useRef<ScrollView>(null);

  // Keyboard visibility for collapsible header animation
  const keyboardVisible = useSharedValue(0);

  // Listen for keyboard show/hide events
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
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={[textStyles.body, styles.loadingText]}>
          Loading puzzle...
        </Text>
      </View>
    );
  }

  // No puzzle available
  if (!puzzle) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={textStyles.h2}>No Puzzle Today</Text>
        <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
          Check back later for today's Goalscorer Recall challenge
        </Text>
      </View>
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
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Goalscorer Recall</Text>
        <Text style={[textStyles.body, styles.progress]}>
          <Text style={styles.progressHighlight}>{foundScorersCount}</Text>
          {' / '}
          <Text style={styles.progressHighlight}>{totalScorers}</Text>
          {' scorers'}
        </Text>
      </View>

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
    </KeyboardAvoidingView>
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
    padding: layout.screenPadding,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  noPuzzleText: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    color: colors.textSecondary,
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
