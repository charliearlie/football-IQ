/**
 * useLeaderboard Hook
 *
 * Main data hook for fetching and polling leaderboard data.
 * Supports both daily and global IQ leaderboards with auto-refresh.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/features/auth';
import {
  LeaderboardEntry,
  UserRank,
  LeaderboardType,
  UseLeaderboardResult,
} from '../types/leaderboard.types';
import { getLeaderboardWithUserRank } from '../services/leaderboardService';

/** Polling interval in milliseconds (30 seconds) */
const POLLING_INTERVAL = 30000;

/** Minimum time between refreshes to prevent rapid re-fetches */
const REFRESH_DEBOUNCE = 1000;

interface UseLeaderboardOptions {
  /** Type of leaderboard to fetch */
  type: LeaderboardType;
  /** Date for daily leaderboard (YYYY-MM-DD) */
  date?: string;
  /** Whether to enable auto-polling */
  enablePolling?: boolean;
}

/**
 * Hook for fetching and managing leaderboard state.
 *
 * Features:
 * - Automatic polling every 30 seconds when screen is focused
 * - Pull-to-refresh support
 * - Fetches current user's rank alongside entries
 * - Pauses polling when app goes to background
 *
 * @param options - Configuration options
 * @returns Leaderboard state and actions
 */
export function useLeaderboard(
  options: UseLeaderboardOptions
): UseLeaderboardResult {
  const { type, date, enablePolling = true } = options;
  const { user } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastRefreshRef = useRef<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Ref to hold current fetchData for polling (avoids effect re-runs when callback changes)
  const fetchDataRef = useRef<(isManualRefresh?: boolean) => Promise<void>>(() => Promise.resolve());

  /**
   * Fetch leaderboard data from service.
   */
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      // Debounce rapid refreshes
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_DEBOUNCE && !isManualRefresh) {
        return;
      }
      lastRefreshRef.current = now;

      try {
        if (!user?.id) {
          // User not logged in, fetch entries only
          setEntries([]);
          setUserRank(null);
          return;
        }

        const result = await getLeaderboardWithUserRank(user.id, type, {
          date,
          limit: 100,
        });

        if (isMountedRef.current) {
          setEntries(result.entries);
          setUserRank(result.userRank);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      }
    },
    [user?.id, type, date]
  );

  // Keep ref in sync with latest fetchData
  fetchDataRef.current = fetchData;

  /**
   * Manual refresh function for pull-to-refresh.
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchData(true);
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;

    const load = async () => {
      setIsLoading(true);
      await fetchData();
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  // Polling management - uses refs to avoid effect dependencies on callbacks
  useEffect(() => {
    if (!enablePolling) {
      // Clean up any existing interval when polling is disabled
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling using ref (avoids recreating interval when fetchData changes)
    const startPollingInterval = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(() => {
        fetchDataRef.current();
      }, POLLING_INTERVAL);
    };

    startPollingInterval();

    // Handle app state changes (pause polling when backgrounded)
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        // Refresh immediately when coming back
        fetchDataRef.current();
        startPollingInterval();
      } else {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      subscription.remove();
    };
  }, [enablePolling]); // Only depend on enablePolling - fetchData accessed via ref

  // Refetch when type or date changes
  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    });
  }, [type, date, fetchData]);

  return {
    entries,
    userRank,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
