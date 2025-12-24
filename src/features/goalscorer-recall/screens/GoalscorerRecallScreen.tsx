/**
 * GoalscorerRecallScreen - Main screen for Goalscorer Recall game mode.
 *
 * Displays a classic match and challenges players to name all goalscorers
 * within 60 seconds.
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { usePuzzle } from '@/features/puzzles';
import { colors, spacing, textStyles, layout } from '@/theme';
import { useGoalscorerRecallGame } from '../hooks/useGoalscorerRecallGame';
import { MatchHeader } from '../components/MatchHeader';
import { Scoreboard } from '../components/Scoreboard';
import { TimerDisplay } from '../components/TimerDisplay';
import { RecallActionZone } from '../components/RecallActionZone';
import { StartOverlay } from '../components/StartOverlay';
import { GoalFlash } from '../components/GoalFlash';
import { RecallResultModal } from '../components/RecallResultModal';
import type { GoalscorerRecallContent } from '../types/goalscorerRecall.types';

export function GoalscorerRecallScreen() {
  const insets = useSafeAreaInsets();
  const { puzzle, isLoading } = usePuzzle('guess_the_goalscorers');
  const [lastFoundGoalId, setLastFoundGoalId] = useState<string | undefined>();

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      {/* Match Header */}
      <View style={styles.matchHeaderContainer}>
        <MatchHeader
          homeTeam={content.home_team}
          awayTeam={content.away_team}
          homeScore={content.home_score}
          awayScore={content.away_score}
          competition={content.competition}
          matchDate={content.match_date}
        />
      </View>

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
        onContinue={resetGame}
      />
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
    marginBottom: spacing.sm,
  },
  scoreboardContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
});
