
import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/theme';
import {
  useArchivePuzzles,
  useGatedNavigation,
  ArchivePuzzle,
  ArchiveFilterState,
  ArchiveDateGroup,
  GAME_MODE_ROUTES,
  GameMode,
} from '@/features/archive';
import { ArchiveCalendar } from '@/features/archive/components/ArchiveCalendar';
import { ArchiveHeader } from '@/features/archive/components/ArchiveHeader';
import { AdvancedFilterBar } from '@/features/archive/components/AdvancedFilterBar';
import { useRandomPlay } from '@/features/archive/hooks/useRandomPlay';
import { applyFilters, groupByDate } from '@/features/archive/utils/calendarTransformers';
import { useAds, UnlockChoiceModal, PremiumUpsellBanner } from '@/features/ads';
import { CompletedGameModal } from '@/features/home';
import { useAuth } from '@/features/auth';

/**
 * Premium-only game modes that require subscription or ad unlock.
 * These games cannot be accessed for free regardless of puzzle date.
 */
const PREMIUM_ONLY_MODES: Set<GameMode> = new Set(['career_path_pro', 'top_tens']);

/**
 * Default filter state.
 */
const DEFAULT_FILTERS: ArchiveFilterState = {
  status: 'all',
  gameMode: null,
  dateRange: { start: null, end: null },
};

/**
 * Archive Screen - Match Calendar
 *
 * High-density accordion-style archive browser with:
 * - Date-grouped accordion rows (MatchdayCard)
 * - At-a-glance completion icons
 * - Advanced filtering (Status, Game Mode)
 * - Premium ghosting (grayscale + lock instead of blur)
 * - Pull-to-refresh and pagination
 */
export default function ArchiveScreen() {
  const router = useRouter();
  // Accept params from calendar navigation and unlock redirects
  const { showUnlock, unlockPuzzleId, unlockDate, unlockGameMode } =
    useLocalSearchParams<{
      showUnlock?: string;
      unlockPuzzleId?: string;
      unlockDate?: string;
      unlockGameMode?: string;
    }>();

  // Filter state for advanced filtering
  const [filters, setFilters] = useState<ArchiveFilterState>(DEFAULT_FILTERS);
  const [lockedPuzzle, setLockedPuzzle] = useState<ArchivePuzzle | null>(null);
  const [completedPuzzle, setCompletedPuzzle] = useState<ArchivePuzzle | null>(null);

  // Get user premium status
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  // Check if user should see ads (non-premium users)
  const { shouldShowAds } = useAds();

  // Random play hook
  const { playRandom, isLoading: isRandomLoading } = useRandomPlay();

  // Load archive data with 'all' filter (we filter client-side for more flexibility)
  const {
    dateGroups: rawDateGroups,
    totalCount,
    completedCount,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  } = useArchivePuzzles('all');

  // Apply client-side filtering to the date groups
  const filteredDateGroups = useMemo((): ArchiveDateGroup[] => {
    // Flatten all puzzles from date groups
    const allPuzzles = rawDateGroups.flatMap((group) => group.puzzles);

    // Apply filters
    const filteredPuzzles = applyFilters(allPuzzles, filters);

    // Re-group by date
    return groupByDate(filteredPuzzles);
  }, [rawDateGroups, filters]);

  // NUCLEAR OPTION: Refresh archive list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Archive] Screen focused, refreshing list');
      refresh();
    }, [refresh])
  );

  // Handle unlock params from deep-link gate redirects
  useEffect(() => {
    if (showUnlock === 'true' && unlockPuzzleId) {
      console.log('[Archive] Showing unlock modal from redirect params:', {
        unlockPuzzleId,
        unlockDate,
        unlockGameMode,
      });
      const puzzleToUnlock: ArchivePuzzle = {
        id: unlockPuzzleId,
        gameMode: (unlockGameMode as GameMode) || 'career_path',
        puzzleDate: unlockDate || '',
        difficulty: null,
        isLocked: true,
        status: 'play',
      };
      setLockedPuzzle(puzzleToUnlock);
    }
  }, [showUnlock, unlockPuzzleId, unlockDate, unlockGameMode]);

  /**
   * Use gated navigation hook for premium access control.
   */
  const { navigateToPuzzle } = useGatedNavigation({
    onShowPaywall: (puzzle) => {
      console.log('[Archive] onShowPaywall called:', {
        puzzleId: puzzle.id,
        shouldShowAds,
        isLocked: puzzle.isLocked,
      });

      if (!puzzle.isLocked) {
        console.warn('[Archive] onShowPaywall called for unlocked puzzle, ignoring');
        return;
      }

      setLockedPuzzle(puzzle);
    },
  });

  /**
   * Handle puzzle press - show result modal for completed games,
   * check premium-only access, otherwise use gated navigation.
   */
  const handlePuzzlePress = useCallback(
    (puzzle: ArchivePuzzle) => {
      // Show results modal for completed games
      if (puzzle.status === 'done' && puzzle.attempt) {
        setCompletedPuzzle(puzzle);
        return;
      }

      // Premium-only game modes: check access BEFORE navigating
      const isPremiumOnly = PREMIUM_ONLY_MODES.has(puzzle.gameMode);
      if (isPremiumOnly && !isPremium && !puzzle.isAdUnlocked) {
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
      {/* Header with Stats */}
      <ArchiveHeader
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Premium Upsell Banner (non-premium only) */}
      <View style={styles.bannerContainer}>
        <PremiumUpsellBanner testID="archive-premium-upsell" fullWidth />
      </View>

      {/* Match Calendar with Advanced Filter */}
      <ArchiveCalendar
        dateGroups={filteredDateGroups}
        onPuzzlePress={handlePuzzlePress}
        onEndReached={loadMore}
        onRefresh={refresh}
        refreshing={isRefreshing}
        isLoading={isLoading}
        hasMore={hasMore}
        isPremium={isPremium}
        ListHeaderComponent={
          <AdvancedFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onRandomPlay={playRandom}
            isRandomLoading={isRandomLoading}
            testID="archive-filter"
          />
        }
        testID="archive-calendar"
      />

      {/* Unlock Choice Modal */}
      <UnlockChoiceModal
        visible={!!lockedPuzzle}
        onClose={handleCloseModal}
        puzzleId={lockedPuzzle?.id ?? ''}
        puzzleDate={lockedPuzzle?.puzzleDate ?? ''}
        gameMode={lockedPuzzle?.gameMode ?? 'career_path'}
        onUnlockSuccess={refresh}
        testID="unlock-choice-modal"
      />

      {/* Completed Game Modal */}
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
  bannerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
});
