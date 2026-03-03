/**
 * BestDayCard - Highlights the user's single best day of performance.
 *
 * Shows the date on which the user recorded the most perfect scores,
 * alongside total games played that day. Part of the Scout Report
 * "Deep Dive" zone.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { BestDayInfo } from '../types/scoutReport.types';

export interface BestDayCardProps {
  bestDay: BestDayInfo;
  testID?: string;
}

function formatBestDayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function BestDayCard({ bestDay, testID }: BestDayCardProps) {
  const { date, perfectCount, totalGames } = bestDay;
  const formattedDate = formatBestDayDate(date);

  return (
    <View style={styles.container} testID={testID}>
      {/* Icon + label row */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Star size={16} color={colors.cardYellow} strokeWidth={2} fill={colors.cardYellow} />
        </View>
        <Text style={styles.label}>Your best day</Text>
      </View>

      {/* Primary value */}
      <Text style={styles.perfectCount}>
        {perfectCount} {perfectCount === 1 ? 'perfect' : 'perfects'}
      </Text>

      {/* Date */}
      <Text style={styles.date}>{formattedDate}</Text>

      {/* Total games played */}
      <Text style={styles.totalGames}>
        {totalGames} {totalGames === 1 ? 'game' : 'games'} played that day
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  perfectCount: {
    fontFamily: fonts.stats,
    fontSize: 28,
    color: colors.floodlightWhite,
    marginBottom: spacing.xs,
  },
  date: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalGames: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
