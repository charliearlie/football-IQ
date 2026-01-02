/**
 * useStickyMe Hook
 *
 * Manages visibility of the sticky "Me" bar based on FlatList scroll position.
 * Shows the bar when the current user is scrolled out of view.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { ViewToken } from 'react-native';
import { LeaderboardEntry, UserRank, StickyMeConfig } from '../types/leaderboard.types';

interface UseStickyMeOptions {
  /** Current user's ID */
  currentUserId: string | undefined;
  /** Leaderboard entries */
  entries: LeaderboardEntry[];
  /** Current user's rank (may be outside top 100) */
  userRank: UserRank | null;
}

interface UseStickyMeResult {
  /** Configuration for sticky bar visibility */
  config: StickyMeConfig;
  /** Callback for FlatList's onViewableItemsChanged */
  onViewableItemsChanged: (info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => void;
  /** ViewabilityConfig for FlatList */
  viewabilityConfig: {
    itemVisiblePercentThreshold: number;
  };
}

/**
 * Hook for managing sticky "Me" bar visibility.
 *
 * Tracks which items are visible in the FlatList and determines
 * whether to show the sticky bar based on current user's position.
 *
 * @param options - Configuration options
 * @returns Sticky bar config and FlatList callbacks
 */
export function useStickyMe(options: UseStickyMeOptions): UseStickyMeResult {
  const { currentUserId, entries, userRank } = options;

  // Track visible item indices
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  /**
   * Find user's index in entries.
   */
  const userIndex = useMemo(() => {
    if (!currentUserId) return -1;
    return entries.findIndex((e) => e.userId === currentUserId);
  }, [currentUserId, entries]);

  /**
   * Calculate sticky bar configuration.
   */
  const config = useMemo((): StickyMeConfig => {
    // No user ID means not logged in
    if (!currentUserId) {
      return {
        isUserVisible: false,
        userIndex: -1,
        shouldShowStickyBar: false,
      };
    }

    // No rank means user hasn't completed any puzzles
    if (!userRank) {
      return {
        isUserVisible: false,
        userIndex: -1,
        shouldShowStickyBar: false,
      };
    }

    // User not in top 100
    if (userIndex === -1) {
      return {
        isUserVisible: false,
        userIndex: -1,
        shouldShowStickyBar: true,
      };
    }

    // Check if user is within visible range
    const isUserVisible =
      userIndex >= visibleRange.start && userIndex <= visibleRange.end;

    return {
      isUserVisible,
      userIndex,
      shouldShowStickyBar: !isUserVisible,
    };
  }, [currentUserId, userRank, userIndex, visibleRange]);

  /**
   * Callback for FlatList's onViewableItemsChanged.
   * Updates the visible range when scroll position changes.
   */
  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      const viewableItems = info.viewableItems;
      if (viewableItems.length === 0) return;

      const indices = viewableItems
        .map((item) => item.index)
        .filter((idx): idx is number => idx !== null);

      if (indices.length === 0) return;

      const start = Math.min(...indices);
      const end = Math.max(...indices);

      setVisibleRange({ start, end });
    },
    []
  );

  /**
   * Use a ref to prevent the callback from causing re-renders.
   * This is required by FlatList's onViewableItemsChanged.
   */
  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const stableOnViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      onViewableItemsChangedRef.current(info);
    },
    []
  );

  /**
   * ViewabilityConfig for FlatList.
   * Item is considered visible if 50% or more is showing.
   */
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    []
  );

  return {
    config,
    onViewableItemsChanged: stableOnViewableItemsChanged,
    viewabilityConfig,
  };
}
