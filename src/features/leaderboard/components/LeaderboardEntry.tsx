/**
 * LeaderboardEntry Component
 *
 * Single row in the leaderboard list showing rank, avatar, name, and score.
 * Top 3 ranks get medal icons instead of numbers.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { User, Medal } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { GlassCard } from '@/components/GlassCard';
import { LeaderboardEntry as EntryType } from '../types/leaderboard.types';

interface LeaderboardEntryProps {
  /** Entry data */
  entry: EntryType;
  /** Whether this is the current user's row */
  isCurrentUser?: boolean;
  /** Whether to show games played count */
  showGamesPlayed?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/** Medal colors for top 3 ranks */
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

/**
 * Render rank badge - medal for top 3, number otherwise.
 */
function RankBadge({
  rank,
  testID,
}: {
  rank: number;
  testID?: string;
}) {
  const medalColor = MEDAL_COLORS[rank as keyof typeof MEDAL_COLORS];

  if (medalColor) {
    const medalType = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
    return (
      <View style={styles.rankBadge} testID={`${testID}-medal-${medalType}`}>
        <Medal size={24} color={medalColor} fill={medalColor} />
      </View>
    );
  }

  return (
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>#{rank}</Text>
    </View>
  );
}

/**
 * Render avatar or placeholder.
 */
function Avatar({
  avatarUrl,
  testID,
}: {
  avatarUrl: string | null;
  testID?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatar}
        testID={`${testID}-avatar`}
      />
    );
  }

  return (
    <View style={styles.avatarPlaceholder} testID={`${testID}-avatar-placeholder`}>
      <User size={20} color={colors.textSecondary} />
    </View>
  );
}

/**
 * Single leaderboard entry row.
 *
 * Shows:
 * - Rank (medal for top 3)
 * - Avatar (or placeholder)
 * - Display name
 * - Score
 * - Games played badge (optional, for daily leaderboard)
 */
export function LeaderboardEntry({
  entry,
  isCurrentUser = false,
  showGamesPlayed = false,
  testID,
}: LeaderboardEntryProps) {
  const containerStyle = useMemo((): ViewStyle => ({
    ...styles.container,
    ...(isCurrentUser ? styles.containerCurrentUser : {}),
  }), [isCurrentUser]);

  return (
    <GlassCard
      style={containerStyle}
      testID={`${testID}-container`}
    >
      <View style={styles.leftSection}>
        <RankBadge rank={entry.rank} testID={testID} />
        <Avatar avatarUrl={entry.avatarUrl} testID={testID} />
        <View style={styles.nameSection}>
          <Text
            style={[styles.name, isCurrentUser && styles.nameCurrentUser]}
            numberOfLines={1}
          >
            {entry.displayName}
          </Text>
          {showGamesPlayed && entry.gamesPlayed !== undefined && (
            <Text style={styles.gamesPlayed}>
              {entry.gamesPlayed}/5
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.score, isCurrentUser && styles.scoreCurrentUser]}>
          {entry.score}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  containerCurrentUser: {
    borderColor: colors.pitchGreen,
    borderWidth: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...textStyles.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  nameSection: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '500',
  },
  nameCurrentUser: {
    color: colors.pitchGreen,
  },
  gamesPlayed: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  score: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
  },
  scoreCurrentUser: {
    color: colors.pitchGreen,
  },
});
