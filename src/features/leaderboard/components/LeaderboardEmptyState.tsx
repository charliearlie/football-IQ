/**
 * LeaderboardEmptyState Component
 *
 * Displays loading, empty, or error states for the leaderboard.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Trophy, AlertCircle } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import { LeaderboardType } from '../types/leaderboard.types';

interface LeaderboardEmptyStateProps {
  /** Whether currently loading */
  isLoading?: boolean;
  /** Error if any */
  error?: Error | null;
  /** Leaderboard type for contextual message */
  type?: LeaderboardType;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Empty state component for leaderboard.
 *
 * Shows:
 * - Loading spinner when fetching data
 * - Error message if fetch failed
 * - Empty message with call to action
 */
export function LeaderboardEmptyState({
  isLoading = false,
  error,
  type = 'daily',
  testID,
}: LeaderboardEmptyStateProps) {
  if (isLoading) {
    return (
      <View style={styles.container} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={styles.message}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container} testID={`${testID}-error`}>
        <AlertCircle size={48} color={colors.cardYellow} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          There was an error loading the leaderboard. Please try again.
        </Text>
      </View>
    );
  }

  const message =
    type === 'daily'
      ? "No rankings yet today. Be the first to play!"
      : "No rankings yet. Complete puzzles to appear on the leaderboard!";

  return (
    <View style={styles.container} testID={`${testID}-empty`}>
      <Trophy size={48} color={colors.cardYellow} />
      <Text style={styles.title}>No rankings yet</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
  },
  title: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
