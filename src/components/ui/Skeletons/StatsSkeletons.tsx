import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, borderRadius } from '@/theme';
import { SkeletonBox } from './SkeletonBase';

interface ProfileHeaderSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProfileHeaderSkeleton - Skeleton placeholder for ProfileHeader.
 *
 * Dimensions:
 * - Avatar: 56x56px circle
 * - Display name: 140px x 24px
 * - Member since: 100px x 16px
 */
export function ProfileHeaderSkeleton({ testID }: ProfileHeaderSkeletonProps) {
  return (
    <View style={styles.profileHeader} testID={testID}>
      {/* Avatar placeholder - 56x56 circle */}
      <View style={styles.avatarContainer}>
        <SkeletonBox width={56} height={56} circle />
      </View>

      {/* Text placeholders */}
      <View style={styles.profileTextContainer}>
        {/* Display name */}
        <SkeletonBox width={140} height={24} radius={4} style={styles.displayName} />
        {/* Member since */}
        <SkeletonBox width={100} height={16} radius={4} />
      </View>
    </View>
  );
}

interface IQScoreDisplaySkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * IQScoreDisplaySkeleton - Skeleton placeholder for IQScoreDisplay.
 *
 * Dimensions:
 * - Brain icon: 28px circle
 * - "FOOTBALL IQ" label: 100px x 12px
 * - Score: 96px circle
 * - Tier badge: 80px x 24px
 */
export function IQScoreDisplaySkeleton({ testID }: IQScoreDisplaySkeletonProps) {
  return (
    <GlassCard style={styles.iqCard} testID={testID}>
      <View style={styles.iqContent}>
        {/* Icon row */}
        <View style={styles.iqIconRow}>
          <SkeletonBox width={28} height={28} circle />
          <SkeletonBox width={100} height={12} radius={4} style={styles.iqLabel} />
        </View>

        {/* Score - large circle */}
        <View style={styles.iqScoreContainer}>
          <SkeletonBox width={120} height={96} radius={8} />
        </View>

        {/* Tier badge */}
        <SkeletonBox width={80} height={24} radius={borderRadius.full} style={styles.tierBadge} />
      </View>
    </GlassCard>
  );
}

interface ProficiencyBarSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProficiencyBarSkeleton - Skeleton placeholder for a single proficiency bar.
 *
 * Dimensions:
 * - Icon: 16px circle
 * - Label: 100px x 14px
 * - Percentage: 40px x 14px
 * - Bar: full width x 8px
 * - Games played: 60px x 12px
 */
export function ProficiencyBarSkeleton({ testID }: ProficiencyBarSkeletonProps) {
  return (
    <View style={styles.proficiencyBar} testID={testID}>
      {/* Label row */}
      <View style={styles.proficiencyLabelRow}>
        <View style={styles.proficiencyLabelLeft}>
          <SkeletonBox width={16} height={16} circle />
          <SkeletonBox width={100} height={14} radius={4} style={styles.proficiencyLabel} />
        </View>
        <SkeletonBox width={40} height={14} radius={4} />
      </View>

      {/* Progress bar - full width */}
      <SkeletonBox width="100%" height={8} radius={borderRadius.sm} style={styles.progressBar} />

      {/* Games played */}
      <SkeletonBox width={60} height={12} radius={4} style={styles.gamesPlayed} />
    </View>
  );
}

interface ProficiencySectionSkeletonProps {
  /** Number of bars to render (default: 5) */
  barCount?: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProficiencySectionSkeleton - Full skeleton for proficiency section.
 *
 * Renders title placeholder and multiple proficiency bar skeletons.
 */
export function ProficiencySectionSkeleton({
  barCount = 5,
  testID,
}: ProficiencySectionSkeletonProps) {
  return (
    <GlassCard style={styles.proficiencyCard} testID={testID}>
      {/* Section title */}
      <SkeletonBox width={120} height={20} radius={4} style={styles.sectionTitle} />

      {/* Proficiency bars */}
      {Array.from({ length: barCount }).map((_, index) => (
        <ProficiencyBarSkeleton key={`bar-${index}`} />
      ))}
    </GlassCard>
  );
}

interface StatsGridSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * StatsGridSkeleton - Skeleton for the 2x2 stats grid.
 */
export function StatsGridSkeleton({ testID }: StatsGridSkeletonProps) {
  return (
    <View style={styles.statsGrid} testID={testID}>
      <View style={styles.statsRow}>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>
      <View style={styles.statsRow}>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>
    </View>
  );
}

/**
 * StatCardSkeleton - Single stat card skeleton.
 */
function StatCardSkeleton() {
  return (
    <GlassCard style={styles.statCard}>
      <View style={styles.statContent}>
        {/* Icon */}
        <SkeletonBox width={28} height={28} circle />
        {/* Value */}
        <SkeletonBox width={60} height={24} radius={4} style={styles.statValue} />
        {/* Label */}
        <SkeletonBox width={80} height={12} radius={4} />
      </View>
    </GlassCard>
  );
}

interface FullStatsSkeletonProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * FullStatsSkeleton - Complete skeleton for the entire Stats screen.
 */
export function FullStatsSkeleton({ testID }: FullStatsSkeletonProps) {
  return (
    <View style={styles.fullStats} testID={testID}>
      <ProfileHeaderSkeleton />
      <IQScoreDisplaySkeleton />
      <ProficiencySectionSkeleton />
      <StatsGridSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl, // 24px
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg, // 16px
  },
  profileTextContainer: {
    flex: 1,
  },
  displayName: {
    marginBottom: spacing.xs, // 4px
  },

  // IQ Score Display
  iqCard: {
    marginBottom: spacing.xl, // 24px
  },
  iqContent: {
    alignItems: 'center',
  },
  iqIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md, // 12px
  },
  iqLabel: {
    marginLeft: spacing.sm, // 8px
  },
  iqScoreContainer: {
    marginVertical: spacing.md, // 12px
  },
  tierBadge: {
    marginTop: spacing.sm, // 8px
  },

  // Proficiency Bar
  proficiencyBar: {
    marginBottom: spacing.lg, // 16px
  },
  proficiencyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs, // 4px
  },
  proficiencyLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm, // 8px
  },
  proficiencyLabel: {
    marginLeft: spacing.sm, // 8px
  },
  progressBar: {
    marginTop: spacing.xs, // 4px
  },
  gamesPlayed: {
    marginTop: spacing.xs, // 4px
  },

  // Proficiency Section
  proficiencyCard: {
    marginBottom: spacing.xl, // 24px
  },
  sectionTitle: {
    marginBottom: spacing.lg, // 16px
  },

  // Stats Grid
  statsGrid: {
    gap: spacing.md, // 12px
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md, // 12px
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    marginTop: spacing.sm, // 8px
    marginBottom: spacing.xs, // 4px
  },

  // Full Stats
  fullStats: {
    padding: spacing.xl, // 24px
  },
});
