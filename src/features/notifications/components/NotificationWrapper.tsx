/**
 * NotificationWrapper Component
 *
 * Wrapper component that provides notification context with data from
 * user stats and daily puzzles hooks.
 *
 * Must be placed inside PuzzleProvider to access puzzle data.
 */

import React from 'react';
import { useUserStats } from '@/features/home/hooks/useUserStats';
import { usePuzzleContext } from '@/features/puzzles';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import { NotificationPermissionModal } from './NotificationPermissionModal';
import { PerfectDayCelebration } from './PerfectDayCelebration';

interface NotificationWrapperProps {
  children: React.ReactNode;
}

/**
 * Inner component that renders the notification modals.
 * Must be a child of NotificationProvider.
 */
function NotificationModals() {
  const {
    showPermissionModal,
    requestNotificationPermission,
    dismissPermissionModal,
    isPerfectDayCelebrating,
    dismissPerfectDayCelebration,
  } = useNotifications();

  // Get stats for Perfect Day card
  const { stats } = useUserStats();
  const { puzzles } = usePuzzleContext();

  // Calculate completed count from puzzles context
  const today = getAuthorizedDateUnsafe();
  const todaysPuzzles = puzzles.filter((p) => p.puzzle_date === today);
  const completedCount = todaysPuzzles.length;

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
        puzzleCount={completedCount}
        streakCount={stats.currentStreak}
        onDismiss={dismissPerfectDayCelebration}
        onShare={async () => {
          // Share callback - celebration handles the actual sharing
        }}
        testID="perfect-day-celebration"
      />
    </>
  );
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
 */
export function NotificationWrapper({ children }: NotificationWrapperProps) {
  const { stats, isLoading: statsLoading } = useUserStats();
  // Use PuzzleContext directly instead of useDailyPuzzles
  // (useDailyPuzzles uses useFocusEffect which requires navigation context)
  const { puzzles } = usePuzzleContext();

  // Calculate today's puzzles count from context
  const today = getAuthorizedDateUnsafe();
  const todaysPuzzles = puzzles.filter((p) => p.puzzle_date === today);
  const totalPuzzles = todaysPuzzles.length;

  // Don't render provider until stats are loaded
  if (statsLoading) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider
      currentStreak={stats.currentStreak}
      gamesPlayedToday={stats.gamesPlayedToday}
      totalGamesPlayed={stats.totalGamesPlayed}
      completedCount={stats.gamesPlayedToday}
      totalPuzzles={totalPuzzles}
    >
      {children}
      <NotificationModals />
    </NotificationProvider>
  );
}
