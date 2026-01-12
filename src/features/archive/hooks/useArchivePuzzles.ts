/**
 * useArchivePuzzles Hook
 *
 * Main data hook for the Archive screen. Fetches puzzle catalog,
 * merges with full puzzle data and attempts, and groups by month.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/features/auth';
import { useAds } from '@/features/ads';
import {
  getCatalogEntriesPaginated,
  getCatalogEntryCount,
  getPuzzle,
  getAttemptByPuzzleId,
} from '@/lib/database';
import { LocalCatalogEntry } from '@/types/database';
import { ParsedLocalAttempt } from '@/types/database';
import {
  ArchivePuzzle,
  ArchiveSection,
  GameModeFilter,
  UseArchivePuzzlesResult,
  GameMode,
} from '../types/archive.types';
import { groupByMonth, isPuzzleLocked } from '../utils/dateGrouping';
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
  const { adUnlocks } = useAds();
  const isPremium = profile?.is_premium ?? false;

  const [puzzles, setPuzzles] = useState<ArchivePuzzle[]>([]);
  const [sections, setSections] = useState<ArchiveSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Track if catalog has been synced this session
  const catalogSynced = useRef(false);

  // Track if initial load has completed (to skip first focus event)
  const hasInitiallyLoaded = useRef(false);

  /**
   * Transform catalog entry to ArchivePuzzle with lock and status info.
   */
  const transformEntry = useCallback(
    async (entry: LocalCatalogEntry): Promise<ArchivePuzzle> => {
      // Check if we have full puzzle data (unlocked)
      const fullPuzzle = await getPuzzle(entry.id);
      // Check lock status including ad unlocks
      const isLocked = fullPuzzle
        ? false
        : isPuzzleLocked(entry.puzzle_date, isPremium, entry.id, adUnlocks);

      // Get attempt status if not locked
      let status: 'play' | 'resume' | 'done' = 'play';
      let scoreDisplay: string | undefined;
      let score: number | undefined;
      let attemptData: ParsedLocalAttempt | undefined;

      if (!isLocked && fullPuzzle) {
        const attempt = await getAttemptByPuzzleId(entry.id);
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
      };
    },
    [isPremium, adUnlocks]
  );

  /**
   * Load a page of puzzles from the catalog.
   */
  const loadPage = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      const gameMode = filter === 'all' ? null : filter;
      const offset = pageNum * PAGE_SIZE;

      // Get catalog entries
      const entries = await getCatalogEntriesPaginated(
        offset,
        PAGE_SIZE,
        gameMode
      );

      // Check if there are more pages
      const totalCount = await getCatalogEntryCount(gameMode);
      const loadedCount = offset + entries.length;
      setHasMore(loadedCount < totalCount);

      // Transform entries to ArchivePuzzles
      const transformed = await Promise.all(entries.map(transformEntry));

      // Filter out future dates - only show puzzles up to today
      const today = new Date().toISOString().split('T')[0];
      const filtered = transformed.filter((p) => p.puzzleDate <= today);

      // Update state
      if (reset) {
        setPuzzles(filtered);
        setSections(groupByMonth(filtered));
      } else {
        setPuzzles((prev) => {
          const updated = [...prev, ...filtered];
          setSections(groupByMonth(updated));
          return updated;
        });
      }
    },
    [filter, transformEntry]
  );

  /**
   * Initial load - sync catalog if needed, then load first page.
   */
  const initialLoad = useCallback(async () => {
    setIsLoading(true);

    try {
      // Sync catalog from Supabase if not done this session
      if (!catalogSynced.current) {
        await syncCatalogFromSupabase();
        catalogSynced.current = true;
      }

      // Reset pagination and load first page
      setPage(0);
      await loadPage(0, true);
    } catch (error) {
      console.error('Archive initial load error:', error);
    } finally {
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
   * Refresh - resync catalog and reload.
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Force resync catalog
      await syncCatalogFromSupabase();

      // Reset and reload
      setPage(0);
      await loadPage(0, true);
    } catch (error) {
      console.error('Archive refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPage]);

  // Initial load on mount and when filter changes
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  // Refresh attempt data when screen gains focus (e.g., after completing a game)
  useFocusEffect(
    useCallback(() => {
      // Skip the initial focus event - only refresh on subsequent returns
      if (!hasInitiallyLoaded.current) return;

      // Reload first page to refresh attempt status
      loadPage(0, true);
    }, [loadPage])
  );

  // Use a ref to access current puzzles without adding to dependencies
  // This prevents infinite loops when setPuzzles updates the array
  const puzzlesRef = useRef(puzzles);
  puzzlesRef.current = puzzles;

  // Re-check lock status when premium status or ad unlocks change
  useEffect(() => {
    const currentPuzzles = puzzlesRef.current;
    if (isLoading || currentPuzzles.length === 0) {
      return;
    }

    // Re-check lock status for all puzzles
    const recheck = async () => {
      const updated = await Promise.all(
        currentPuzzles.map(async (p) => {
          const fullPuzzle = await getPuzzle(p.id);
          const isLocked = fullPuzzle
            ? false
            : isPuzzleLocked(p.puzzleDate, isPremium, p.id, adUnlocks);
          return { ...p, isLocked };
        })
      );
      setPuzzles(updated);
      setSections(groupByMonth(updated));
    };
    recheck();
  }, [isPremium, adUnlocks, isLoading]); // puzzles accessed via ref to avoid dep cycle

  return {
    sections,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  };
}
