import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, textStyles, spacing } from '@/theme';
import {
  useArchivePuzzles,
  useGatedNavigation,
  ArchiveList,
  GameModeFilter,
  ArchivePuzzle,
  ArchiveSection,
  GameModeFilterType,
  GAME_MODE_ROUTES,
} from '@/features/archive';
import { useAds, UnlockChoiceModal, PremiumUpsellBanner } from '@/features/ads';
import { CompletedGameModal } from '@/features/home';

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
  // Accept filterDate param from calendar navigation (for deep linking)
  const { filterDate } = useLocalSearchParams<{ filterDate?: string }>();
  const [filter, setFilter] = useState<GameModeFilterType>('all');
  const [lockedPuzzle, setLockedPuzzle] = useState<ArchivePuzzle | null>(null);
  const [completedPuzzle, setCompletedPuzzle] = useState<ArchivePuzzle | null>(null);

  // Ref for scrolling to specific date
  const listRef = useRef<SectionList<ArchivePuzzle, ArchiveSection>>(null);
  const hasScrolledToDate = useRef(false);

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

  // Scroll to target date when coming from calendar
  useEffect(() => {
    if (!filterDate || hasScrolledToDate.current || sections.length === 0 || isLoading) return;

    // Find section index for the filter date's month (YYYY-MM)
    const targetMonth = filterDate.substring(0, 7);
    const sectionIndex = sections.findIndex((section) => {
      const firstPuzzle = section.data[0];
      return firstPuzzle?.puzzleDate.startsWith(targetMonth);
    });

    if (sectionIndex >= 0 && listRef.current) {
      // Use InteractionManager to wait for animations/layout to complete
      // This is more reliable than arbitrary setTimeout
      const scrollTask = InteractionManager.runAfterInteractions(() => {
        // Verify listRef still exists and sections haven't changed
        if (listRef.current && sections.length > sectionIndex) {
          listRef.current.scrollToLocation({
            sectionIndex,
            itemIndex: 0,
            viewOffset: 0,
            animated: true,
          });
        }
      });
      hasScrolledToDate.current = true;

      // Cleanup if effect re-runs before interaction completes
      return () => scrollTask.cancel();
    }
  }, [filterDate, sections, isLoading]);

  // Reset scroll flag when filterDate changes
  useEffect(() => {
    hasScrolledToDate.current = false;
  }, [filterDate]);

  // NUCLEAR OPTION: Refresh archive list when screen comes into focus
  // This ensures unlocked puzzles show correct state after returning from game
  // No state synchronization - just fresh data from database
  useFocusEffect(
    useCallback(() => {
      console.log('[Archive] Screen focused, refreshing list');
      refresh();
    }, [refresh])
  );

  /**
   * Use gated navigation hook for premium access control.
   * This centralizes the navigation/paywall logic.
   *
   * For ad-eligible users: show UnlockChoiceModal (ad or premium)
   * For others: navigate to native premium modal
   */
  const { navigateToPuzzle } = useGatedNavigation({
    onShowPaywall: (puzzle) => {
      console.log('[Archive] onShowPaywall called:', {
        puzzleId: puzzle.id,
        shouldShowAds,
        isLocked: puzzle.isLocked,
      });

      // Defensive check: only show modal if puzzle is actually locked
      if (!puzzle.isLocked) {
        console.warn('[Archive] onShowPaywall called for unlocked puzzle, ignoring');
        return;
      }

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Archive</Text>
      </View>

      {/* Premium Upsell Banner (non-premium only) */}
      <PremiumUpsellBanner testID="archive-premium-upsell" />

      {/* Archive List with Filter */}
      <ArchiveList
        ref={listRef}
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

      {/* Unlock Choice Modal - shows ad option for non-premium users
          IMPORTANT: Keep component always mounted to let Modal animate out properly.
          Conditional render causes Modal to unmount mid-animation, leaving overlay stuck. */}
      <UnlockChoiceModal
        visible={!!lockedPuzzle}
        onClose={handleCloseModal}
        puzzleId={lockedPuzzle?.id ?? ''}
        puzzleDate={lockedPuzzle?.puzzleDate ?? ''}
        gameMode={lockedPuzzle?.gameMode ?? 'career_path'}
        testID="unlock-choice-modal"
      />

      {/* Completed Game Modal - shows result for done games */}
      {completedPuzzle && completedPuzzle.attempt && (
        <CompletedGameModal
          visible={true}
          gameMode={completedPuzzle.gameMode}
          attempt={completedPuzzle.attempt}
          onClose={handleCloseCompletedModal}
          onReview={() => {
            const route = GAME_MODE_ROUTES[completedPuzzle.gameMode];
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
