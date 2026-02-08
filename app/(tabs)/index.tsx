import { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import {
  useUserStats,
  useDailyPuzzles,
  DailyPuzzleCard,
  CompletedGameModal,
} from '@/features/home';
import {
  HomeHeader,
  DailyProgressRing,
  StatsGrid,
  EventBanner,
  HomeGameList,
  SectionHeader,
} from '@/features/home/components/new';
import { useDailyProgress } from '@/features/home/hooks/useDailyProgress';
import { useIQRank } from '@/features/home/hooks/useIQRank';
import { useSpecialEvent } from '@/features/home/hooks/useSpecialEvent';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { PremiumUpsellBanner, UnlockChoiceModal } from '@/features/ads';
import { DailyStackCardSkeleton } from '@/components/ui/Skeletons';
import { useAuth } from '@/features/auth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { HOME_COLORS, HOME_DIMENSIONS } from '@/theme/home-design';

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
  the_grid: 'the-grid',
  the_chain: 'the-chain',
  the_thread: 'the-thread',
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
 * Home Screen - Gamified Dashboard (Redesign 2.0)
 *
 * Main landing screen showing:
 * - Brand Header with Pro Badge and Streak
 * - Daily Progress Ring (Hero)
 * - Stats Grid (Games Completed + IQ Level)
 * - Special Event Banner (Dynamic)
 * - Vertical Game List
 */
export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, signInAnonymously } = useAuth();
  const { isConnected } = useNetworkStatus();
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useUserStats();
  const { cards, completedCount, isLoading: puzzlesLoading, refresh: refreshPuzzles } = useDailyPuzzles();

  // In dev mode with bypass enabled, treat user as premium
  const isPremium = DEV_BYPASS_PREMIUM || (profile?.is_premium ?? false);
  const isLoading = statsLoading || puzzlesLoading;

  // New Hooks
  const progress = useDailyProgress(cards);
  const iqRank = useIQRank(stats.totalGamesPlayed);
  const specialEvent = useSpecialEvent();

  // First-time user who is offline: auth failed (no user), no local puzzles, and confirmed offline
  const isFirstTimeOffline = !user && cards.length === 0 && isConnected === false;

  // State for completed game modal
  const [completedModal, setCompletedModal] = useState<{
    card: DailyPuzzleCard;
  } | null>(null);

  // State for unlock choice modal (premium-only games)
  const [lockedPuzzle, setLockedPuzzle] = useState<DailyPuzzleCard | null>(null);
  const [autoTriggerAd, setAutoTriggerAd] = useState(false);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshStats(), refreshPuzzles()]);
  }, [refreshStats, refreshPuzzles]);

  // Auto-retry anonymous sign-in when coming back online for first-time users
  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    if (prevConnectedRef.current === false && isConnected === true && !user) {
      console.log('[HomeScreen] Back online, retrying anonymous sign-in');
      signInAnonymously();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, user, signInAnonymously]);

  // Track last sync time to avoid rapid re-syncing when switching apps
  const lastSyncRef = useRef<number>(0);
  const SYNC_THROTTLE_MS = 60_000; // 1 minute minimum between syncs

  // Refresh on app state change (handles midnight transition)
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

  // Handle Pro Press (Header)
  const handleProPress = useCallback(() => {
    router.push({
      pathname: '/premium-modal',
      params: { 
        puzzleDate: getTodayDate(), 
        mode: 'blocked' // Or a specific mode for generic upgrade
      },
    });
  }, [router]);

  // Handle Watch Ad (Card Action)
  const handleWatchAd = useCallback((card: DailyPuzzleCard) => {
    setAutoTriggerAd(true);
    setLockedPuzzle(card);
  }, []);

  // Handle Go Pro (Card Action)
  const handleGoPro = useCallback(() => {
     handleProPress();
  }, [handleProPress]);

  // Handle Event Press
  const handleEventPress = useCallback(() => {
    if (specialEvent?.route) {
      router.push(specialEvent.route);
    }
  }, [router, specialEvent]);

  // Navigate to game screen or show completed modal
  const handleCardPress = useCallback(
    (card: DailyPuzzleCard) => {
      // Premium-only games: show UnlockChoiceModal if user doesn't have access
      if (card.isPremiumOnly && !isPremium && !card.isAdUnlocked) {
        setAutoTriggerAd(false); // Manual press means we show choice
        setLockedPuzzle(card);
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
        router.push(`/${route}/${card.puzzleId}` as any);
      }
    },
    [router, isPremium]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <HomeHeader 
        streak={stats.currentStreak} 
        isPremium={isPremium} 
        onProPress={handleProPress} 
      />

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
        {/* 2. Daily Progress Hero */}
        <View style={styles.heroContainer}>
            <DailyProgressRing 
                percent={progress.percent} 
                countString={progress.countString}
                isComplete={progress.isComplete}
            />
        </View>

        {/* 3. Stats Dashboard */}
        <StatsGrid 
            gamesCompleted={stats.totalGamesPlayed} 
            totalGames={stats.totalPuzzlesAvailable}
            iqTitle={iqRank}
            onPressGames={() => router.push('/archive')}
            onPressIQ={() => router.push('/stats')} 
        />

        {/* 4. Special Event Banner (Conditional) */}
        {specialEvent && (
            <EventBanner event={specialEvent} onPress={handleEventPress} />
        )}

        {/* Premium Upsell (if free) - Maybe move this or keep it as banner? */}
        {/* Spec didn't explicitly remove it, but mostly covered by "Go Pro" buttons */}
        {!isPremium && <View style={{ marginTop: 24 }}><PremiumUpsellBanner testID="home-premium-upsell" /></View>}

        {/* Offline banner */}
        {isConnected === false && cards.length > 0 && (
          <View style={styles.offlineBanner}>
            <WifiOff size={14} color={colors.textSecondary} />
            <Text style={styles.offlineBannerText}>Playing offline</Text>
          </View>
        )}

        {/* 5. Game List */}
        {isFirstTimeOffline ? (
            <View style={styles.offlineContainer} testID="first-time-offline">
              <WifiOff size={48} color={colors.textSecondary} />
              <Text style={styles.offlineTitle}>No Internet Connection</Text>
              <Text style={styles.offlineText}>
                Football IQ needs an internet connection for your first launch.
              </Text>
            </View>
        ) : isLoading && cards.length === 0 ? (
           <View style={{ marginTop: 24 }}>
              {[0, 1, 2].map((i) => (
                <DailyStackCardSkeleton key={`skeleton-${i}`} testID={`daily-skeleton-${i}`} />
              ))}
           </View>
        ) : cards.length === 0 ? (
           <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No puzzles today.</Text>
           </View>
        ) : (
           <>
             {/* 5. List Header */}
             <SectionHeader />
             
             {/* 6. Game List */}
             <HomeGameList 
                cards={cards}
                onCardPress={handleCardPress}
                onWatchAd={handleWatchAd}
                onGoPro={handleGoPro}
                isPremium={isPremium}
             />
           </>
        )}
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

      {/* Unlock Choice Modal */}
      <UnlockChoiceModal
        visible={!!lockedPuzzle}
        onClose={() => {
            setLockedPuzzle(null);
            setAutoTriggerAd(false);
        }}
        puzzleId={lockedPuzzle?.puzzleId ?? ''}
        puzzleDate={getTodayDate()}
        gameMode={lockedPuzzle?.gameMode ?? 'career_path'}
        onUnlockSuccess={refreshPuzzles}
        autoTriggerAd={autoTriggerAd}
        testID="home-unlock-modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_COLORS.stadiumNavy,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginTop: spacing.md,
    marginHorizontal: 20,
  },
  offlineBannerText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  offlineContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: 12,
  },
  offlineTitle: {
    ...textStyles.h3,
    color: colors.floodlightWhite,
    marginTop: spacing.sm,
  },
  offlineText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: textStyles.body.fontFamily,
  }
});
