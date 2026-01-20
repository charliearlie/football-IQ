/**
 * ArchiveCalendarSkeleton Component
 *
 * Loading skeleton for the Match Calendar accordion view.
 * Shows 8-10 collapsed date row placeholders.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { colors, spacing } from '@/theme';

interface ArchiveCalendarSkeletonProps {
  /** Number of skeleton rows to show */
  rowCount?: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Theme-consistent colors for skeleton shimmer effect.
 */
const SKELETON_COLORS = [
  'rgba(255, 255, 255, 0.05)',
  'rgba(255, 255, 255, 0.12)',
  'rgba(255, 255, 255, 0.05)',
] as const;

/**
 * Single date row skeleton.
 */
function DateRowSkeleton({ testID }: { testID?: string }) {
  return (
    <View style={styles.row} testID={testID}>
      {/* Date label skeleton */}
      <MotiView>
        <Skeleton
          colorMode="dark"
          colors={[...SKELETON_COLORS]}
          width={60}
          height={16}
          radius={4}
        />
      </MotiView>

      {/* Completion text skeleton */}
      <MotiView style={styles.completionSkeleton}>
        <Skeleton
          colorMode="dark"
          colors={[...SKELETON_COLORS]}
          width={40}
          height={12}
          radius={4}
        />
      </MotiView>

      {/* At-a-glance icons skeleton */}
      <View style={styles.iconsSkeleton}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <MotiView key={i}>
            <Skeleton
              colorMode="dark"
              colors={[...SKELETON_COLORS]}
              width={20}
              height={20}
              radius={4}
            />
          </MotiView>
        ))}
      </View>

      {/* Chevron skeleton */}
      <MotiView>
        <Skeleton
          colorMode="dark"
          colors={[...SKELETON_COLORS]}
          width={20}
          height={20}
          radius={10}
        />
      </MotiView>
    </View>
  );
}

/**
 * ArchiveCalendarSkeleton - Loading state for Match Calendar.
 *
 * Shows multiple collapsed date row skeletons to indicate loading.
 */
export function ArchiveCalendarSkeleton({
  rowCount = 10,
  testID,
}: ArchiveCalendarSkeletonProps) {
  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: rowCount }).map((_, index) => (
        <DateRowSkeleton key={index} testID={`${testID}-row-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    minHeight: 56,
    gap: spacing.sm,
  },
  completionSkeleton: {
    marginLeft: spacing.xs,
  },
  iconsSkeleton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
});
