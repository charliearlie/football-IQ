/**
 * ScoutingReportCard Component
 *
 * A shareable image card displaying the user's complete Football IQ profile.
 * Designed to be captured with ViewShot for social sharing.
 *
 * Features:
 * - Tier badge with progression tier (Trialist → GOAT)
 * - Total IQ points
 * - Scouting Archetype (dominant game mode)
 * - Field Experience (total completed puzzles)
 * - Current streak
 * - Deep link for user acquisition
 */

import { View, Text, StyleSheet } from 'react-native';
import {
  Brain,
  Flame,
  Trophy,
  type LucideIcon,
  Search,
  ShieldCheck,
  TrendingUp,
  Clock,
  Grid3X3,
  Newspaper,
  ListOrdered,
  Users,
} from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { getTierForPoints, getTierColor } from '../utils/tierProgression';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Archetype icons for each game mode.
 */
const ARCHETYPE_ICONS: Record<GameMode, LucideIcon> = {
  career_path: Search,
  career_path_pro: ShieldCheck,
  guess_the_transfer: TrendingUp,
  guess_the_goalscorers: Clock,
  the_grid: Grid3X3,
  topical_quiz: Newspaper,
  top_tens: ListOrdered,
  starting_xi: Users,
};

/**
 * Archetype names for each game mode.
 */
const ARCHETYPE_NAMES: Record<GameMode, string> = {
  career_path: 'Detective',
  career_path_pro: 'Master Detective',
  guess_the_transfer: 'Market Analyst',
  guess_the_goalscorers: 'Historian',
  the_grid: 'Pattern Master',
  topical_quiz: 'News Hound',
  top_tens: 'Statistician',
  starting_xi: 'Tactical Mind',
};

export interface ScoutingReportData {
  /** User's display name */
  displayName: string;
  /** Total cumulative IQ points (0-20,000+) */
  totalIQ: number;
  /** Dominant game mode archetype, or null if no games played */
  archetypeMode: GameMode | null;
  /** Total completed puzzles across all modes */
  totalAppearances: number;
  /** Current day streak */
  currentStreak: number;
  /** User ID for deep link generation (optional) */
  userId?: string;
}

export interface ScoutingReportCardProps {
  /** Scouting report data to display */
  data: ScoutingReportData;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Stat row component for consistent styling.
 */
function StatRow({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Icon size={16} color={iconColor} strokeWidth={2} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/**
 * Generate deep link URL for the scouting report.
 */
export function generateDeepLink(userId?: string): string {
  return `footballiq://scout/${userId || 'anonymous'}`;
}

/**
 * Scouting Report Card for ViewShot capture and sharing.
 */
export function ScoutingReportCard({ data, testID }: ScoutingReportCardProps) {
  const tier = getTierForPoints(data.totalIQ);
  const tierColor = getTierColor(tier.tier);

  // Get archetype info
  const archetypeName = data.archetypeMode
    ? ARCHETYPE_NAMES[data.archetypeMode]
    : 'Rookie Scout';
  const ArchetypeIcon = data.archetypeMode
    ? ARCHETYPE_ICONS[data.archetypeMode]
    : Search;

  // Format IQ with commas
  const formattedIQ = data.totalIQ.toLocaleString();

  return (
    <View style={styles.card} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FOOTBALL IQ</Text>
        <Text style={styles.headerSubtitle}>SCOUT REPORT</Text>
      </View>

      {/* Tier Section */}
      <View style={styles.tierSection}>
        <Brain size={40} color={tierColor} strokeWidth={1.5} />
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierName}>{tier.name}</Text>
        </View>
      </View>

      {/* Display Name */}
      <Text style={styles.displayName}>{data.displayName}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatRow
          icon={ArchetypeIcon}
          iconColor={colors.cardYellow}
          label="Archetype"
          value={archetypeName}
        />
        <StatRow
          icon={Trophy}
          iconColor={colors.pitchGreen}
          label="Total IQ Accumulated"
          value={formattedIQ}
        />
        {data.currentStreak > 0 && (
          <StatRow
            icon={Flame}
            iconColor="#FF6B35"
            label="Current Streak"
            value={`${data.currentStreak} Days`}
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>football-iq-phi.vercel.app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a2744',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    width: 320,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.pitchGreen,
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  tierSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  tierName: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.stadiumNavy,
    letterSpacing: 1,
  },
  displayName: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md,
  },
  statsSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  footerText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.pitchGreen,
    letterSpacing: 1,
  },
});
