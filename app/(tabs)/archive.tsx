import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, textStyles, spacing } from '@/theme';
import {
  useArchivePuzzles,
  ArchiveList,
  GameModeFilter,
  PremiumUpsellModal,
  ArchivePuzzle,
  GameModeFilterType,
} from '@/features/archive';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Route map for each game mode.
 */
const ROUTE_MAP: Record<GameMode, string> = {
  career_path: 'career-path',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  tic_tac_toe: 'tic-tac-toe',
  topical_quiz: '', // Coming soon - no route
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

  const {
    sections,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  } = useArchivePuzzles(filter);

  /**
   * Handle press on an unlocked puzzle - navigate to game screen.
   */
  const handlePuzzlePress = useCallback(
    (puzzle: ArchivePuzzle) => {
      const route = ROUTE_MAP[puzzle.gameMode];
      if (route) {
        // Navigate to dynamic route with puzzle ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/${route}/${puzzle.id}` as any);
      }
    },
    [router]
  );

  /**
   * Handle press on a locked puzzle - show premium upsell modal.
   */
  const handleLockedPress = useCallback((puzzle: ArchivePuzzle) => {
    setLockedPuzzle(puzzle);
  }, []);

  /**
   * Close the premium upsell modal.
   */
  const handleCloseModal = useCallback(() => {
    setLockedPuzzle(null);
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
        onLockedPress={handleLockedPress}
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

      {/* Premium Upsell Modal */}
      <PremiumUpsellModal
        visible={!!lockedPuzzle}
        onClose={handleCloseModal}
        puzzleDate={lockedPuzzle?.puzzleDate}
        testID="premium-modal"
      />
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
