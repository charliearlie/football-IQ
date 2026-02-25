/**
 * Leaderboard Screen
 *
 * Displays real-time rankings for daily score, yearly score, and all-time IQ.
 * Features toggle between views and sticky "Me" bar.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, textStyles, spacing, fonts, fontWeights } from '@/theme';
import { useAuth } from '@/features/auth';
import {
  useLeaderboard,
  useStickyMe,
  LeaderboardToggle,
  LeaderboardList,
  StickyMeBar,
  LeaderboardType,
} from '@/features/leaderboard';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Returns a single compact context line for the given leaderboard type.
 * e.g. "Today · 34 players", "2026 · Cumulative score", "All Time · IQ Points"
 */
function getContextLine(type: LeaderboardType, totalUsers?: number): string {
  switch (type) {
    case 'daily':
      return totalUsers != null ? `Today · ${totalUsers} players` : 'Today';
    case 'yearly':
      return `${CURRENT_YEAR} · Cumulative score`;
    case 'global':
      return 'All Time · IQ Points';
  }
}

/**
 * Main leaderboard screen.
 *
 * Supports URL param `type` to set initial view:
 * - /leaderboard?type=daily (default)
 * - /leaderboard?type=yearly
 * - /leaderboard?type=global
 */
export default function LeaderboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { user, profile } = useAuth();

  // Determine initial type from URL params
  const initialType: LeaderboardType =
    params.type === 'global'
      ? 'global'
      : params.type === 'yearly'
        ? 'yearly'
        : 'daily';
  const [selectedType, setSelectedType] = useState<LeaderboardType>(initialType);

  // Fetch leaderboard data
  const {
    entries,
    userRank,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useLeaderboard({
    type: selectedType,
    enablePolling: true,
  });

  // Manage sticky bar visibility
  const {
    config: stickyConfig,
    onViewableItemsChanged,
    viewabilityConfig,
  } = useStickyMe({
    currentUserId: user?.id,
    entries,
    userRank,
  });

  // Compute gap between user and the entry one rank above them
  const gapToNext = useMemo<number | null>(() => {
    if (!userRank || userRank.rank <= 1) return null;
    const oneAbove = entries.find((e) => e.rank === userRank.rank - 1);
    if (!oneAbove) return null;
    const gap = oneAbove.score - userRank.score;
    return gap > 0 ? gap : null;
  }, [entries, userRank]);

  const contextLine = getContextLine(selectedType, userRank?.totalUsers);

  /**
   * Handle toggle between leaderboard types.
   */
  const handleToggle = useCallback((type: LeaderboardType) => {
    setSelectedType(type);
  }, []);

  /**
   * Navigate back.
   */
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={12}
        >
          <ArrowLeft size={24} color={colors.floodlightWhite} />
        </Pressable>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Toggle */}
      <LeaderboardToggle
        selected={selectedType}
        onSelect={handleToggle}
        testID="leaderboard-toggle"
      />

      {/* Compact context line */}
      <Text style={styles.contextLine}>{contextLine}</Text>

      {/* Leaderboard List */}
      <LeaderboardList
        entries={entries}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        currentUserId={user?.id}
        showGamesPlayed={selectedType === 'daily' || selectedType === 'yearly'}
        type={selectedType}
        error={error}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        testID="leaderboard-list"
      />

      {/* Sticky Me Bar */}
      <StickyMeBar
        userRank={userRank}
        displayName={profile?.display_name ?? 'You'}
        shouldShow={stickyConfig.shouldShowStickyBar}
        leaderboardType={selectedType}
        gapToNext={gapToNext}
        testID="sticky-me"
      />
    </SafeAreaView>
    </>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...textStyles.h1,
    color: colors.floodlightWhite,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  contextLine: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
