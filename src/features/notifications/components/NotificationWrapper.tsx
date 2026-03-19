/**
 * NotificationWrapper Component
 *
 * Wrapper component that provides notification context with data from
 * user stats and daily puzzles hooks.
 *
 * Must be placed inside PuzzleProvider to access puzzle data.
 */

import React, { useEffect } from 'react';
import { useUserStats } from '@/features/home/hooks/useUserStats';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth, useOnboarding } from '@/features/auth';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import { NotificationPermissionModal } from './NotificationPermissionModal';
import { PerfectDayCelebration } from './PerfectDayCelebration';
import { TierLevelUpCelebration } from '@/features/stats/components/TierLevelUpCelebration';
import { FirstWinCelebration } from './FirstWinCelebration';
import { StreakMilestoneCelebration } from '@/features/streaks/components/StreakMilestoneCelebration';

interface NotificationWrapperProps {
  children: React.ReactNode;
}

/**
 * Inner component that renders the notification modals.
 * Must be a child of NotificationProvider.
 *
 * IMPORTANT: Uses completedPuzzlesToday from context instead of
 * recalculating locally. The previous implementation incorrectly
 * calculated completedCount as todaysPuzzles.length (total puzzles)
 * instead of actual completed count.
 */
function NotificationModals() {
  const { isOnboardingActive } = useOnboarding();
  const {
    showPermissionModal,
    requestNotificationPermission,
    dismissPermissionModal,
    isPerfectDayCelebrating,
    dismissPerfectDayCelebration,
    completedPuzzlesToday, // Use context value, not local calculation
    isTierUpCelebrating,
    tierUpData,
    dismissTierUpCelebration,
    isFirstWinCelebrating,
    dismissFirstWinCelebration,
    isStreakMilestoneCelebrating,
    streakMilestoneData,
    dismissStreakMilestoneCelebration,
  } = useNotifications();

  // Get stats for Perfect Day card (streak count only)
  const { stats } = useUserStats();
  const { user } = useAuth();

  // Never mount notification modals while the onboarding modal is visible —
  // concurrent RN Modals corrupt the UIKit presentation stack and freeze touches
  if (isOnboardingActive) return null;

  return (
    <>
      <NotificationPermissionModal
        visible={showPermissionModal}
        onAccept={requestNotificationPermission}
        onDecline={dismissPermissionModal}
        testID="notification-permission-modal"
      />
      <PerfectDayCelebration
        visible={isPerfectDayCelebrating}
        puzzleCount={completedPuzzlesToday}
        streakCount={stats.currentStreak}
        onDismiss={dismissPerfectDayCelebration}
        onShare={async () => {
          // Share callback - celebration handles the actual sharing
        }}
        userId={user?.id}
        testID="perfect-day-celebration"
      />
      {tierUpData && (
        <TierLevelUpCelebration
          visible={isTierUpCelebrating}
          tier={tierUpData.tier}
          totalIQ={tierUpData.totalIQ}
          onDismiss={dismissTierUpCelebration}
          onShare={async () => {
            // Share callback - celebration handles the actual sharing
          }}
          userId={user?.id}
          testID="tier-level-up-celebration"
        />
      )}
      <FirstWinCelebration
        visible={isFirstWinCelebrating}
        onDismiss={dismissFirstWinCelebration}
        onShare={async () => {
          // Share callback - celebration handles the actual sharing
        }}
        testID="first-win-celebration"
      />
      {streakMilestoneData && (
        <StreakMilestoneCelebration
          visible={isStreakMilestoneCelebrating}
          milestone={streakMilestoneData.milestone}
          currentStreak={streakMilestoneData.currentStreak}
          onDismiss={dismissStreakMilestoneCelebration}
          onShare={async () => {
            // Share callback - celebration handles the actual sharing
          }}
          userId={user?.id}
          testID="streak-milestone-celebration"
        />
      )}
    </>
  );
}

/**
 * Bridges the notification permission requester into OnboardingContext.
 *
 * OnboardingProvider sits above NotificationWrapper in the tree, so it cannot
 * call useNotifications() directly. This component runs inside NotificationProvider
 * and injects requestNotificationPermission upward via setNotificationRequester.
 */
function NotificationOnboardingBridge() {
  const { requestNotificationPermission } = useNotifications();
  const { setNotificationRequester } = useOnboarding();

  useEffect(() => {
    setNotificationRequester(requestNotificationPermission);
    return () => setNotificationRequester(undefined);
  }, [requestNotificationPermission, setNotificationRequester]);

  return null;
}

/**
 * Notification wrapper that provides context and renders modals.
 *
 * Usage:
 * ```tsx
 * <PuzzleProvider>
 *   <NotificationWrapper>
 *     {children}
 *   </NotificationWrapper>
 * </PuzzleProvider>
 * ```
 *
 * Data Flow:
 * - stats.gamesPlayedToday: Count of completed puzzle attempts for today
 *   (from useUserStats, queries completed=1 attempts)
 * - completedPuzzlesToday: Same value, passed explicitly for clarity
 * - totalPuzzlesToday: Total puzzles available for today's date
 */
export function NotificationWrapper({ children }: NotificationWrapperProps) {
  const { stats, isLoading: statsLoading } = useUserStats();
  const { user, totalIQ } = useAuth();
  const { isOnboardingActive } = useOnboarding();
  // Use PuzzleContext directly instead of useDailyPuzzles
  // (useDailyPuzzles uses useFocusEffect which requires navigation context)
  const { puzzles } = usePuzzleContext();

  // Calculate today's puzzles count from context
  const today = getAuthorizedDateUnsafe();
  const todaysPuzzles = puzzles.filter((p) => p.puzzle_date === today);
  const totalPuzzlesToday = todaysPuzzles.length;

  return (
    <NotificationProvider
      currentStreak={stats.currentStreak}
      gamesPlayedToday={stats.gamesPlayedToday}
      totalGamesPlayed={stats.totalGamesPlayed}
      completedPuzzlesToday={stats.gamesPlayedToday}
      totalPuzzlesToday={totalPuzzlesToday}
      userId={user?.id ?? null}
      isOnboardingActive={isOnboardingActive}
      totalIQ={totalIQ}
      isStatsLoading={statsLoading}
    >
      <NotificationOnboardingBridge />
      {children}
      <NotificationModals />
    </NotificationProvider>
  );
}
