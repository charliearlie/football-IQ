import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trophy, Share2 } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';
import {
  usePerformanceStats,
  ProfileHeader,
  IQScoreDisplay,
  ProficiencySection,
  TrophyRoom,
  StatsGrid,
  IQCardOverlay,
} from '@/features/stats';
import { IQCardData } from '@/features/stats/utils/shareIQ';
import { useAuth } from '@/features/auth';
import { getUserRank } from '@/features/leaderboard';
import { FullStatsSkeleton } from '@/components/ui/Skeletons';

/**
 * My IQ Screen
 *
 * Comprehensive profile screen showing Football IQ score,
 * proficiency across game modes, badges, and statistics.
 *
 * Fix: Uses SafeAreaView with edges={['top']} instead of manual
 * paddingTop to prevent double spacing issue.
 */
export default function MyIQScreen() {
  const router = useRouter();
  const { stats, isLoading, refresh } = usePerformanceStats();
  const { profile, user } = useAuth();

  // IQ Card modal state
  const [showIQCard, setShowIQCard] = useState(false);
  const [userRank, setUserRank] = useState<{ rank: number; totalUsers: number } | null>(null);

  // Fetch user's global rank when stats are loaded
  useEffect(() => {
    async function fetchRank() {
      if (!user?.id || !stats?.globalIQ) return;

      const result = await getUserRank(user.id, 'global');
      if (result) {
        setUserRank({ rank: result.rank, totalUsers: result.totalUsers });
      }
    }

    fetchRank();
  }, [user?.id, stats?.globalIQ]);

  /**
   * Navigate to the leaderboard screen.
   */
  const handleLeaderboardPress = () => {
    router.push('/leaderboard');
  };

  /**
   * Open the IQ Card share modal.
   */
  const handleSharePress = useCallback(() => {
    setShowIQCard(true);
  }, []);

  /**
   * Close the IQ Card share modal.
   */
  const handleCloseIQCard = useCallback(() => {
    setShowIQCard(false);
  }, []);

  /**
   * Get top badge name for IQ card.
   */
  const getTopBadgeName = (): string | null => {
    if (!stats?.badges || stats.badges.length === 0) return null;
    // Return the first earned badge name (earnedAt is set when badge is earned)
    const earnedBadge = stats.badges.find(b => b.earnedAt != null);
    return earnedBadge?.name ?? null;
  };

  /**
   * Build IQ Card data from current stats.
   */
  const iqCardData: IQCardData | null = stats ? {
    globalIQ: stats.globalIQ,
    currentStreak: stats.currentStreak,
    rank: userRank?.rank ?? null,
    totalUsers: userRank?.totalUsers ?? null,
    topBadgeName: getTopBadgeName(),
    displayName: profile?.display_name ?? 'Football Fan',
  } : null;

  // Loading state with skeleton
  if (isLoading && !stats) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My IQ</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FullStatsSkeleton testID="stats-skeleton" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Empty state (no games played yet)
  if (!stats || stats.totalPuzzlesSolved === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.pitchGreen}
            />
          }
        >
          <ProfileHeader />
          <GlassCard style={styles.emptyState}>
            <Text style={[textStyles.h2, styles.emptyTitle]}>
              Ready to Test Your Football IQ?
            </Text>
            <Text style={[textStyles.body, styles.emptyText]}>
              Play daily puzzles to build your profile. Your stats will appear here
              as you complete games.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Leaderboard Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My IQ</Text>
        <Pressable
          onPress={handleLeaderboardPress}
          style={styles.leaderboardButton}
          hitSlop={12}
        >
          <Trophy size={24} color={colors.cardYellow} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.pitchGreen}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader />

        <IQScoreDisplay score={stats.globalIQ} />

        {/* Share IQ Button */}
        <Pressable
          onPress={handleSharePress}
          style={styles.shareButton}
          accessibilityLabel="Share My IQ"
          accessibilityRole="button"
        >
          <Share2 size={18} color={colors.floodlightWhite} />
          <Text style={styles.shareButtonText}>Share My IQ</Text>
        </Pressable>

        <ProficiencySection proficiencies={stats.proficiencies} />

        <TrophyRoom badges={stats.badges} />

        <StatsGrid
          puzzlesSolved={stats.totalPuzzlesSolved}
          perfectScores={stats.totalPerfectScores}
          totalPoints={stats.totalPoints}
          currentStreak={stats.currentStreak}
        />
      </ScrollView>

      {/* IQ Card Share Modal */}
      {iqCardData && (
        <IQCardOverlay
          visible={showIQCard}
          onClose={handleCloseIQCard}
          data={iqCardData}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.floodlightWhite,
  },
  leaderboardButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  shareButtonText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
  },
});
