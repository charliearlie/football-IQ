/**
 * Compact Match Header for Goalscorer Recall.
 *
 * A minimal single-line header showing match info when keyboard is open.
 * Displays: "Home Team  2 - 2  Away Team"
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts, fontWeights } from '@/theme';

interface CompactMatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export function CompactMatchHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: CompactMatchHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.teamName} numberOfLines={1}>
        {homeTeam}
      </Text>
      <Text style={styles.score}>
        {homeScore} - {awayScore}
      </Text>
      <Text style={[styles.teamName, styles.awayTeam]} numberOfLines={1}>
        {awayTeam}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    gap: spacing.sm,
  },
  teamName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.floodlightWhite,
    maxWidth: 120,
  },
  awayTeam: {
    textAlign: 'right',
  },
  score: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.cardYellow,
    letterSpacing: 1,
  },
});
