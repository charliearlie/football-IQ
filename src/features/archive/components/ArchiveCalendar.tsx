
import React from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, textStyles, spacing } from '@/theme';
import { ArchiveDateGroup, ArchivePuzzle } from '../types/archive.types';
import { MatchdayCard } from './MatchdayCard';
import { ArchiveCalendarSkeleton } from './ArchiveCalendarSkeleton';

interface ArchiveCalendarProps {
  dateGroups: ArchiveDateGroup[];
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  isLoading: boolean;
  hasMore: boolean;
  ListHeaderComponent?: React.ReactElement; // Contains FilterBar
  isPremium: boolean;
  testID?: string;
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Puzzles Found</Text>
      <Text style={styles.emptyText}>
        Try adjusting your filters or check back later!
      </Text>
    </View>
  );
}

export function ArchiveCalendar({
  dateGroups,
  onPuzzlePress,
  onEndReached,
  onRefresh,
  refreshing,
  isLoading,
  hasMore,
  ListHeaderComponent,
  isPremium,
  testID,
}: ArchiveCalendarProps) {

  // Simple render item
  const renderItem = ({ item }: { item: ArchiveDateGroup }) => (
    <MatchdayCard
      dateGroup={item}
      isPremium={isPremium}
      onPuzzlePress={onPuzzlePress}
      // auto-expand logic could go here if needed (e.g. expand Today by default)
      initiallyExpanded={false}
    />
  );

  if (isLoading && dateGroups.length === 0) {
    return (
      <View style={styles.container}>
        {/* Render header while loading? Usually yes for filters */}
        {ListHeaderComponent} 
        <ArchiveCalendarSkeleton testID={`${testID}-skeleton`} />
      </View>
    );
  }

  // Note: FlashList doesn't support ListEmptyComponent properly if data is empty array? 
  // actually it does, but we used custom empty checks before.
  // We'll render Header then EmptyState if empty.

  return (
    <FlashList
      data={dateGroups}
      renderItem={renderItem}
      keyExtractor={(item) => item.dateString}
      estimatedItemSize={80} // header height + padding
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={!isLoading ? EmptyState : null}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.pitchGreen}
          colors={[colors.pitchGreen]}
        />
      }
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing['2xl'] + 60,
    paddingTop: 8, // Little top spacing below filters
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyTop: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
