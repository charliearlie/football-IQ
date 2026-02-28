/**
 * useArchivePuzzles Hook
 *
 * Main data hook for the Archive screen. Fetches puzzle catalog,
 * merges with full puzzle data and attempts, and groups by month.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/features/auth';
import {
  getCatalogEntriesPaginated,
  getCatalogEntryCount,
  getCatalogEntriesIncomplete,
  getCatalogEntryCountIncomplete,
  getAttemptByPuzzleId,
  getValidAdUnlocks,
  getCompletedPuzzleCount,
} from '@/lib/database';
import { LocalCatalogEntry, ParsedLocalAttempt, UnlockedPuzzle } from '@/types/database';
import {
  ArchivePuzzle,
  ArchiveSection,
  ArchiveDateGroup,
  GameModeFilter,
  UseArchivePuzzlesResult,
  GameMode,
} from '../types/archive.types';
import { groupByMonth, isPuzzleLocked } from '../utils/dateGrouping';
import { groupByDate } from '../utils/calendarTransformers';
import { syncCatalogFromSupabase } from '../services/catalogSyncService';

/** Number of items to load per page */
const PAGE_SIZE = 50;

/**
 * Hook to get paginated archive puzzles with premium gating.
 *
 * @param filter - Game mode filter ('all' or specific mode)
 * @returns Archive data with sections, loading state, and pagination handlers
 */
export function useArchivePuzzles(
  filter: GameModeFilter
): UseArchivePuzzlesResult {
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  const [puzzles, setPuzzles] = useState<ArchivePuzzle[]>([]);
  const [sections, setSections] = useState<ArchiveSection[]>([]);
  const [dateGroups, setDateGroups] = useState<ArchiveDateGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Track if catalog has been synced this session
  const catalogSynced = useRef(false);

  // Track if initial load has completed (to skip first focus event)
  const hasInitiallyLoaded = useRef(false);

  // Track if a loading operation is in progress (prevents race condition with lock recheck)
  const isLoadingOperation = useRef(false);

  /**
   * Transform catalog entry to ArchivePuzzle with lock and status info.
   *
   * Performance: We accept ad unlocks as a parameter to avoid fetching from database
   * for every puzzle. The caller fetches once and passes to all transforms.
   */
  const transformEntry = useCallback(
    async (entry: LocalCatalogEntry, allUnlocks: UnlockedPuzzle[]): Promise<ArchivePuzzle> => {
      // Fetch attempt data first to check completion status
      const attempt = await getAttemptByPuzzleId(entry.id);
      const hasCompletedAttempt = attempt?.completed === true;

      // Check lock status - completed puzzles are NEVER locked
      const isLocked = isPuzzleLocked(
        entry.puzzle_date,
        isPremium,
        entry.id,
        allUnlocks,
        hasCompletedAttempt  // NEW: Pass completion status
      );

      // Development-only logging for lock checks
      if (__DEV__ && entry.puzzle_date >= '2026-01-10') {
        console.log('[useArchivePuzzles] Lock check:', entry.id, isLocked);
      }

      // Determine status and extract display data
      let status: 'play' | 'resume' | 'done' = 'play';
      let scoreDisplay: string | undefined;
      let score: number | undefined;
      let attemptData: ParsedLocalAttempt | undefined;

      if (attempt) {
        if (attempt.completed) {
          status = 'done';
          scoreDisplay = attempt.score_display ?? undefined;
          score = attempt.score ?? undefined;
          attemptData = attempt;
        } else {
          status = 'resume';
        }
      }

      return {
        id: entry.id,
        gameMode: entry.game_mode as GameMode,
        puzzleDate: entry.puzzle_date,
        difficulty: entry.difficulty,
        isLocked,
        status,
        scoreDisplay,
        score,
        attempt: attemptData,
        isAdUnlocked: allUnlocks.some(u => u.puzzle_id === entry.id),
      };
    },
    [isPremium]
  );

  /**
   * Load ALL pages from the catalog in one pass. Accumulates every page
   * before touching React state, so the UI never flashes partial data.
   */
  const loadAllPages = useCallback(async () => {
    if (__DEV__) console.log('[Archive:loadAllPages] START');
    isLoadingOperation.current = true;

    try {
      // Hoist lookups that don't change between pages
      const allUnlocks = await getValidAdUnlocks();
      const gameMode = filter === 'all' ? null : filter === 'incomplete' ? null : filter;
      const total = filter === 'incomplete'
        ? await getCatalogEntryCountIncomplete()
        : await getCatalogEntryCount(gameMode);

      if (__DEV__) console.log(`[Archive:loadAllPages] Total count: ${total}`);

      let allTransformed: ArchivePuzzle[] = [];
      let currentPage = 0;

      // Load every page
      while (true) {
        const offset = currentPage * PAGE_SIZE;

        const entries = filter === 'incomplete'
          ? await getCatalogEntriesIncomplete(offset, PAGE_SIZE)
          : await getCatalogEntriesPaginated(offset, PAGE_SIZE, gameMode);

        if (entries.length === 0) break;

        const transformed = await Promise.all(
          entries.map(entry => transformEntry(entry, allUnlocks))
        );
        allTransformed = [...allTransformed, ...transformed];

        const loadedCount = offset + entries.length;
        if (loadedCount >= total) break;

        currentPage += 1;
      }

      if (__DEV__) console.log(`[Archive:loadAllPages] Loaded ${allTransformed.length} puzzles across ${currentPage + 1} pages`);

      // Single state update — no intermediate renders
      const completed = await getCompletedPuzzleCount();
      setPuzzles(allTransformed);
      setSections(groupByMonth(allTransformed));
      setDateGroups(groupByDate(allTransformed));
      setTotalCount(total);
      setCompletedCount(completed);
      setHasMore(false);
      setPage(currentPage);
    } finally {
      if (__DEV__) console.log('[Archive:loadAllPages] END');
      isLoadingOperation.current = false;
    }
  }, [filter, transformEntry]);

  /**
   * Initial load - sync catalog and load all pages.
   */
  const initialLoad = useCallback(async () => {
    if (__DEV__) console.log('[Archive:initialLoad] START');
    setIsLoading(true);

    try {
      // Sync catalog from Supabase if not done this session
      if (!catalogSynced.current) {
        if (__DEV__) console.log('[Archive:initialLoad] Syncing catalog from Supabase');
        const syncResult = await syncCatalogFromSupabase(null);
        if (__DEV__) console.log('[Archive:initialLoad] Sync result:', syncResult.success, 'count:', syncResult.syncedCount);
        if (!syncResult.success && __DEV__) {
          console.error('[Archive:initialLoad] Sync FAILED:', syncResult.error);
        }
        catalogSynced.current = true;
      }

      await loadAllPages();
      if (__DEV__) console.log('[Archive:initialLoad] Load complete');
    } catch (error) {
      if (__DEV__) console.error('Archive initial load error:', error);
    } finally {
      if (__DEV__) console.log('[Archive:initialLoad] END - setting isLoading=false');
      setIsLoading(false);
      hasInitiallyLoaded.current = true;
    }
  }, [loadAllPages]);

  /**
   * Load more items (pagination) — used by BY DATE tab's FlashList onEndReached.
   * After loadAllPages, hasMore is false so this is a no-op.
   */
  const loadMore = useCallback(() => {
    // All data is already loaded by loadAllPages
  }, []);

  /**
   * Load all remaining pages — kept for API compatibility.
   * After loadAllPages, this is a no-op.
   */
  const loadAll = useCallback(async () => {
    // All data is already loaded by loadAllPages
  }, []);

  /**
   * Refresh - force full resync of catalog and reload all pages.
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const syncResult = await syncCatalogFromSupabase(null);
      if (__DEV__) console.log('[Archive:refresh] Sync result:', syncResult.success, 'count:', syncResult.syncedCount);
      if (!syncResult.success && __DEV__) {
        console.error('[Archive:refresh] Sync FAILED:', syncResult.error);
      }

      await loadAllPages();
    } catch (error) {
      if (__DEV__) console.error('Archive refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAllPages]);

  // Initial load on mount and when filter changes
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // Sync catalog and refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      // Skip the initial focus event - initialLoad handles that
      if (!hasInitiallyLoaded.current) {
        if (__DEV__) console.log('[Archive:focus] Skipping - initial load not complete');
        return;
      }

      if (__DEV__) console.log('[Archive:focus] Screen focused, starting sync');
      const syncAndReload = async () => {
        try {
          const syncResult = await syncCatalogFromSupabase(null);
          if (__DEV__) {
            console.log('[Archive:focus] Sync result:', syncResult.success, 'count:', syncResult.syncedCount);
          }
          if (!syncResult.success && __DEV__) {
            console.error('[Archive:focus] Sync FAILED:', syncResult.error);
          }
          await loadAllPages();
          if (__DEV__) console.log('[Archive:focus] Load complete');
        } catch (error) {
          if (__DEV__) console.error('Archive focus sync error:', error);
        }
      };
      syncAndReload();
    }, [loadAllPages])
  );

  return {
    sections,
    dateGroups,
    totalCount,
    completedCount,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    loadAll,
    refresh,
  };
}
