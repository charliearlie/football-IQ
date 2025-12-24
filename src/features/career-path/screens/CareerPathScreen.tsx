import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePuzzle } from '@/features/puzzles';
import { colors, spacing, textStyles, layout } from '@/theme';
import { useCareerPathGame } from '../hooks/useCareerPathGame';
import { CareerStepCard } from '../components/CareerStepCard';
import { ActionZone } from '../components/ActionZone';
import { GameResultModal } from '../components/GameResultModal';
import { CareerStep } from '../types/careerPath.types';

/**
 * CareerPathScreen - The main Career Path game screen.
 *
 * Displays a player's career as a series of sequential clues.
 * Players guess the footballer, with each wrong guess revealing
 * the next career step as a penalty.
 */
export function CareerPathScreen() {
  const insets = useSafeAreaInsets();
  const { puzzle, isLoading } = usePuzzle('career_path');
  const {
    state,
    careerSteps,
    answer,
    totalSteps,
    revealNext,
    submitGuess,
    setCurrentGuess,
    shareResult,
    flatListRef,
  } = useCareerPathGame(puzzle);

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
  if (!puzzle || careerSteps.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={textStyles.h2}>No Puzzle Today</Text>
        <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
          Check back later for today's Career Path challenge
        </Text>
      </View>
    );
  }

  const isGameOver = state.gameStatus !== 'playing';
  const canRevealMore =
    state.revealedCount < totalSteps && state.gameStatus === 'playing';

  const renderStep = ({ item, index }: { item: CareerStep; index: number }) => {
    const stepNumber = index + 1;
    const isRevealed = stepNumber <= state.revealedCount;
    const isLatest = stepNumber === state.revealedCount && state.gameStatus === 'playing';

    return (
      <CareerStepCard
        step={item}
        stepNumber={stepNumber}
        isRevealed={isRevealed}
        isLatest={isLatest}
        testID={`step-${stepNumber}`}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Career Path</Text>
        <Text style={[textStyles.body, styles.progress]}>
          Step{' '}
          <Text style={styles.progressHighlight}>{state.revealedCount}</Text>
          {' '}of{' '}
          <Text style={styles.progressHighlight}>{totalSteps}</Text>
        </Text>
      </View>

      {/* Career Steps List */}
      <FlatList
        ref={flatListRef}
        data={careerSteps}
        renderItem={renderStep}
        keyExtractor={(_, index) => `step-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={5}
        testID="career-steps-list"
      />

      {/* Game Result Modal */}
      {state.score && (
        <GameResultModal
          visible={isGameOver}
          won={state.gameStatus === 'won'}
          score={state.score}
          correctAnswer={answer}
          totalSteps={totalSteps}
          onShare={shareResult}
          testID="game-result-modal"
        />
      )}

      {/* Action Zone */}
      <ActionZone
        currentGuess={state.currentGuess}
        onGuessChange={setCurrentGuess}
        onSubmit={submitGuess}
        onRevealNext={revealNext}
        canRevealMore={canRevealMore}
        shouldShake={state.lastGuessIncorrect}
        isGameOver={isGameOver}
        testID="action-zone"
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
    paddingBottom: spacing.md,
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
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    gap: layout.listGap,
  },
});
