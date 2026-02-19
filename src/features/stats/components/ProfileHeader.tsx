/**
 * Profile Header Component
 *
 * Displays user's display name and member since date.
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '@/theme';
import { fonts } from '@/theme/typography';
import { useAuth } from '@/features/auth';
import { ProBadge } from '@/components/ProBadge';
import { getTierForPoints, getTierColor } from '@/features/stats/utils/tierProgression';

/**
 * Format a date string to a readable format.
 */
function formatMemberSince(dateString: string | null | undefined): string {
  if (!dateString) return 'Football IQ Member';

  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

export function ProfileHeader() {
  const { profile, totalIQ } = useAuth();
  const displayName = profile?.display_name;
  const isPremium = profile?.is_premium ?? false;
  const tier = getTierForPoints(totalIQ);
  const tierColor = getTierColor(tier.tier);
  const initial = displayName?.charAt(0).toUpperCase() || 'F';

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, isPremium && styles.avatarPremium]}>
        <Text style={styles.avatarInitial}>{initial}</Text>
        {isPremium && (
          <View style={styles.proBadgeOverlay}>
            <ProBadge size={12} color={colors.stadiumNavy} />
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.nameRow}>
          <Text style={[textStyles.h2, styles.displayName]}>
            {displayName || 'Football Fan'}
          </Text>
        </View>
        <Text style={[textStyles.caption, styles.memberSince]}>
          {formatMemberSince(profile?.created_at ?? null)}
        </Text>
        <View style={styles.tierBadge}>
          <Text style={[styles.tierText, { color: tierColor }]}>{tier.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarPremium: {
    borderWidth: 2.5,
    borderColor: colors.cardYellow,
  },
  avatarInitial: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
  },
  proBadgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.cardYellow,
    borderWidth: 2,
    borderColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    marginBottom: spacing.xs,
  },
  memberSince: {
    opacity: 0.7,
  },
  tierBadge: {
    backgroundColor: 'rgba(88, 204, 2, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  tierText: {
    fontFamily: fonts.headline,
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
