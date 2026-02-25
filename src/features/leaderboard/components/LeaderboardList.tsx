/**
 * LeaderboardList Component
 *
 * FlatList wrapper for displaying leaderboard entries with pull-to-refresh.
 * Renders a flat, dense table surface with hairline separators and a
 * "STANDINGS" divider between the podium (top 3) and the rest of the field.
 */

import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  ViewToken,
} from 'react-native';
import { colors, fonts, fontWeights, spacing } from '@/theme';
import { LeaderboardEntry as EntryType, LeaderboardType } from '../types/leaderboard.types';
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
  /** Whether to show games played (daily/yearly mode) */
  showGamesPlayed?: boolean;
  /** Leaderboard type for empty state message and score formatting */
  type?: LeaderboardType;
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
 * Thin hairline separator between rows.
 */
function ItemSeparator() {
  return <View style={styles.separator} />;
}

/**
 * Divider rendered above rank 4 to separate the podium from the standings.
 *
 *   ——  STANDINGS  ——
 */
function StandingsDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>STANDINGS</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/**
 * Leaderboard list with pull-to-refresh support.
 *
 * Features:
 * - Pull-to-refresh
 * - Loading and empty states
 * - Highlights current user
 * - Tracks visible items for sticky bar
 * - Podium divider between rank 3 and rank 4
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
        <>
          {item.rank === 4 && <StandingsDivider />}
          <LeaderboardEntry
            entry={item}
            isCurrentUser={item.userId === currentUserId}
            showGamesPlayed={showGamesPlayed}
            leaderboardType={type}
            testID={`${testID}-entry-${item.rank}`}
          />
        </>
      )}
      ItemSeparatorComponent={ItemSeparator}
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
    paddingTop: spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.12)',
  },
  dividerLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(248, 250, 252, 0.30)',
    textTransform: 'uppercase',
    marginHorizontal: spacing.sm,
  },
  footer: {
    height: 100,
  },
});
