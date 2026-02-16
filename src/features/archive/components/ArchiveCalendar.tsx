
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, textStyles, spacing } from '@/theme';
import { ArchiveDateGroup, ArchivePuzzle } from '../types/archive.types';
import { MatchdayCard } from './MatchdayCard';
import { ArchiveCalendarSkeleton } from './ArchiveCalendarSkeleton';
import { injectPremiumUpsell } from '../utils/calendarTransformers';
import { PremiumUpsellBanner } from '@/features/ads';

type CalendarListItem =
  | { type: 'matchday'; data: ArchiveDateGroup }
  | { type: 'premium-upsell' };

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
  // Build list data with premium upsell banner injected
  const listData: CalendarListItem[] = useMemo(() => {
    const withUpsell = injectPremiumUpsell(dateGroups, isPremium);
    return withUpsell.map(item =>
      'type' in item && item.type === 'premium-upsell'
        ? (item as CalendarListItem)
        : { type: 'matchday' as const, data: item as ArchiveDateGroup }
    );
  }, [dateGroups, isPremium]);

  // Render item - handles both matchday cards and premium upsell
  const renderItem = ({ item }: { item: CalendarListItem }) => {
    if (item.type === 'premium-upsell') {
      return (
        <View style={{ marginHorizontal: 20, marginVertical: 12 }}>
          <PremiumUpsellBanner testID="archive-inline-upsell" fullWidth dismissible={false} />
        </View>
      );
    }
    return (
      <MatchdayCard
        dateGroup={item.data}
        isPremium={isPremium}
        onPuzzlePress={onPuzzlePress}
        initiallyExpanded={false}
      />
    );
  };

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
      data={listData}
      renderItem={renderItem}
      keyExtractor={(item) =>
        item.type === 'premium-upsell'
          ? 'premium-upsell-banner'
          : item.data.dateString
      }
      estimatedItemSize={80}
      overrideItemLayout={(layout, item) => {
        layout.size = item.type === 'premium-upsell' ? 120 : 80;
      }}
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
    paddingTop: spacing.xl,
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
