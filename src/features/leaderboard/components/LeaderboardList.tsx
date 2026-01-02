/**
 * LeaderboardList Component
 *
 * FlatList wrapper for displaying leaderboard entries with pull-to-refresh.
 */

import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View, ViewToken } from 'react-native';
import { colors, spacing } from '@/theme';
import { LeaderboardEntry as EntryType } from '../types/leaderboard.types';
import { LeaderboardEntry } from './LeaderboardEntry';
import { LeaderboardEmptyState } from './LeaderboardEmptyState';

interface LeaderboardListProps {
  /** Leaderboard entries */
  entries: EntryType[];
  /** Whether currently loading */
  isLoading: boolean;
  /** Whether refreshing via pull */
  isRefreshing: boolean;
  /** Callback for pull-to-refresh */
  onRefresh: () => void;
  /** Current user's ID (for highlighting) */
  currentUserId?: string;
  /** Whether to show games played (daily mode) */
  showGamesPlayed?: boolean;
  /** Leaderboard type for empty state message */
  type?: 'daily' | 'global';
  /** Error if any */
  error?: Error | null;
  /** Callback for visible items change (for sticky bar) */
  onViewableItemsChanged?: (info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => void;
  /** Viewability config for onViewableItemsChanged */
  viewabilityConfig?: {
    itemVisiblePercentThreshold: number;
  };
  /** Test ID for testing */
  testID?: string;
}

/**
 * Leaderboard list with pull-to-refresh support.
 *
 * Features:
 * - Pull-to-refresh
 * - Loading and empty states
 * - Highlights current user
 * - Tracks visible items for sticky bar
 */
export function LeaderboardList({
  entries,
  isLoading,
  isRefreshing,
  onRefresh,
  currentUserId,
  showGamesPlayed = false,
  type = 'daily',
  error,
  onViewableItemsChanged,
  viewabilityConfig,
  testID,
}: LeaderboardListProps) {
  // Show loading state
  if (isLoading && entries.length === 0) {
    return <LeaderboardEmptyState isLoading testID={testID} />;
  }

  // Show empty or error state
  if (entries.length === 0) {
    return (
      <LeaderboardEmptyState
        isLoading={false}
        error={error}
        type={type}
        testID={testID}
      />
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.userId}
      renderItem={({ item }) => (
        <LeaderboardEntry
          entry={item}
          isCurrentUser={item.userId === currentUserId}
          showGamesPlayed={showGamesPlayed}
          testID={`${testID}-entry-${item.rank}`}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.pitchGreen}
          colors={[colors.pitchGreen]}
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      testID={`${testID}-flatlist`}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      ListFooterComponent={<View style={styles.footer} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footer: {
    // Extra space at bottom for sticky bar
    height: 100,
  },
});
