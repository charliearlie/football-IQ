/**
 * Profile Header Component
 *
 * Displays user's display name and member since date.
 */

import { View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import { useAuth } from '@/features/auth';

/**
 * Format a date string to a readable format.
 */
function formatMemberSince(dateString: string | null | undefined): string {
  if (!dateString) return 'New member';

  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

export function ProfileHeader() {
  const { profile } = useAuth();
  const displayName = profile?.display_name;

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <User color={colors.floodlightWhite} size={32} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[textStyles.h2, styles.displayName]}>
          {displayName || 'Football Fan'}
        </Text>
        <Text style={[textStyles.caption, styles.memberSince]}>
          {formatMemberSince(profile?.created_at ?? null)}
        </Text>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  displayName: {
    marginBottom: spacing.xs,
  },
  memberSince: {
    opacity: 0.7,
  },
});
