
import { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { colors } from '@/theme';
import {
  useArchivePuzzles,
  useGatedNavigation,
  ArchivePuzzle,
  ArchiveFilterState,
  ArchiveDateGroup,
  GAME_MODE_ROUTES,
  GameMode,
  useModeStats,
  ModeStats,
} from '@/features/archive';
import { ArchiveCalendar } from '@/features/archive/components/ArchiveCalendar';
import { ArchiveHeader } from '@/features/archive/components/ArchiveHeader';
import { AdvancedFilterBar } from '@/features/archive/components/AdvancedFilterBar';
import { ArchiveTabBar } from '@/features/archive/components/ArchiveTabBar';
import { SmartRecommendation } from '@/features/archive/components/SmartRecommendation';
import { ModeGrid } from '@/features/archive/components/ModeGrid';
import { ModeDetailSheet } from '@/features/archive/components/ModeDetailSheet';
import { useRandomPlay } from '@/features/archive/hooks/useRandomPlay';
import { applyFilters, groupByDate } from '@/features/archive/utils/calendarTransformers';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useAds, UnlockChoiceModal } from '@/features/ads';
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
 * Archive Screen - Mode-First Browsing
 *
 * Redesigned archive with two tabs:
 * - BY GAME (default): Smart recommendation + 2-col mode grid
 * - BY DATE: Original chronological accordion (MatchdayCard)
 *
 * Shares a single useArchivePuzzles data source across both views.
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

  // Tab state: "byGame" (mode grid, default) or "byDate" (calendar)
  const [activeTab, setActiveTab] = useState<'byGame' | 'byDate'>('byGame');

  // Filter state for date-view advanced filtering
  const [filters, setFilters] = useState<ArchiveFilterState>(DEFAULT_FILTERS);

  // Mode detail sheet
  const [selectedMode, setSelectedMode] = useState<ModeStats | null>(null);

  // Modal state
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
  // loadAllPages() inside the hook loads every page in one pass — no flash
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

  // Flatten all puzzles for mode stats computation
  const allPuzzles = useMemo(
    () => rawDateGroups.flatMap((group) => group.puzzles),
    [rawDateGroups]
  );

  // Per-mode aggregated stats for the "By Game" tab
  const modeStats = useModeStats(allPuzzles);

  // Apply client-side filtering to the date groups (for "By Date" tab)
  const filteredDateGroups = useMemo((): ArchiveDateGroup[] => {
    const filteredPuzzles = applyFilters(allPuzzles, filters);
    return groupByDate(filteredPuzzles);
  }, [allPuzzles, filters]);

  // Close the mode detail sheet when navigating away from the archive.
  // This handles the case where a user taps a free puzzle from the sheet
  // (navigates to the game) — the sheet is closed when they return.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedMode(null);
      };
    }, [])
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
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Stats */}
        <ArchiveHeader
          completedCount={completedCount}
          totalCount={totalCount}
          isLoading={isLoading}
        />

        {/* Tab Bar */}
        <ArchiveTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'byGame' ? (
          // ── BY GAME: Smart recommendation + mode grid ──
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SmartRecommendation
              modeStats={modeStats}
              dateGroups={rawDateGroups}
              onPuzzlePress={handlePuzzlePress}
            />
            <ModeGrid
              modeStats={modeStats}
              onModePress={setSelectedMode}
            />
          </ScrollView>
        ) : (
          // ── BY DATE: Original calendar accordion ──
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
        )}

        {/* Mode Detail Sheet */}
        <ModeDetailSheet
          mode={selectedMode}
          visible={!!selectedMode}
          onClose={() => setSelectedMode(null)}
          onPuzzlePress={handlePuzzlePress}
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
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
