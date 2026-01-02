import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';
import {
  usePerformanceStats,
  ProfileHeader,
  IQScoreDisplay,
  ProficiencySection,
  TrophyRoom,
  StatsGrid,
} from '@/features/stats';

/**
 * My IQ Screen
 *
 * Comprehensive profile screen showing Football IQ score,
 * proficiency across game modes, badges, and statistics.
 */
export default function MyIQScreen() {
  const insets = useSafeAreaInsets();
  const { stats, isLoading, refresh } = usePerformanceStats();

  // Loading state
  if (isLoading && !stats) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={[textStyles.body, styles.loadingText]}>
          Calculating your Football IQ...
        </Text>
      </View>
    );
  }

  // Empty state (no games played yet)
  if (!stats || stats.totalPuzzlesSolved === 0) {
    return (
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
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
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
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

      <ProficiencySection proficiencies={stats.proficiencies} />

      <TrophyRoom badges={stats.badges} />

      <StatsGrid
        puzzlesSolved={stats.totalPuzzlesSolved}
        perfectScores={stats.totalPerfectScores}
        totalPoints={stats.totalPoints}
        currentStreak={stats.currentStreak}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    opacity: 0.7,
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
});
