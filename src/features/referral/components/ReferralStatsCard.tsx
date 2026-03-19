/**
 * ReferralStatsCard
 *
 * Displays referral progress in the Settings screen.
 * Shows how many friends have been referred and pending rewards.
 */

import React, { useCallback } from 'react';
import { Share, Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { UserPlus, Gift } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/theme';
import { useReferralCode } from '../hooks/useReferralCode';
import { useReferralStats } from '../hooks/useReferralStats';

const REFERRAL_BASE_URL = 'https://football-iq.app/app/ref';

interface ReferralStatsCardProps {
  userId: string | null;
}

export function ReferralStatsCard({ userId }: ReferralStatsCardProps) {
  const { code, loading: codeLoading } = useReferralCode(userId);
  const { stats, loading: statsLoading } = useReferralStats(userId);

  const handleShare = useCallback(async () => {
    if (!code) return;

    const url = `${REFERRAL_BASE_URL}/${code}`;
    const message = `Think you know football? Prove it on Football IQ — 11 game modes, daily puzzles. Join me: ${url}`;

    try {
      await Share.share({ message });
    } catch (err) {
      console.warn('[ReferralStatsCard] Share failed:', err);
    }
  }, [code]);

  const loading = codeLoading || statsLoading;
  const totalReferrals = stats?.totalReferrals ?? 0;
  const archiveUnlocks = stats?.archiveUnlocksAvailable ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserPlus size={20} color={colors.pitchGreen} strokeWidth={2} />
        <Text style={styles.title}>Invite Friends</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.pitchGreen} style={styles.loader} />
      ) : (
        <>
          <Text style={styles.description}>
            Earn 3 archive unlocks for every friend who joins and plays a game.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalReferrals}</Text>
              <Text style={styles.statLabel}>
                {totalReferrals === 1 ? 'Friend Referred' : 'Friends Referred'}
              </Text>
            </View>
            {archiveUnlocks > 0 && (
              <View style={styles.statItem}>
                <View style={styles.rewardBadge}>
                  <Gift size={14} color={colors.pitchGreen} />
                  <Text style={styles.rewardValue}>{archiveUnlocks}</Text>
                </View>
                <Text style={styles.statLabel}>Unlocks Earned</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.shareButton, pressed && styles.sharePressed]}
            disabled={!code}
            accessibilityRole="button"
            accessibilityLabel="Share referral link"
          >
            <UserPlus size={16} color={colors.stadiumNavy} strokeWidth={2.5} />
            <Text style={styles.shareText}>Share Invite Link</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderRadius: 12,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.pitchGreen,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.pitchGreen,
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  sharePressed: {
    opacity: 0.8,
  },
  shareText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.stadiumNavy,
  },
});
