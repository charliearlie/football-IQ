/**
 * LeaderboardEntry Component
 *
 * Single row in the leaderboard list showing rank, avatar, name, and score.
 * Top 3 ranks get colored disc badges with rank numbers and podium treatment.
 * Current user gets a green left accent bar and green text.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { User } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing } from '@/theme';
import { LeaderboardEntry as EntryType, LeaderboardType } from '../types/leaderboard.types';

interface LeaderboardEntryProps {
  /** Entry data */
  entry: EntryType;
  /** Whether this is the current user's row */
  isCurrentUser?: boolean;
  /** Whether to show games played count */
  showGamesPlayed?: boolean;
  /** Leaderboard type for score formatting */
  leaderboardType?: LeaderboardType;
  /** Test ID for testing */
  testID?: string;
}

/** Medal colors for top 3 ranks */
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
} as const;

type MedalRank = keyof typeof MEDAL_COLORS;

/** Background tints for top 3 rows */
const PODIUM_BACKGROUNDS: Record<MedalRank, string> = {
  1: 'rgba(255, 215, 0, 0.06)',
  2: 'rgba(192, 192, 192, 0.05)',
  3: 'rgba(205, 127, 50, 0.05)',
};

/** Disc background colors for top 3 rank badges */
const DISC_BACKGROUNDS: Record<MedalRank, string> = {
  1: 'rgba(255, 215, 0, 0.15)',
  2: 'rgba(192, 192, 192, 0.12)',
  3: 'rgba(205, 127, 50, 0.12)',
};

/** Disc border colors for top 3 rank badges */
const DISC_BORDERS: Record<MedalRank, string> = {
  1: 'rgba(255, 215, 0, 0.40)',
  2: 'rgba(192, 192, 192, 0.35)',
  3: 'rgba(205, 127, 50, 0.35)',
};

function isMedalRank(rank: number): rank is MedalRank {
  return rank === 1 || rank === 2 || rank === 3;
}

/**
 * Render rank badge — colored disc for top 3, muted "#N" text for ranks 4+.
 */
function RankBadge({ rank, testID }: { rank: number; testID?: string }) {
  if (isMedalRank(rank)) {
    const medalType = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze';
    return (
      <View
        style={[
          styles.rankDisc,
          {
            backgroundColor: DISC_BACKGROUNDS[rank],
            borderColor: DISC_BORDERS[rank],
          },
        ]}
        testID={`${testID}-medal-${medalType}`}
      >
        <Text
          style={[styles.rankDiscText, { color: MEDAL_COLORS[rank] }]}
        >
          {rank}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.rankCol}>
      <Text style={styles.rankText}>#{rank}</Text>
    </View>
  );
}

/**
 * Render avatar or placeholder. Top 3 get a medal-color border.
 */
function Avatar({
  avatarUrl,
  rank,
  testID,
}: {
  avatarUrl: string | null;
  rank: number;
  testID?: string;
}) {
  const isTop3 = isMedalRank(rank);
  const size = isTop3 ? 40 : 36;
  const borderStyle = isTop3
    ? { borderWidth: 2, borderColor: MEDAL_COLORS[rank as MedalRank] }
    : undefined;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          borderStyle,
        ]}
        testID={`${testID}-avatar`}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarPlaceholder,
        { width: size, height: size, borderRadius: size / 2 },
        borderStyle,
      ]}
      testID={`${testID}-avatar-placeholder`}
    >
      <User size={16} color={colors.textSecondary} />
    </View>
  );
}

/**
 * Single leaderboard entry row.
 *
 * Shows:
 * - Rank (colored disc for top 3, muted "#N" for others)
 * - Avatar (medal-colored border for top 3)
 * - Display name + tier name / games played
 * - Score with micro-label
 *
 * Top 3 get tinted backgrounds + left medal-color border.
 * Current user gets pitchGreen left accent bar + green text.
 */
export function LeaderboardEntry({
  entry,
  isCurrentUser = false,
  showGamesPlayed = false,
  leaderboardType = 'daily',
  testID,
}: LeaderboardEntryProps) {
  const isTop3 = isMedalRank(entry.rank);
  const medalColor = isTop3 ? MEDAL_COLORS[entry.rank as MedalRank] : null;

  const scoreValue = entry.score;
  const scoreLabel = leaderboardType === 'global' ? 'IQ' : 'pts';
  const scoreFontSize = isTop3 ? 26 : 22;

  // Determine score color: current user always green, top3 get medal color, others white
  const scoreColor = isCurrentUser
    ? colors.pitchGreen
    : medalColor ?? colors.floodlightWhite;

  // Determine name color
  const nameColor = isCurrentUser ? colors.pitchGreen : colors.floodlightWhite;

  // Left accent bar color
  const accentColor = isCurrentUser
    ? colors.pitchGreen
    : medalColor;

  const rowPaddingVertical = isTop3 ? 16 : 12;

  const containerStyle = useMemo(() => {
    const base = {
      paddingVertical: rowPaddingVertical,
      paddingHorizontal: isTop3 || isCurrentUser ? 0 : spacing.lg,
    };

    if (isTop3 && !isCurrentUser) {
      return {
        ...base,
        backgroundColor: PODIUM_BACKGROUNDS[entry.rank as MedalRank],
      };
    }

    return base;
  }, [isTop3, isCurrentUser, rowPaddingVertical, entry.rank]);

  return (
    <View
      style={[styles.row, containerStyle]}
      testID={`${testID}-container`}
    >
      {/* Left accent bar (top3 medal color or current user green) */}
      {accentColor ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : (
        <View style={styles.accentBarSpacer} />
      )}

      {/* Rank badge column */}
      <View style={styles.rankCol}>
        <RankBadge rank={entry.rank} testID={testID} />
      </View>

      {/* Avatar */}
      <Avatar avatarUrl={entry.avatarUrl} rank={entry.rank} testID={testID} />

      {/* Name section */}
      <View style={styles.nameSection}>
        <Text
          style={[styles.name, { color: nameColor }]}
          numberOfLines={1}
        >
          {entry.displayName}
        </Text>

        {/* Tier name for global leaderboard */}
        {leaderboardType === 'global' && entry.tierName !== undefined && (
          <Text
            style={[
              styles.subline,
              entry.tierColor !== undefined ? { color: entry.tierColor } : null,
            ]}
            numberOfLines={1}
          >
            {entry.tierName}
          </Text>
        )}

        {/* Games played for daily/yearly */}
        {showGamesPlayed && leaderboardType !== 'global' && entry.gamesPlayed !== undefined && (
          <Text style={styles.subline}>
            {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'game' : 'games'}
          </Text>
        )}
      </View>

      {/* Score column */}
      <View style={styles.scoreCol}>
        <Text
          style={[
            styles.scoreText,
            { fontSize: scoreFontSize, color: scoreColor },
          ]}
        >
          {scoreValue.toLocaleString()}
        </Text>
        <Text style={styles.scoreLabel}>{scoreLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  accentBarSpacer: {
    width: 3,
  },
  rankCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankDisc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankDiscText: {
    fontFamily: fonts.headline,
    fontSize: 20,
    lineHeight: 22,
  },
  rankText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: 'rgba(248, 250, 252, 0.40)',
  },
  avatar: {
    // width/height/borderRadius set dynamically
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 15,
  },
  subline: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreCol: {
    alignItems: 'flex-end',
    marginRight: spacing.lg,
  },
  scoreText: {
    fontFamily: fonts.headline,
    // fontSize and color set dynamically
  },
  scoreLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    color: 'rgba(248, 250, 252, 0.40)',
    marginTop: 1,
  },
});
