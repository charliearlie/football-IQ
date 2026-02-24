/**
 * Leaderboard Screen
 *
 * Displays real-time rankings for daily score, yearly score, and all-time IQ.
 * Features toggle between views and sticky "Me" bar.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
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
 * Returns the subtitle and score label for the given leaderboard type.
 */
function getSubtitleConfig(type: LeaderboardType): {
  subtitle: string;
  scoreLabel: string;
} {
  switch (type) {
    case 'daily':
      return { subtitle: "Today's Top Players", scoreLabel: 'Score out of 500' };
    case 'yearly':
      return { subtitle: `${CURRENT_YEAR} Rankings`, scoreLabel: `${CURRENT_YEAR} cumulative score` };
    case 'global':
      return { subtitle: 'All-Time IQ Rankings', scoreLabel: 'Cumulative IQ points' };
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

  const subtitleConfig = getSubtitleConfig(selectedType);

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

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>{subtitleConfig.subtitle}</Text>
        <Text style={styles.scoreLabel}>{subtitleConfig.scoreLabel}</Text>
      </View>

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
        testID="sticky-me"
      />
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
  subtitleContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    marginBottom: spacing.xs,
  },
  scoreLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});
