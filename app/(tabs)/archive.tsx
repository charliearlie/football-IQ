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
  GameMode,
} from '@/features/archive';
import { useAds, UnlockChoiceModal, PremiumUpsellBanner } from '@/features/ads';
import { CompletedGameModal } from '@/features/home';
import { useAuth } from '@/features/auth';

/**
 * Premium-only game modes that require subscription or ad unlock.
 * These games cannot be accessed for free regardless of puzzle date.
 */
const PREMIUM_ONLY_MODES: Set<GameMode> = new Set(['career_path_pro', 'top_tens']);

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

  // Get user premium status
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

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
   * ALWAYS show UnlockChoiceModal for locked puzzles - it provides:
   * - "Go Pro" option (always available)
   * - "Watch Ad" option (shows loading state, handles unavailable ads gracefully)
   *
   * We no longer route directly to /premium-modal as that caused issues:
   * - Navigation state conflicts when returning to archive
   * - Endless loading spinner after closing modal
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

      // Always show UnlockChoiceModal for locked puzzles
      // The modal handles both ad-eligible and non-ad-eligible users gracefully
      setLockedPuzzle(puzzle);
    },
  });

  /**
   * Handle puzzle press - show result modal for completed games,
   * check premium-only access, otherwise use gated navigation.
   *
   * This mirrors the home screen's handleCardPress logic:
   * 1. Check if completed → show results modal
   * 2. Check if premium-only game mode → show unlock modal (NOT route to game)
   * 3. Otherwise → use gated navigation (handles time-locked puzzles)
   */
  const handlePuzzlePress = useCallback(
    (puzzle: ArchivePuzzle) => {
      // Show results modal for completed games
      if (puzzle.status === 'done' && puzzle.attempt) {
        setCompletedPuzzle(puzzle);
        return;
      }

      // Premium-only game modes: check access BEFORE navigating
      // This prevents the game route's PremiumOnlyGate from showing /premium-modal directly
      const isPremiumOnly = PREMIUM_ONLY_MODES.has(puzzle.gameMode);
      if (isPremiumOnly && !isPremium) {
        // Non-premium user trying to access premium-only game
        // Show UnlockChoiceModal which offers both ad unlock and premium options
        console.log('[Archive] Premium-only game, showing unlock modal:', puzzle.gameMode);
        setLockedPuzzle(puzzle);
        return;
      }

      // Navigate (or show paywall for time-locked puzzles)
      navigateToPuzzle(puzzle);
    },
    [navigateToPuzzle, isPremium]
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
