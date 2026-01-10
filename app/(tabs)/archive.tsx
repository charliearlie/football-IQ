import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, textStyles, spacing } from '@/theme';
import {
  useArchivePuzzles,
  useGatedNavigation,
  ArchiveList,
  GameModeFilter,
  ArchivePuzzle,
  GameModeFilterType,
} from '@/features/archive';
import { useAds, UnlockChoiceModal } from '@/features/ads';
import { CompletedGameModal } from '@/features/home';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Route map for each game mode.
 */
const ROUTE_MAP: Record<GameMode, string> = {
  career_path: 'career-path',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  tic_tac_toe: 'tic-tac-toe',
  topical_quiz: 'topical-quiz',
};

/**
 * Archive Screen
 *
 * Browse historical puzzles with:
 * - Game mode filter (horizontal scroll)
 * - Month-grouped puzzle list
 * - Premium gating (locked puzzles for >7 days)
 * - Pull-to-refresh
 * - Infinite scroll pagination
 */
export default function ArchiveScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<GameModeFilterType>('all');
  const [lockedPuzzle, setLockedPuzzle] = useState<ArchivePuzzle | null>(null);
  const [completedPuzzle, setCompletedPuzzle] = useState<ArchivePuzzle | null>(null);

  // Check if user should see ads (non-premium users)
  const { shouldShowAds } = useAds();

  const {
    sections,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  } = useArchivePuzzles(filter);

  /**
   * Use gated navigation hook for premium access control.
   * This centralizes the navigation/paywall logic.
   *
   * For ad-eligible users: show UnlockChoiceModal (ad or premium)
   * For others: navigate to native premium modal
   */
  const { navigateToPuzzle } = useGatedNavigation({
    onShowPaywall: (puzzle) => {
      if (shouldShowAds) {
        // Show choice modal for ad-eligible users
        setLockedPuzzle(puzzle);
      } else {
        // Navigate to native premium modal for others
        router.push({
          pathname: '/premium-modal',
          params: { puzzleDate: puzzle.puzzleDate, mode: 'blocked' },
        });
      }
    },
  });

  /**
   * Handle puzzle press - show result modal for completed games,
   * otherwise use gated navigation.
   */
  const handlePuzzlePress = useCallback(
    (puzzle: ArchivePuzzle) => {
      // Show results modal for completed games
      if (puzzle.status === 'done' && puzzle.attempt) {
        setCompletedPuzzle(puzzle);
        return;
      }
      // Navigate (or show paywall) for play/resume
      navigateToPuzzle(puzzle);
    },
    [navigateToPuzzle]
  );

  /**
   * Close the unlock modal.
   */
  const handleCloseModal = useCallback(() => {
    setLockedPuzzle(null);
  }, []);

  /**
   * Close the completed game modal.
   */
  const handleCloseCompletedModal = useCallback(() => {
    setCompletedPuzzle(null);
  }, []);

  /**
   * Handle successful ad unlock - refresh list and close modal.
   */
  const handleUnlockSuccess = useCallback(() => {
    setLockedPuzzle(null);
    // The useArchivePuzzles hook will automatically recheck lock status
    // when adUnlocks changes, so we don't need to manually refresh
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Archive</Text>
      </View>

      {/* Archive List with Filter */}
      <ArchiveList
        sections={sections}
        onPuzzlePress={handlePuzzlePress}
        onLockedPress={handlePuzzlePress}
        onEndReached={loadMore}
        onRefresh={refresh}
        refreshing={isRefreshing}
        isLoading={isLoading}
        hasMore={hasMore}
        ListHeaderComponent={
          <View style={styles.filterContainer}>
            <GameModeFilter
              selected={filter}
              onSelect={setFilter}
              testID="archive-filter"
            />
          </View>
        }
        testID="archive-list"
      />

      {/* Unlock Choice Modal - shows ad option for non-premium users */}
      {lockedPuzzle && (
        <UnlockChoiceModal
          visible={!!lockedPuzzle}
          onClose={handleCloseModal}
          puzzleId={lockedPuzzle.id}
          puzzleDate={lockedPuzzle.puzzleDate}
          onUnlockSuccess={handleUnlockSuccess}
          testID="unlock-choice-modal"
        />
      )}

      {/* Completed Game Modal - shows result for done games */}
      {completedPuzzle && completedPuzzle.attempt && (
        <CompletedGameModal
          visible={true}
          gameMode={completedPuzzle.gameMode}
          attempt={completedPuzzle.attempt}
          onClose={handleCloseCompletedModal}
          onReview={() => {
            const route = ROUTE_MAP[completedPuzzle.gameMode];
            setCompletedPuzzle(null);
            router.push({
              pathname: `/${route}/[puzzleId]`,
              params: { puzzleId: completedPuzzle.id, review: 'true' },
            } as never);
          }}
          testID="archive-completed-modal"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
});
