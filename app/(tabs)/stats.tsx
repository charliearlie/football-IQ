import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Trophy } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import {
  usePerformanceStats,
  IQCardOverlay,
  StreakCalendar,
  getTierForPoints,
} from '@/features/stats';
import {
  ElitePlayerCard,
  TacticalRadarChart,
  TrophyCase,
} from '@/features/stats/components/ScoutReport';
import { IQCardData } from '@/features/stats/utils/shareIQ';
import { useAuth } from '@/features/auth';
import { getUserRank } from '@/features/leaderboard';
import { FullStatsSkeleton } from '@/components/ui/Skeletons';
import { ElevatedButton } from '@/components/ElevatedButton';

/**
 * Scout Report Screen (formerly My IQ)
 *
 * FIFA/EAFC-inspired dashboard showcasing the user's Football Identity.
 * Features:
 * - Elite Player Card with dynamic grade and glow effects
 * - Tactical Radar Chart for proficiency visualization
 * - Trophy Case with 3D shield badges
 * - Season Progress calendar
 */
export default function ScoutReportScreen() {
  const router = useRouter();
  const { stats, isLoading, refresh } = usePerformanceStats();
  const { profile, user, updateDisplayName, totalIQ } = useAuth();

  // IQ Card modal state
  const [showIQCard, setShowIQCard] = useState(false);
  const [userRank, setUserRank] = useState<{ rank: number; totalUsers: number } | null>(null);

  // Display name input state (fallback for missed onboarding)
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  // Check if user needs to set display name (handles null, undefined, and empty string)
  // Also show if profile hasn't loaded yet (profile is null)
  const needsDisplayName = profile === null || !profile.display_name || profile.display_name.trim() === '';


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

  // Refresh stats when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleLeaderboardPress = () => {
    router.push('/leaderboard');
  };

  const handleSharePress = useCallback(() => {
    setShowIQCard(true);
  }, []);

  const handleCloseIQCard = useCallback(() => {
    setShowIQCard(false);
  }, []);

  const handlePremiumPress = useCallback(() => {
    router.push('/premium-modal');
  }, [router]);

  // Handle display name submission (fallback for missed onboarding)
  const handleSetDisplayName = useCallback(async () => {
    const trimmed = displayNameInput.trim();
    if (trimmed.length < 3) {
      setNameError('Name must be at least 3 characters');
      return;
    }
    if (trimmed.length > 30) {
      setNameError('Name must be 30 characters or less');
      return;
    }

    setIsSubmittingName(true);
    setNameError(null);

    try {
      const { error } = await updateDisplayName(trimmed);
      if (error) {
        setNameError('Failed to save. Please try again.');
      }
    } catch {
      setNameError('Failed to save. Please try again.');
    } finally {
      setIsSubmittingName(false);
    }
  }, [displayNameInput, updateDisplayName]);

  /**
   * Get top badge name for IQ card.
   */
  const getTopBadgeName = (): string | null => {
    if (!stats?.badges || stats.badges.length === 0) return null;
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
          <Text style={styles.headerTitle}>Scout Report</Text>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scout Report</Text>
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
          keyboardShouldPersistTaps="handled"
        >
          {needsDisplayName ? (
            /* Display name input - for users who haven't set their name */
            <View style={styles.displayNameSection}>
              <Text style={styles.displayNameHeader}>SET YOUR SCOUT NAME</Text>
              <Text style={styles.displayNameHint}>
                Choose a name for the leaderboard
              </Text>
              <TextInput
                style={[styles.displayNameInput, nameError && styles.inputError]}
                placeholder="Enter your display name"
                placeholderTextColor={colors.textSecondary}
                value={displayNameInput}
                onChangeText={(text) => {
                  setDisplayNameInput(text);
                  if (nameError) setNameError(null);
                }}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSetDisplayName}
                editable={!isSubmittingName}
                testID="display-name-input"
              />
              {nameError && <Text style={styles.nameErrorText}>{nameError}</Text>}
              <ElevatedButton
                title={isSubmittingName ? 'Saving...' : 'Save Name'}
                onPress={handleSetDisplayName}
                disabled={isSubmittingName || displayNameInput.trim().length < 3}
                size="medium"
                fullWidth
                testID="save-display-name-button"
              />
            </View>
          ) : (
            /* Welcome message for users who have set their name */
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeGreeting}>Welcome, {profile?.display_name}!</Text>
              <Text style={styles.welcomeTier}>{getTierForPoints(totalIQ).name}</Text>
            </View>
          )}

          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              Your Scout Report Awaits
            </Text>
            <Text style={styles.emptyText}>
              Complete your first puzzle to unlock your Football IQ stats.
              Your tier, archetype, and progress will appear here.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Leaderboard Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scout Report</Text>
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
        {/* Elite Player Card - FUT-style header with tier crest and progress */}
        <ElitePlayerCard
          displayName={profile?.display_name ?? 'Football Fan'}
          memberSince={profile?.created_at ?? null}
          totalIQ={totalIQ}
          currentStreak={stats.currentStreak}
          userRank={userRank}
          onSharePress={handleSharePress}
          testID="elite-player-card"
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Season Progress Section - moved up for engagement/monetization */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SEASON PROGRESS</Text>
          <StreakCalendar
            isPremium={profile?.is_premium ?? false}
            onPremiumPress={handlePremiumPress}
            variant="embedded"
            testID="streak-calendar"
          />
        </View>

        {/* Tactical Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TACTICAL PROFILE</Text>
          <TacticalRadarChart
            proficiencies={stats.proficiencies}
            testID="tactical-radar"
          />
        </View>

        {/* Trophy Case Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TROPHY CASE</Text>
          <TrophyCase
            stats={stats}
            userRank={userRank}
            testID="trophy-case"
          />
        </View>
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
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.floodlightWhite,
    letterSpacing: 1,
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
    paddingBottom: spacing['3xl'] + 60, // Extra padding for ad banner
  },
  section: {
    marginBottom: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.xl,
  },
  sectionHeader: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.pitchGreen,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  displayNameSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.stadiumNavy,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
  },
  displayNameHeader: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  displayNameHint: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  displayNameInput: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.floodlightWhite,
    fontSize: 18,
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: colors.redCard,
  },
  nameErrorText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.redCard,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  welcomeGreeting: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    marginBottom: spacing.xs,
  },
  welcomeTier: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
