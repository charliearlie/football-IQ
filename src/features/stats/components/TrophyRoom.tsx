/**
 * Trophy Room Component
 *
 * Horizontal scrollable list of earned and unearned badges.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Flame,
  Search,
  DollarSign,
  Clock,
  Grid3X3,
  MessageCircle,
  Award,
  Trophy,
  LucideIcon,
} from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { GlassCard } from '@/components';
import { Badge } from '../types/stats.types';

interface TrophyRoomProps {
  badges: Badge[];
}

/**
 * Get icon component by name.
 */
function getIconByName(iconName: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    Flame,
    Search,
    DollarSign,
    Clock,
    Grid3X3,
    MessageCircle,
    Award,
    Trophy,
  };
  return icons[iconName] || Award;
}

interface BadgeItemProps {
  badge: Badge;
}

function BadgeItem({ badge }: BadgeItemProps) {
  const IconComponent = getIconByName(badge.icon);
  const isEarned = badge.earnedAt !== null;

  return (
    <View style={[styles.badgeContainer, !isEarned && styles.badgeUnearned]}>
      <View
        style={[
          styles.badgeIcon,
          isEarned ? styles.badgeIconEarned : styles.badgeIconUnearned,
        ]}
      >
        <IconComponent
          color={isEarned ? colors.stadiumNavy : colors.textSecondary}
          size={24}
          strokeWidth={2}
        />
      </View>
      <Text
        style={[
          textStyles.caption,
          styles.badgeName,
          !isEarned && styles.badgeNameUnearned,
        ]}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}

export function TrophyRoom({ badges }: TrophyRoomProps) {
  const earnedCount = badges.filter((b) => b.earnedAt !== null).length;

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={[textStyles.h3, styles.title]}>Trophy Room</Text>
        <Text style={[textStyles.caption, styles.count]}>
          {earnedCount}/{badges.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {badges.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </ScrollView>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {},
  count: {
    color: colors.pitchGreen,
  },
  scrollContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  badgeContainer: {
    alignItems: 'center',
    width: 72,
  },
  badgeUnearned: {
    opacity: 0.4,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeIconEarned: {
    backgroundColor: colors.cardYellow,
  },
  badgeIconUnearned: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  badgeName: {
    textAlign: 'center',
    color: colors.floodlightWhite,
  },
  badgeNameUnearned: {
    color: colors.textSecondary,
  },
});
