import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Trophy } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, fonts, fontWeights, spacing, borderRadius } from "@/theme";
import {
  usePerformanceStats,
  ScoutingReportOverlay,
  StreakCalendar,
  getTierForPoints,
} from "@/features/stats";
import { ElitePlayerCard } from "@/features/stats/components/ScoutReport";
import { StatsGrid } from "@/features/stats/components/StatsGrid";
import { FieldExperienceSection } from "@/features/stats/components/FieldExperienceSection";
import { DetailedModeStatsSection } from "@/features/stats/components/DetailedModeStatsSection";
import { SignatureStrengthCard } from "@/features/stats/components/SignatureStrengthCard";
import { MonthReportCard } from "@/features/stats/components/MonthReportCard";
import { BestDayCard } from "@/features/stats/components/BestDayCard";
import { WeakSpotCTA } from "@/features/stats/components/WeakSpotCTA";
import { CareerTimeline } from "@/features/stats/components/CareerTimeline";
import { useCareerTimeline } from "@/features/stats/hooks/useCareerTimeline";
import { ScoutingReportData } from "@/features/stats/components/ScoutingReportCard";
import { GAME_MODE_ROUTES } from "@/features/archive/constants/routes";
import { useAuth } from "@/features/auth";
import { getUserRank } from "@/features/leaderboard";
import { FullStatsSkeleton } from "@/components/ui/Skeletons";
import { ElevatedButton } from "@/components/ElevatedButton";
import { TabScreenWrapper } from "@/components/TabScreenWrapper";
import { FloatingPlayCTA } from "@/components/FloatingPlayCTA";
import { useDailyPuzzles } from "@/features/home/hooks/useDailyPuzzles";

/**
 * Scout Report Screen
 *
 * Three-zone dashboard showcasing the user's complete Football Identity.
 *
 * Zone 1 - Pride (Above the Fold):
 *   ElitePlayerCard (gradient + glow) + StatsGrid (2x2 bold numbers)
 *
 * Zone 2 - Self-Knowledge (Mid-Screen):
 *   Signature Strength, Month Report
 *
 * Zone 3 - Deep Dive (Below the Fold):
 *   Mode Breakdown, Career Timeline, Field Experience, Season Progress,
 *   Best Day, Weak Spot CTA
 */
export default function ScoutReportScreen() {
  const router = useRouter();
  const { stats, isLoading, refresh } = usePerformanceStats();
  const { cards: dailyCards } = useDailyPuzzles();
  const unplayedCount = dailyCards.filter((c) => c.status === "play" || c.status === "resume").length;

  const handlePlayTodayPress = useCallback(() => {
    router.push("/(tabs)");
  }, [router]);
  const { profile, user, updateDisplayName, totalIQ } = useAuth();
  const { history: tierHistory, refresh: refreshTimeline } =
    useCareerTimeline();

  // IQ Card modal state
  const [showIQCard, setShowIQCard] = useState(false);
  const [userRank, setUserRank] = useState<{
    rank: number;
    totalUsers: number;
  } | null>(null);

  // Display name input state (fallback for missed onboarding)
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const needsDisplayName =
    profile === null ||
    !profile.display_name ||
    profile.display_name.trim() === "";

  // Derive aggregate stats for StatsGrid
  const { overallAccuracy, overallBestScore } = useMemo(() => {
    if (!stats?.detailedModeStats || stats.detailedModeStats.length === 0) {
      return { overallAccuracy: 0, overallBestScore: 0 };
    }
    const totalGames = stats.detailedModeStats.reduce(
      (sum, m) => sum + m.gamesPlayed,
      0,
    );
    const accuracy =
      totalGames > 0
        ? Math.round(
            stats.detailedModeStats.reduce(
              (sum, m) => sum + m.accuracyPercent * m.gamesPlayed,
              0,
            ) / totalGames,
          )
        : 0;
    const best = Math.max(
      ...stats.detailedModeStats.map((m) => m.bestScore),
    );
    return { overallAccuracy: accuracy, overallBestScore: best };
  }, [stats?.detailedModeStats]);

  // Fetch user's global rank when stats are loaded
  useEffect(() => {
    async function fetchRank() {
      if (!user?.id || !stats?.globalIQ) return;

      try {
        const result = await getUserRank(user.id, "global");
        if (result) {
          setUserRank({ rank: result.rank, totalUsers: result.totalUsers });
        }
      } catch (error) {
        console.error("Error fetching user rank:", error);
      }
    }

    fetchRank();
  }, [user?.id, stats?.globalIQ]);

  // Refresh stats when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshTimeline();
    }, [refresh, refreshTimeline]),
  );

  const handleLeaderboardPress = () => {
    router.push("/leaderboard");
  };

  const handleSharePress = useCallback(() => {
    setShowIQCard(true);
  }, []);

  const handleCloseIQCard = useCallback(() => {
    setShowIQCard(false);
  }, []);

  const handlePremiumPress = useCallback(() => {
    router.push("/premium-modal");
  }, [router]);

  const handleWeakSpotPress = useCallback(() => {
    if (!stats?.weakSpotMode) return;
    const route = GAME_MODE_ROUTES[stats.weakSpotMode.mode];
    if (route) {
      router.push(`/${route}` as any);
    }
  }, [stats?.weakSpotMode, router]);

  // Handle display name submission (fallback for missed onboarding)
  const handleSetDisplayName = useCallback(async () => {
    const trimmed = displayNameInput.trim();
    if (trimmed.length < 3) {
      setNameError("Name must be at least 3 characters");
      return;
    }
    if (trimmed.length > 30) {
      setNameError("Name must be 30 characters or less");
      return;
    }

    setIsSubmittingName(true);
    setNameError(null);

    try {
      const { error } = await updateDisplayName(trimmed);
      if (error) {
        setNameError("Failed to save. Please try again.");
      }
    } catch {
      setNameError("Failed to save. Please try again.");
    } finally {
      setIsSubmittingName(false);
    }
  }, [displayNameInput, updateDisplayName]);

  /**
   * Build Scouting Report data for the share card overlay.
   */
  const scoutingReportData: ScoutingReportData | null = stats
    ? {
        displayName: profile?.display_name ?? "Football Fan",
        totalIQ: totalIQ,
        archetypeMode: stats.fieldExperience.dominantMode,
        totalAppearances: stats.fieldExperience.totalAppearances,
        currentStreak: stats.currentStreak,
        userId: user?.id,
        verdict: stats.shortVerdict || undefined,
      }
    : null;

  // Loading state with skeleton
  if (isLoading && !stats) {
    return (
      <TabScreenWrapper>
        <SafeAreaView style={styles.container} edges={["top"]}>
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
      </TabScreenWrapper>
    );
  }

  // Empty state (no games played yet)
  if (!stats || stats.totalPuzzlesSolved === 0) {
    return (
      <TabScreenWrapper>
        <SafeAreaView style={styles.container} edges={["top"]}>
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
              <View style={styles.displayNameSection}>
                <Text style={styles.displayNameHeader}>
                  SET YOUR SCOUT NAME
                </Text>
                <Text style={styles.displayNameHint}>
                  Choose a name for the leaderboard
                </Text>
                <TextInput
                  style={[
                    styles.displayNameInput,
                    nameError && styles.inputError,
                  ]}
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
                {nameError && (
                  <Text style={styles.nameErrorText}>{nameError}</Text>
                )}
                <ElevatedButton
                  title={isSubmittingName ? "Saving..." : "Save Name"}
                  onPress={handleSetDisplayName}
                  disabled={
                    isSubmittingName || displayNameInput.trim().length < 3
                  }
                  size="medium"
                  fullWidth
                  testID="save-display-name-button"
                />
              </View>
            ) : (
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeGreeting}>
                  Welcome, {profile?.display_name}!
                </Text>
                <Text style={styles.welcomeTier}>
                  {getTierForPoints(totalIQ).name}
                </Text>
              </View>
            )}

            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Your Scout Report Awaits</Text>
              <Text style={styles.emptyText}>
                Complete your first puzzle to unlock your Football IQ stats.
                Your tier, archetype, and progress will appear here.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TabScreenWrapper>
    );
  }

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          {/* ═══════════════════════════════════════════════════════════
              ZONE 1 — PRIDE (Above the Fold)
              ═══════════════════════════════════════════════════════════ */}

          {/* Elite Player Card */}
          <ElitePlayerCard
            displayName={profile?.display_name ?? "Football Fan"}
            memberSince={profile?.created_at ?? null}
            totalIQ={totalIQ}
            currentStreak={stats.currentStreak}
            userRank={userRank}
            onSharePress={handleSharePress}
            testID="elite-player-card"
          />

          {/* Quick Stats Grid */}
          <StatsGrid
            matchesPlayed={stats.totalPuzzlesSolved}
            accuracyPercent={overallAccuracy}
            bestScore={overallBestScore}
            perfectGames={stats.totalPerfectScores}
            testID="stats-grid"
          />

          {/* ═══════════════════════════════════════════════════════════
              ZONE 2 — SELF-KNOWLEDGE (Mid-Screen)
              ═══════════════════════════════════════════════════════════ */}

          <View style={styles.divider} />

          {/* Signature Strength / Achilles Heel */}
          {stats.strengthWeakness && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                STRENGTHS & WEAKNESSES
              </Text>
              <SignatureStrengthCard
                analysis={stats.strengthWeakness}
                testID="signature-strength"
              />
            </View>
          )}

          {/* This Month's Report */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>THIS MONTH</Text>
            <MonthReportCard
              report={stats.thisMonthReport}
              testID="month-report"
            />
          </View>

          {/* ═══════════════════════════════════════════════════════════
              ZONE 3 — DEEP DIVE (Below the Fold)
              ═══════════════════════════════════════════════════════════ */}

          <View style={styles.divider} />

          {/* Mode Breakdown */}
          {stats.detailedModeStats && stats.detailedModeStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>MODE BREAKDOWN</Text>
              <DetailedModeStatsSection
                stats={stats.detailedModeStats}
                testID="detailed-mode-stats"
              />
            </View>
          )}

          {/* Career Timeline */}
          {tierHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>CAREER TIMELINE</Text>
              <CareerTimeline
                history={tierHistory}
                testID="career-timeline"
              />
            </View>
          )}

          {/* Field Experience */}
          {stats.fieldExperience.totalAppearances > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>FIELD EXPERIENCE</Text>
              <FieldExperienceSection
                fieldExperience={stats.fieldExperience}
                testID="field-experience-section"
              />
            </View>
          )}

          {/* Season Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>SEASON PROGRESS</Text>
            <StreakCalendar
              isPremium={profile?.is_premium ?? false}
              onPremiumPress={handlePremiumPress}
              variant="embedded"
              testID="streak-calendar"
            />
          </View>

          {/* Best Day Ever */}
          {stats.bestDay && (
            <View style={styles.section}>
              <BestDayCard bestDay={stats.bestDay} testID="best-day" />
            </View>
          )}

          {/* Weak Spot CTA */}
          {stats.weakSpotMode && (
            <View style={styles.section}>
              <WeakSpotCTA
                weakSpot={stats.weakSpotMode}
                onPress={handleWeakSpotPress}
                testID="weak-spot-cta"
              />
            </View>
          )}
        </ScrollView>

        {/* Scouting Report Share Modal */}
        {scoutingReportData && (
          <ScoutingReportOverlay
            visible={showIQCard}
            onClose={handleCloseIQCard}
            data={scoutingReportData}
          />
        )}

        {/* Floating CTA to play today's puzzles */}
        <FloatingPlayCTA
          unplayedCount={unplayedCount}
          onPress={handlePlayTodayPress}
        />
      </SafeAreaView>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
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
    paddingBottom: spacing["3xl"] + 60,
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
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius["2xl"],
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  displayNameSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.stadiumNavy,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius["2xl"],
    padding: spacing.xl,
  },
  displayNameHeader: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  displayNameHint: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
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
    textAlign: "center",
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
    textAlign: "center",
    marginBottom: spacing.md,
  },
  welcomeSection: {
    alignItems: "center",
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
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
