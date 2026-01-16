import { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  AppState,
  AppStateStatus,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import {
  StreakHeader,
  DailyStackCard,
  useUserStats,
  useDailyPuzzles,
  DailyPuzzleCard,
  CompletedGameModal,
} from '@/features/home';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { PremiumUpsellBanner, UnlockChoiceModal, useAds } from '@/features/ads';
import { DailyStackCardSkeleton } from '@/components/ui/Skeletons';
import { useAuth } from '@/features/auth';

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Route map for each game mode.
 */
const ROUTE_MAP: Record<GameMode, string> = {
  career_path: 'career-path',
  career_path_pro: 'career-path-pro',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  tic_tac_toe: 'tic-tac-toe',
  the_grid: 'the-grid',
  topical_quiz: 'topical-quiz',
  top_tens: 'top-tens',
  starting_xi: 'starting-xi',
};

/**
 * DEV ONLY: Bypass premium gate for testing on simulator.
 * Set to true to skip premium check in development.
 */
const DEV_BYPASS_PREMIUM = __DEV__ && false; // Set to false to test real premium gating

/**
 * Home Screen - Daily Challenge Dashboard
 *
 * Main landing screen showing:
 * - Streak header with current streak and daily progress
 * - Daily stack of 6 game mode cards with Play/Resume/Done states
 *
 * Automatically refreshes when app comes to foreground (handles midnight transition).
 */
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useUserStats();
  const { cards, completedCount, isLoading: puzzlesLoading, refresh: refreshPuzzles } = useDailyPuzzles();
  const { shouldShowAds } = useAds();

  // In dev mode with bypass enabled, treat user as premium
  const isPremium = DEV_BYPASS_PREMIUM || (profile?.is_premium ?? false);
  const isLoading = statsLoading || puzzlesLoading;

  // State for completed game modal
  const [completedModal, setCompletedModal] = useState<{
    card: DailyPuzzleCard;
  } | null>(null);

  // State for unlock choice modal (premium-only games)
  const [lockedPuzzle, setLockedPuzzle] = useState<DailyPuzzleCard | null>(null);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshStats(), refreshPuzzles()]);
  }, [refreshStats, refreshPuzzles]);

  // Track last sync time to avoid rapid re-syncing when switching apps
  const lastSyncRef = useRef<number>(0);
  const SYNC_THROTTLE_MS = 60_000; // 1 minute minimum between syncs

  // Refresh on app state change (handles midnight transition)
  // Throttled to prevent unnecessary syncs when quickly switching apps
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = Date.now();
        const timeSinceLastSync = now - lastSyncRef.current;

        // Only refresh if sufficient time has passed since last sync
        if (timeSinceLastSync >= SYNC_THROTTLE_MS) {
          lastSyncRef.current = now;
          handleRefresh();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleRefresh]);

  // Navigate to game screen or show completed modal
  const handleCardPress = useCallback(
    (card: DailyPuzzleCard) => {
      // Premium-only games: check ad eligibility first
      if (card.isPremiumOnly && !isPremium) {
        if (shouldShowAds) {
          // Show unlock modal with ad option
          setLockedPuzzle(card);
        } else {
          // No ads available, go to premium modal
          router.push({
            pathname: '/premium-modal',
            params: { mode: 'premium_only' },
          });
        }
        return;
      }

      // Show results modal for completed games
      if (card.status === 'done' && card.attempt) {
        setCompletedModal({ card });
        return;
      }

      // Navigate to game for play/resume
      const route = ROUTE_MAP[card.gameMode];
      if (route) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/${route}/${card.puzzleId}` as any);
      }
    },
    [router, isPremium, shouldShowAds]
  );

  // Navigate to daily leaderboard
  const handleLeaderboardPress = useCallback(() => {
    router.push('/leaderboard?type=daily');
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={textStyles.h1}>Football IQ</Text>
        <Pressable
          onPress={handleLeaderboardPress}
          style={styles.leaderboardButton}
          hitSlop={12}
          accessibilityLabel="View Leaderboard"
          accessibilityRole="button"
        >
          <Trophy size={22} color={colors.cardYellow} />
        </Pressable>
      </View>

      {/* Scrollable Content */}
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
          totalCount={cards.length || 6}
        />

        {/* Premium Upsell Banner (non-premium only) */}
        <PremiumUpsellBanner testID="home-premium-upsell" />

        {/* Daily Stack */}
        <View style={styles.dailyStack}>
          <Text style={styles.sectionTitle}>Today's Challenges</Text>

          {isLoading && cards.length === 0 ? (
            <View testID="home-skeleton-container">
              {[0, 1, 2, 3, 4].map((i) => (
                <DailyStackCardSkeleton key={`skeleton-${i}`} testID={`daily-skeleton-${i}`} />
              ))}
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
                gameMode={card.gameMode}
                status={card.status}
                onPress={() => handleCardPress(card)}
                isPremiumOnly={card.isPremiumOnly}
                isPremium={isPremium}
                testID={`daily-card-${card.gameMode}`}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Completed Game Modal */}
      {completedModal && (
        <CompletedGameModal
          visible={true}
          gameMode={completedModal.card.gameMode}
          attempt={completedModal.card.attempt!}
          onClose={() => setCompletedModal(null)}
          onReview={() => {
            const route = ROUTE_MAP[completedModal.card.gameMode];
            setCompletedModal(null);
            router.push({
              pathname: `/${route}/[puzzleId]`,
              params: { puzzleId: completedModal.card.puzzleId, review: 'true' },
            } as never);
          }}
          testID="completed-game-modal"
        />
      )}

      {/* Unlock Choice Modal for premium-only games */}
      <UnlockChoiceModal
        visible={!!lockedPuzzle}
        onClose={() => setLockedPuzzle(null)}
        puzzleId={lockedPuzzle?.puzzleId ?? ''}
        puzzleDate={getTodayDate()}
        gameMode={lockedPuzzle?.gameMode ?? 'career_path'}
        testID="home-unlock-modal"
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  leaderboardButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'] + 60, // Extra padding for ad banner
  },
  sectionTitle: {
    ...textStyles.h2,
    marginBottom: spacing.md,
  },
  dailyStack: {
    marginTop: spacing.lg,
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
