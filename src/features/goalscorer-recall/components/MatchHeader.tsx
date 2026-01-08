/**
 * Match Header component for Goalscorer Recall.
 *
 * Displays match info in a GlassCard:
 * - Home Team | Score | Away Team
 * - Competition
 * - Match Date
 */

import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '@/components';
import { colors, textStyles, spacing, fonts } from '@/theme';

interface MatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  matchDate: string;
}

export function MatchHeader({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  competition,
  matchDate,
}: MatchHeaderProps) {
  return (
    <GlassCard style={styles.container}>
      {/* Teams and Score */}
      <View style={styles.teamsRow}>
        <View style={styles.teamContainer}>
          <Text style={[textStyles.subtitle, styles.teamName]} numberOfLines={1}>
            {homeTeam}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.score}>
            {homeScore} - {awayScore}
          </Text>
        </View>

        <View style={styles.teamContainer}>
          <Text
            style={[textStyles.subtitle, styles.teamName, styles.awayTeam]}
            numberOfLines={1}
          >
            {awayTeam}
          </Text>
        </View>
      </View>

      {/* Competition and Date */}
      <View style={styles.detailsRow}>
        <Text style={[textStyles.caption, styles.competition]}>{competition}</Text>
        <Text style={[textStyles.caption, styles.date]}>{matchDate}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  teamContainer: {
    flex: 1,
  },
  teamName: {
    color: colors.floodlightWhite,
  },
  awayTeam: {
    textAlign: 'right',
  },
  scoreContainer: {
    paddingHorizontal: spacing.lg,
  },
  score: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.cardYellow,
    letterSpacing: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competition: {
    color: colors.floodlightWhite,
    opacity: 0.7,
  },
  date: {
    color: colors.floodlightWhite,
    opacity: 0.7,
  },
});
