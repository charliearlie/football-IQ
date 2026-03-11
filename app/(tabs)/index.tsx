import { useEffect, useCallback, useRef, useState } from "react";
import { useAds } from "@/features/ads/context/AdContext";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  AppState,
  AppStateStatus,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WifiOff } from "lucide-react-native";
import { colors, textStyles, spacing } from "@/theme";
import {
  useUserStats,
  useDailyPuzzles,
  DailyPuzzleCard,
  CompletedGameModal,
} from "@/features/home";
import {
  HomeHeader,
  DailyGoalCard,
  EventBanner,
  HomeGameList,
  SectionHeader,
  ArchiveDiscoveryBanner,
  WelcomeBackBanner,
} from "@/features/home/components/new";
import { useDailyProgress } from "@/features/home/hooks/useDailyProgress";
import { useSpecialEvent } from "@/features/home/hooks/useSpecialEvent";
import { useArchiveDiscoveryBanner } from "@/features/home/hooks/useArchiveDiscoveryBanner";
import { useWelcomeBackBanner } from "@/features/home/hooks/useWelcomeBackBanner";
import {
  getTierForPoints,
  getProgressToNextTier,
  getPointsToNextTier,
  getNextTier,
  getTierColor,
} from "@/features/stats/utils/tierProgression";
import { GAME_MODE_ROUTE_MAP } from "@/lib/gameRoutes";
import { PremiumUpsellBanner, UnlockChoiceModal } from "@/features/ads";
import { DailyStackCardSkeleton } from "@/components/ui/Skeletons";
import { useAuth } from "@/features/auth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { HOME_COLORS } from "@/theme/home-design";
import { getUserRank } from "@/features/leaderboard";

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

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
 * - Daily Goal Card (Ring + Games Completed + IQ Level)
 * - Special Event Banner (Dynamic)
 * - Vertical Game List
 */
export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, signInAnonymously, totalIQ } = useAuth();
  const { isConnected } = useNetworkStatus();
  const {
    stats,
    isLoading: statsLoading,
    refresh: refreshStats,
  } = useUserStats();
  const {
    cards,
    completedCount,
    isSpecialCompleted,
    isLoading: puzzlesLoading,
    refresh: refreshPuzzles,
  } = useDailyPuzzles();

  const isPremium = DEV_BYPASS_PREMIUM || (profile?.is_premium ?? false);
  const isLoading = statsLoading || puzzlesLoading;

  // Ad infrastructure
  useAds();

  // New Hooks
  const progress = useDailyProgress(cards);
  const tier = getTierForPoints(totalIQ);
  const iqTier = tier.name;
  const iqProgress = getProgressToNextTier(totalIQ);
  const iqPointsToNext = getPointsToNextTier(totalIQ);
  const iqNextTierName = getNextTier(tier)?.name ?? null;
  const iqTierColor = getTierColor(tier.tier);
  const specialEvent = useSpecialEvent();

  // Archive discovery banner
  const {
    isVisible: showArchiveBanner,
    dismiss: dismissArchiveBanner,
    variant: archiveBannerVariant,
  } = useArchiveDiscoveryBanner({
    isPremium,
    completedCount,
    totalCards: cards.length,
    currentStreak: stats.currentStreak,
  });

  // Welcome-back banner (streak milestones + streak-lost)
  const {
    isVisible: showWelcomeBanner,
    data: welcomeBannerData,
    dismiss: dismissWelcomeBanner,
  } = useWelcomeBackBanner({
    currentStreak: stats.currentStreak,
    lastPlayedDate: stats.lastPlayedDate,
    gamesPlayedToday: stats.gamesPlayedToday,
  });

  // First-time user who is offline: auth failed (no user), no local puzzles, and confirmed offline
  const isFirstTimeOffline =
    !user && cards.length === 0 && isConnected === false;

  // State for user rank (home screen display)
  const [userRank, setUserRank] = useState<{ rank: number; totalUsers: number } | null>(null);

  // Fetch user's global rank for display on DailyGoalCard
  useEffect(() => {
    async function fetchRank() {
      if (!user?.id) return;
      try {
        const result = await getUserRank(user.id, 'global');
        if (result) {
          setUserRank({ rank: result.rank, totalUsers: result.totalUsers });
        }
      } catch (error) {
        console.error('Error fetching user rank:', error);
      }
    }
    fetchRank();
  }, [user?.id]);

  // State for completed game modal
  const [completedModal, setCompletedModal] = useState<{
    card: DailyPuzzleCard;
  } | null>(null);

  // State for unlock choice modal (premium-only games)
  const [lockedPuzzle, setLockedPuzzle] = useState<DailyPuzzleCard | null>(
    null,
  );
  const [autoTriggerAd, setAutoTriggerAd] = useState(false);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshStats(), refreshPuzzles()]);
  }, [refreshStats, refreshPuzzles]);

  // Auto-retry anonymous sign-in when coming back online for first-time users
  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    if (prevConnectedRef.current === false && isConnected === true && !user) {
      console.log("[HomeScreen] Back online, retrying anonymous sign-in");
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
      if (nextAppState === "active") {
        const now = Date.now();
        const timeSinceLastSync = now - lastSyncRef.current;

        // Only refresh if sufficient time has passed since last sync
        if (timeSinceLastSync >= SYNC_THROTTLE_MS) {
          lastSyncRef.current = now;
          handleRefresh();
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [handleRefresh]);

  // Handle Pro Press (Header)
  const handleProPress = useCallback(() => {
    router.push({
      pathname: "/premium-modal",
      params: {
        puzzleDate: getTodayDate(),
        mode: "blocked", // Or a specific mode for generic upgrade
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
      if (card.status === "done" && card.attempt) {
        setCompletedModal({ card });
        return;
      }

      // Navigate to game for play/resume
      const route = GAME_MODE_ROUTE_MAP[card.gameMode];
      if (route) {
        router.push(`/${route}/${card.puzzleId}` as any);
      }
    },
    [router, isPremium],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 1. Header */}
      <HomeHeader
        streak={stats.currentStreak}
        isPremium={isPremium}
        onProPress={handleProPress}
        gamesPlayedToday={stats.gamesPlayedToday}
        availableFreezes={stats.availableFreezes}
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
        {/* 2. Daily Goal Card (Ring + Stats) */}
        <DailyGoalCard
          percent={progress.percent}
          countString={progress.countString}
          isComplete={progress.isComplete}
          gamesCompleted={stats.totalGamesPlayed}
          totalGames={stats.totalPuzzlesAvailable}
          iqTitle={iqTier}
          iqProgress={iqProgress}
          iqPointsToNext={iqPointsToNext}
          iqNextTierName={iqNextTierName}
          iqTierColor={iqTierColor}
          onPressGames={() => router.push("/archive")}
          onPressIQ={() => router.push("/stats")}
          userRank={userRank?.rank ?? null}
          totalUsers={userRank?.totalUsers ?? null}
          onPressRank={() => router.push("/leaderboard")}
          currentStreak={stats.currentStreak}
        />

        {/* 3. Welcome Back Banner */}
        {showWelcomeBanner && welcomeBannerData && (
          <WelcomeBackBanner
            data={welcomeBannerData}
            onDismiss={dismissWelcomeBanner}
            testID="welcome-back-banner"
          />
        )}

        {/* 4. Archive Discovery Banner */}
        {showArchiveBanner && (
          <ArchiveDiscoveryBanner
            variant={archiveBannerVariant}
            onPress={() => router.push("/archive")}
            onDismiss={dismissArchiveBanner}
            testID="archive-discovery-banner"
          />
        )}

        {/* 5. Special Event Banner (Conditional) */}
        {specialEvent && !isSpecialCompleted && (
          <EventBanner event={specialEvent} onPress={handleEventPress} />
        )}

        {!isPremium && stats.totalGamesPlayed >= 10 && (
          <View style={{ marginTop: 24 }}>
            <PremiumUpsellBanner testID="home-premium-upsell" dismissible />
          </View>
        )}

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
              <DailyStackCardSkeleton
                key={`skeleton-${i}`}
                testID={`daily-skeleton-${i}`}
              />
            ))}
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games today.</Text>
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
            const route = GAME_MODE_ROUTE_MAP[completedModal.card.gameMode];
            setCompletedModal(null);
            router.push({
              pathname: `/${route}/[puzzleId]`,
              params: {
                puzzleId: completedModal.card.puzzleId,
                review: "true",
              },
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
        puzzleId={lockedPuzzle?.puzzleId ?? ""}
        puzzleDate={getTodayDate()}
        gameMode={lockedPuzzle?.gameMode ?? "career_path"}
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
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    marginTop: spacing.md,
    marginHorizontal: 20,
  },
  offlineBannerText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  offlineContainer: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
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
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: textStyles.body.fontFamily,
  },
});
