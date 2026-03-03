import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { TierHistoryEntry } from '../types/scoutReport.types';
import { getTierColor } from '../utils/tierProgression';

interface CareerTimelineProps {
  history: TierHistoryEntry[];
  testID?: string;
}

/**
 * Formats an ISO datetime string as "Mon YYYY" (e.g. "Jan 2026").
 */
function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/**
 * Horizontal scrollable timeline showing when the user reached each tier.
 * Returns null when there is no history to display.
 */
export function CareerTimeline({ history, testID }: CareerTimelineProps) {
  if (history.length === 0) return null;

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {history.map((entry, index) => {
        const dotColor = getTierColor(entry.tierNumber);
        const isLast = index === history.length - 1;

        return (
          <View key={entry.id} style={styles.entryWrapper}>
            {/* Horizontal connector line — hidden after the last node */}
            <View style={styles.lineRow}>
              <View style={[styles.line, isLast && styles.lineHidden]} />
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
            </View>

            {/* Labels below the dot */}
            <View style={styles.labelWrapper}>
              <Text style={styles.tierName} numberOfLines={2}>
                {entry.tierName}
              </Text>
              <Text style={styles.date}>
                {formatMonth(entry.reachedAt)}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const DOT_SIZE = 16;
const LINE_HEIGHT = 1;

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  entryWrapper: {
    alignItems: 'center',
    width: 80,
  },
  lineRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: DOT_SIZE,
  },
  line: {
    position: 'absolute',
    left: '50%',
    right: 0,
    height: LINE_HEIGHT,
    backgroundColor: colors.glassBorder,
  },
  lineHidden: {
    opacity: 0,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    zIndex: 1,
  },
  labelWrapper: {
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tierName: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.floodlightWhite,
    textAlign: 'center',
  },
  date: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
