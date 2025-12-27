import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, textStyles, spacing } from '@/theme';
import { StreakHeader, DailyStackCard, useUserStats, useDailyPuzzles } from '@/features/home';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Route map for each game mode.
 */
const ROUTE_MAP: Record<GameMode, string> = {
  career_path: 'career-path',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  tic_tac_toe: 'tic-tac-toe',
  topical_quiz: 'topical-quiz',
};

/**
 * Home Screen - Daily Challenge Dashboard
 *
 * Main landing screen showing:
 * - Streak header with current streak and daily progress
 * - Daily stack of 5 game mode cards with Play/Resume/Done states
 *
 * Automatically refreshes when app comes to foreground (handles midnight transition).
 */
export default function HomeScreen() {
  const router = useRouter();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useUserStats();
  const { cards, completedCount, isLoading: puzzlesLoading, refresh: refreshPuzzles } = useDailyPuzzles();

  const isLoading = statsLoading || puzzlesLoading;

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshStats(), refreshPuzzles()]);
  }, [refreshStats, refreshPuzzles]);

  // Refresh on app state change (handles midnight transition)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        handleRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleRefresh]);

  // Navigate to game screen with puzzle ID
  const handleCardPress = useCallback(
    (puzzleId: string, gameMode: GameMode) => {
      const route = ROUTE_MAP[gameMode];
      if (route) {
        // Navigate to dynamic route with puzzle ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/${route}/${puzzleId}` as any);
      }
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Football IQ</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.pitchGreen}
            colors={[colors.pitchGreen]}
          />
        }
      >
        {/* Streak Header */}
        <StreakHeader
          currentStreak={stats.currentStreak}
          completedCount={completedCount}
          totalCount={5}
        />

        {/* Daily Stack */}
        <View style={styles.dailyStack}>
          <Text style={styles.sectionTitle}>Today's Challenges</Text>

          {isLoading && cards.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.pitchGreen} />
              <Text style={styles.loadingText}>Loading puzzles...</Text>
            </View>
          ) : cards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No puzzles available today. Pull to refresh.
              </Text>
            </View>
          ) : (
            cards.map((card) => (
              <DailyStackCard
                key={card.puzzleId}
                puzzleId={card.puzzleId}
                gameMode={card.gameMode}
                status={card.status}
                scoreDisplay={card.scoreDisplay}
                difficulty={card.difficulty}
                onPress={() => handleCardPress(card.puzzleId, card.gameMode)}
                testID={`daily-card-${card.gameMode}`}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  sectionTitle: {
    ...textStyles.h2,
    marginBottom: spacing.md,
  },
  dailyStack: {
    marginTop: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
