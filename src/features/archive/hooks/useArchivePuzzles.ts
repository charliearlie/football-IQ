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
   * Load a page of puzzles from the catalog.
   */
  const loadPage = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (__DEV__) console.log(`[Archive:loadPage] START pageNum=${pageNum} reset=${reset}`);
      // Set flag to prevent lock recheck effect from running during load (race condition fix)
      isLoadingOperation.current = true;

      try {
        const offset = pageNum * PAGE_SIZE;

        // Get catalog entries based on filter type
        let entries: LocalCatalogEntry[];
        let totalCount: number;

        if (filter === 'incomplete') {
          // Special handling for incomplete filter - query puzzles without completed attempts
          entries = await getCatalogEntriesIncomplete(offset, PAGE_SIZE);
          totalCount = await getCatalogEntryCountIncomplete();
          if (__DEV__) console.log(`[Archive:loadPage] Incomplete filter: ${entries.length} entries, ${totalCount} total`);
        } else {
          // Standard filtering by game mode
          const gameMode = filter === 'all' ? null : filter;
          entries = await getCatalogEntriesPaginated(offset, PAGE_SIZE, gameMode);
          totalCount = await getCatalogEntryCount(gameMode);
          if (__DEV__) console.log(`[Archive:loadPage] Standard filter (${filter}): ${entries.length} entries`);
        }

        // Check if there are more pages
        const loadedCount = offset + entries.length;
        setHasMore(loadedCount < totalCount);

        // Fetch ad unlocks ONCE for this page load (performance optimization)
        const allUnlocks = await getValidAdUnlocks();
        if (__DEV__) console.log(`[Archive:loadPage] Fetched ${allUnlocks.length} ad unlocks`);

        // Transform entries to ArchivePuzzles, passing unlocks to each
        // Note: Future-dated puzzles are already filtered out at the SQL level
        const transformed = await Promise.all(entries.map(entry => transformEntry(entry, allUnlocks)));
        if (__DEV__) console.log(`[Archive:loadPage] Transformed ${transformed.length} puzzles, first 3:`, transformed.slice(0, 3).map(p => p.puzzleDate));

        // Update state
        if (reset) {
          if (__DEV__) console.log(`[Archive:loadPage] RESET: Setting ${transformed.length} puzzles`);
          setPuzzles(transformed);
          setSections(groupByMonth(transformed));
          setDateGroups(groupByDate(transformed));
        } else {
          setPuzzles((prev) => {
            if (__DEV__) console.log(`[Archive:loadPage] APPEND: prev=${prev.length}, adding=${transformed.length}`);
            const updated = [...prev, ...transformed];
            setSections(groupByMonth(updated));
            setDateGroups(groupByDate(updated));
            return updated;
          });
        }
      } finally {
        if (__DEV__) console.log(`[Archive:loadPage] END`);
        isLoadingOperation.current = false;
      }
    },
    [filter, transformEntry]
  );

  /**
   * Initial load - sync catalog and load first page.
   */
  const initialLoad = useCallback(async () => {
    if (__DEV__) console.log('[Archive:initialLoad] START');
    setIsLoading(true);

    try {
      // Sync catalog from Supabase if not done this session
      if (!catalogSynced.current) {
        if (__DEV__) console.log('[Archive:initialLoad] Syncing catalog from Supabase');
        // ALWAYS do full sync (pass null) - incremental sync was causing data loss
        const syncResult = await syncCatalogFromSupabase(null);
        if (__DEV__) console.log('[Archive:initialLoad] Sync result:', syncResult.success, 'count:', syncResult.syncedCount);
        if (!syncResult.success && __DEV__) {
          console.error('[Archive:initialLoad] Sync FAILED:', syncResult.error);
        }
        catalogSynced.current = true;
      }

      // Reset pagination and load first page
      setPage(0);
      await loadPage(0, true);
      if (__DEV__) console.log('[Archive:initialLoad] Load complete');
    } catch (error) {
      if (__DEV__) console.error('Archive initial load error:', error);
    } finally {
      if (__DEV__) console.log('[Archive:initialLoad] END - setting isLoading=false');
      setIsLoading(false);
      hasInitiallyLoaded.current = true;
    }
  }, [loadPage]);

  /**
   * Load more items (pagination).
   */
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(nextPage, false);
  }, [isLoading, hasMore, page, loadPage]);

  /**
   * Refresh - force full resync of catalog and reload.
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Force full resync (null = no timestamp filter)
      const syncResult = await syncCatalogFromSupabase(null);
      if (__DEV__) console.log('[Archive:refresh] Sync result:', syncResult.success, 'count:', syncResult.syncedCount);
      if (!syncResult.success && __DEV__) {
        console.error('[Archive:refresh] Sync FAILED:', syncResult.error);
      }

      // Reset and reload
      setPage(0);
      await loadPage(0, true);
    } catch (error) {
      if (__DEV__) console.error('Archive refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPage]);

  // Initial load on mount and when filter changes
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // Sync catalog and refresh data when screen gains focus
  // ALWAYS do full sync to prevent progressive data loss bug
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
          // ALWAYS do full sync (pass null) - incremental sync was causing data loss
          const syncResult = await syncCatalogFromSupabase(null);
          if (__DEV__) {
            console.log(
              '[Archive:focus] Sync result:',
              syncResult.success,
              'count:',
              syncResult.syncedCount
            );
          }
          if (!syncResult.success && __DEV__) {
            console.error('[Archive:focus] Sync FAILED:', syncResult.error);
          }
          if (__DEV__) console.log('[Archive:focus] Loading page');
          await loadPage(0, true);
          if (__DEV__) console.log('[Archive:focus] Load complete');
        } catch (error) {
          if (__DEV__) console.error('Archive focus sync error:', error);
        }
      };
      syncAndReload();
    }, [loadPage])
  );

  return {
    sections,
    dateGroups,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  };
}
