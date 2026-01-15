/**
 * TrophyCase - Horizontal scroll of 3D shield badges
 *
 * Displays key performance metrics as collectible shield badges:
 * - Longest Streak
 * - Perfect Matches
 * - Global Rank
 * - Win Rate
 *
 * Uses the ShieldBadge component with staggered entrance animations.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { Flame, Star, Trophy, Target } from 'lucide-react-native';
import { colors, spacing } from '@/theme';
import { ShieldBadge } from './ShieldBadge';
import { PerformanceStats } from '../../types/stats.types';

// Badge color constants
const BADGE_COLORS = {
  streak: '#FF6B35', // Flame orange
  perfect: colors.cardYellow,
  rank: colors.pitchGreen,
  winRate: '#3B82F6', // Blue for percentage
};

export interface TrophyCaseProps {
  stats: PerformanceStats;
  userRank: { rank: number; totalUsers: number } | null;
  testID?: string;
}

export function TrophyCase({ stats, userRank, testID }: TrophyCaseProps) {
  // Calculate win rate (perfect scores / total puzzles)
  const winRate =
    stats.totalPuzzlesSolved > 0
      ? Math.round((stats.totalPerfectScores / stats.totalPuzzlesSolved) * 100)
      : 0;

  // Format rank display
  const rankDisplay = userRank ? `#${userRank.rank}` : '—';
  const hasRank = userRank !== null;

  // Format streak display
  const streakDisplay =
    stats.longestStreak > 0 ? `${stats.longestStreak}` : '0';
  const hasStreak = stats.longestStreak > 0;

  // Check if user has any perfect scores
  const hasPerfect = stats.totalPerfectScores > 0;

  // Base animation delay (400ms after radar chart)
  const BASE_DELAY = 400;
  const STAGGER = 100; // 100ms between each badge

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
      testID={testID}
    >
      {/* Longest Streak */}
      <ShieldBadge
        icon={<Flame size={24} color={hasStreak ? colors.stadiumNavy : colors.floodlightWhite} />}
        value={streakDisplay}
        label="Streak"
        color={BADGE_COLORS.streak}
        isEarned={hasStreak}
        animationDelay={BASE_DELAY}
        testID={`${testID}-streak`}
      />

      {/* Perfect Matches */}
      <ShieldBadge
        icon={<Star size={24} color={hasPerfect ? colors.stadiumNavy : colors.floodlightWhite} />}
        value={stats.totalPerfectScores.toString()}
        label="Perfect"
        color={BADGE_COLORS.perfect}
        isEarned={hasPerfect}
        animationDelay={BASE_DELAY + STAGGER}
        testID={`${testID}-perfect`}
      />

      {/* Global Rank */}
      <ShieldBadge
        icon={<Trophy size={24} color={hasRank ? colors.stadiumNavy : colors.floodlightWhite} />}
        value={rankDisplay}
        label="Rank"
        color={BADGE_COLORS.rank}
        isEarned={hasRank}
        animationDelay={BASE_DELAY + STAGGER * 2}
        testID={`${testID}-rank`}
      />

      {/* Win Rate */}
      <ShieldBadge
        icon={
          <Target
            size={24}
            color={winRate > 0 ? colors.stadiumNavy : colors.floodlightWhite}
          />
        }
        value={`${winRate}%`}
        label="Win %"
        color={BADGE_COLORS.winRate}
        isEarned={winRate > 0}
        animationDelay={BASE_DELAY + STAGGER * 3}
        testID={`${testID}-winrate`}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -spacing.xl, // Extend to screen edges
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm, // Space for 3D depth
    gap: spacing.md,
    alignItems: 'flex-start',
  },
});
