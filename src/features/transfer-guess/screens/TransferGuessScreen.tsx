import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStablePuzzle } from '@/features/puzzles';
import { colors, spacing, textStyles, layout } from '@/theme';
import { GameContainer } from '@/components';
import { useTransferGuessGame } from '../hooks/useTransferGuessGame';
import { TransferCard } from '../components/TransferCard';
import { HintsSection } from '../components/HintsSection';
import { TransferActionZone } from '../components/TransferActionZone';
import { TransferResultModal } from '../components/TransferResultModal';
import { AdBanner } from '@/features/ads';

/**
 * Props for TransferGuessScreen.
 */
interface TransferGuessScreenProps {
  /**
   * Optional puzzle ID to load a specific puzzle.
   * If not provided, loads today's guess_the_transfer puzzle.
   */
  puzzleId?: string;
}

/**
 * TransferGuessScreen - The main Guess the Transfer game screen.
 *
 * Displays transfer details (clubs, year, fee) and allows players
 * to guess the footballer. Players can reveal hints for point penalties.
 */
export function TransferGuessScreen({ puzzleId }: TransferGuessScreenProps) {
  const router = useRouter();
  // Use puzzleId if provided, otherwise fall back to game mode lookup
  // useStablePuzzle caches the puzzle to prevent background sync from disrupting gameplay
  const { puzzle, isLoading } = useStablePuzzle(puzzleId ?? 'guess_the_transfer');
  const {
    state,
    transferContent,
    answer,
    hints,
    canRevealHint,
    guessesRemaining,
    isGameOver,
    revealHint,
    submitGuess,
    giveUp,
    setCurrentGuess,
    shareResult,
  } = useTransferGuessGame(puzzle);

  // Loading state
  if (isLoading) {
    return (
      <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
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
  if (!puzzle || !transferContent) {
    return (
      <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
        <View style={styles.centered}>
          <Text style={textStyles.h2}>No Puzzle Today</Text>
          <Text style={[textStyles.bodySmall, styles.noPuzzleText]}>
            Check back later for today's Transfer challenge
          </Text>
        </View>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Guess the Transfer" testID="transfer-guess-screen">
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Transfer Card */}
        <TransferCard
          fromClub={transferContent.from_club}
          toClub={transferContent.to_club}
          year={transferContent.year}
          fee={transferContent.fee}
          testID="transfer-card"
        />

        {/* Hints Section */}
        <HintsSection
          hints={hints as [string, string, string]}
          hintsRevealed={state.hintsRevealed}
          testID="hints-section"
        />

        {/* Spacer for action zone */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Game Result Modal */}
      {state.score && (
        <TransferResultModal
          visible={isGameOver}
          won={state.gameStatus === 'won'}
          score={state.score}
          correctAnswer={answer}
          onShare={shareResult}
          onClose={() => router.back()}
          testID="transfer-result-modal"
        />
      )}

      {/* Action Zone */}
      <TransferActionZone
        currentGuess={state.currentGuess}
        onGuessChange={setCurrentGuess}
        onSubmit={submitGuess}
        onRevealHint={revealHint}
        onGiveUp={giveUp}
        canRevealHint={canRevealHint}
        guessesRemaining={guessesRemaining}
        shouldShake={state.lastGuessIncorrect}
        isGameOver={isGameOver}
        incorrectGuesses={state.guesses.length}
        testID="action-zone"
      />

      {/* Banner Ad (non-premium only) */}
      <AdBanner testID="transfer-guess-ad-banner" />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
