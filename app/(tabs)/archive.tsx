import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, textStyles, spacing } from '@/theme';
import {
  useArchivePuzzles,
  useGatedNavigation,
  ArchiveList,
  GameModeFilter,
  PremiumUpsellModal,
  ArchivePuzzle,
  GameModeFilterType,
} from '@/features/archive';
import { useAds, UnlockChoiceModal } from '@/features/ads';

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
  const [filter, setFilter] = useState<GameModeFilterType>('all');
  const [lockedPuzzle, setLockedPuzzle] = useState<ArchivePuzzle | null>(null);

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
   */
  const { navigateToPuzzle } = useGatedNavigation({
    onShowPaywall: (puzzle) => setLockedPuzzle(puzzle),
  });

  /**
   * Close the unlock modal.
   */
  const handleCloseModal = useCallback(() => {
    setLockedPuzzle(null);
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
        onPuzzlePress={navigateToPuzzle}
        onLockedPress={navigateToPuzzle}
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

      {/* Unlock Modal - shows ad option for non-premium, premium-only for subscribers */}
      {lockedPuzzle && shouldShowAds ? (
        <UnlockChoiceModal
          visible={!!lockedPuzzle}
          onClose={handleCloseModal}
          puzzleId={lockedPuzzle.id}
          puzzleDate={lockedPuzzle.puzzleDate}
          onUnlockSuccess={handleUnlockSuccess}
          testID="unlock-choice-modal"
        />
      ) : (
        <PremiumUpsellModal
          visible={!!lockedPuzzle}
          onClose={handleCloseModal}
          puzzleDate={lockedPuzzle?.puzzleDate}
          testID="premium-modal"
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
