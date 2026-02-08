/**
 * ResultShareCard Component
 *
 * A shareable image card for puzzle completion results.
 * Designed to be captured with ViewShot and shared to social media.
 *
 * Features:
 * - Game mode icon and name
 * - Result status (Perfect Score, Complete, etc.)
 * - Score display text (e.g., "3 of 8 clubs revealed")
 * - User's current tier and IQ
 * - Website URL for user acquisition
 */

import { View, Text, StyleSheet } from 'react-native';
import {
  Trophy,
  CheckCircle,
  XCircle,
  Star,
  type LucideIcon,
  Search,
  ShieldCheck,
  TrendingUp,
  Clock,
  Grid3X3,
  Link,
  Shirt,
  Newspaper,
  ListOrdered,
  Users,
} from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { getTierForPoints, getTierColor } from '@/features/stats/utils/tierProgression';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { GAME_MODE_DISPLAY } from '@/features/stats/types/stats.types';

/**
 * Game mode icons
 */
const GAME_MODE_ICONS: Record<GameMode, LucideIcon> = {
  career_path: Search,
  career_path_pro: ShieldCheck,
  guess_the_transfer: TrendingUp,
  guess_the_goalscorers: Clock,
  the_grid: Grid3X3,
  the_chain: Link,
  the_thread: Shirt,
  topical_quiz: Newspaper,
  top_tens: ListOrdered,
  starting_xi: Users,
};

export type ResultShareType = 'perfect' | 'win' | 'complete' | 'loss';

export interface ResultShareCardProps {
  /** Game mode identifier */
  gameMode: GameMode;
  /** Result type for styling */
  resultType: ResultShareType;
  /** Score display text (e.g., "3 of 8 clubs revealed" or "5 of 10 found") */
  scoreDisplay: string;
  /** Puzzle date (YYYY-MM-DD) */
  puzzleDate: string;
  /** User's display name */
  displayName: string;
  /** User's total IQ points */
  totalIQ: number;
  /** Whether this is a perfect score */
  isPerfectScore?: boolean;
  /** Whether user advanced a tier */
  isTierAdvancement?: boolean;
  /** New streak count (if streak-worthy) */
  newStreakDays?: number;
  /** Test ID */
  testID?: string;
}

/**
 * Get result icon based on type.
 */
function getResultIcon(resultType: ResultShareType): LucideIcon {
  switch (resultType) {
    case 'perfect':
      return Star;
    case 'win':
      return Trophy;
    case 'complete':
      return CheckCircle;
    case 'loss':
      return XCircle;
  }
}

/**
 * Get result color based on type.
 */
function getResultColor(resultType: ResultShareType): string {
  switch (resultType) {
    case 'perfect':
      return '#FFD700'; // Gold
    case 'win':
      return colors.pitchGreen;
    case 'complete':
      return colors.pitchGreen;
    case 'loss':
      return colors.redCard;
  }
}

/**
 * Get result title based on type.
 */
function getResultTitle(resultType: ResultShareType): string {
  switch (resultType) {
    case 'perfect':
      return 'PERFECT SCORE!';
    case 'win':
      return 'COMPLETE!';
    case 'complete':
      return 'COMPLETE!';
    case 'loss':
      return 'GAME OVER';
  }
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Result Share Card for ViewShot capture.
 */
export function ResultShareCard({
  gameMode,
  resultType,
  scoreDisplay,
  puzzleDate,
  displayName,
  totalIQ,
  isPerfectScore,
  isTierAdvancement,
  newStreakDays,
  testID,
}: ResultShareCardProps) {
  const tier = getTierForPoints(totalIQ);
  const tierColor = getTierColor(tier.tier);
  const resultColor = getResultColor(resultType);
  const ResultIcon = getResultIcon(resultType);
  const GameModeIcon = GAME_MODE_ICONS[gameMode];
  const gameModeName = GAME_MODE_DISPLAY[gameMode].displayName;
  const resultTitle = getResultTitle(resultType);

  return (
    <View style={[styles.card, { borderColor: resultColor }]} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>FOOTBALL IQ</Text>
      </View>

      {/* Game Mode */}
      <View style={styles.gameModeSection}>
        <View style={[styles.gameModeIcon, { backgroundColor: `${resultColor}20` }]}>
          <GameModeIcon size={20} color={resultColor} strokeWidth={2} />
        </View>
        <Text style={styles.gameModeName}>{gameModeName}</Text>
      </View>

      {/* Result Icon and Title */}
      <View style={styles.resultSection}>
        <View style={[styles.resultIconContainer, { backgroundColor: resultColor }]}>
          <ResultIcon size={28} color={colors.stadiumNavy} strokeWidth={2} />
        </View>
        <Text style={[styles.resultTitle, { color: resultColor }]}>
          {resultTitle}
        </Text>

        {/* Achievement badges */}
        {isPerfectScore && resultType !== 'perfect' && (
          <View style={styles.achievementBadge}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.achievementText}>Perfect!</Text>
          </View>
        )}
        {isTierAdvancement && (
          <View style={[styles.achievementBadge, { backgroundColor: `${tierColor}20` }]}>
            <Text style={[styles.achievementText, { color: tierColor }]}>
              Tier Up!
            </Text>
          </View>
        )}
      </View>

      {/* Score Display */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreDisplay}>{scoreDisplay}</Text>
        <Text style={styles.dateText}>{formatDate(puzzleDate)}</Text>
      </View>

      {/* Streak badge (if applicable) */}
      {newStreakDays && newStreakDays >= 3 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{newStreakDays} Day Streak</Text>
        </View>
      )}

      {/* Footer with tier info */}
      <View style={styles.footer}>
        <View style={styles.tierInfo}>
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.tierSeparator}>|</Text>
          <Text style={styles.iqText}>{totalIQ.toLocaleString()} IQ</Text>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.footerLink}>football-iq.app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a2744',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    minWidth: 280,
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.md,
  },
  appTitle: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.pitchGreen,
    letterSpacing: 2,
  },
  gameModeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gameModeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  gameModeName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: {
    fontFamily: fonts.headline,
    fontSize: 24,
    letterSpacing: 1,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  achievementText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: '#FFD700',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreDisplay: {
    fontFamily: fonts.body,
    fontSize: 20,
    color: colors.floodlightWhite,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 16,
    color: colors.floodlightWhite,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  streakText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: '#FF6B35',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  tierName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: colors.floodlightWhite,
  },
  tierSeparator: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  iqText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  displayName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footerLink: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 10,
    color: colors.pitchGreen,
    letterSpacing: 0.5,
  },
});
