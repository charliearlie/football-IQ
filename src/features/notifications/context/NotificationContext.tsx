/**
 * Notification Context Provider
 *
 * Manages the notification lifecycle including:
 * - Permission requests (after first puzzle completion)
 * - Morning "Daily Kick-off" scheduling (08:30)
 * - Evening "Streak Saver" scheduling (20:00)
 * - Perfect Day celebration triggering
 *
 * Integrates with:
 * - True-Time system for accurate scheduling
 * - User stats for streak tracking
 * - Daily puzzles for completion detection
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { onMidnight, getAuthorizedDateUnsafe } from '@/lib/time';
import {
  initializeNotifications,
  requestPermissions,
  getPermissionStatus,
  scheduleNotification,
  cancelNotification,
  addReceivedListener,
  addResponseListener,
  NOTIFICATION_IDS,
} from '../services/notificationService';
import {
  getMorningTriggerTime,
  getEveningTriggerTime,
  isPastMorningTime,
  isPastEveningTime,
} from '../utils/scheduleCalculator';
import { getMorningMessage, getStreakSaverMessage } from '../utils/messageRotation';
import type { NotificationContextValue, PermissionStatus } from '../types';

// Storage keys
const STORAGE_KEYS = {
  PERMISSION_ASKED: '@notifications_permission_asked',
  LAST_SCHEDULED_DATE: '@notifications_last_scheduled_date',
  PERFECT_DAY_SHOWN: '@notifications_perfect_day_shown',
} as const;

// Create context with undefined default
const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: React.ReactNode;
  /** Current streak count from useUserStats */
  currentStreak: number;
  /** Games played today from useUserStats */
  gamesPlayedToday: number;
  /** Total games played (for first completion detection) */
  totalGamesPlayed: number;
  /** Number of puzzles completed today */
  completedCount: number;
  /** Total number of puzzles available today */
  totalPuzzles: number;
}

export function NotificationProvider({
  children,
  currentStreak,
  gamesPlayedToday,
  totalGamesPlayed,
  completedCount,
  totalPuzzles,
}: NotificationProviderProps) {
  // Permission state
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('undetermined');
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Perfect Day state
  const [isPerfectDayCelebrating, setIsPerfectDayCelebrating] = useState(false);
  const [perfectDayShownDates, setPerfectDayShownDates] = useState<string[]>([]);

  // Refs for tracking state across renders
  const hasInitialized = useRef(false);
  const lastScheduledDate = useRef<string | null>(null);
  const prevTotalGamesPlayed = useRef(totalGamesPlayed);
  const prevCompletedCount = useRef(completedCount);

  // Skip on web
  const isSupported = Platform.OS !== 'web';

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    if (!isSupported || hasInitialized.current) return;
    hasInitialized.current = true;

    async function init() {
      try {
        // Initialize notification system
        await initializeNotifications();

        // Load stored state
        const [askedResult, shownResult, scheduledResult] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_ASKED),
          AsyncStorage.getItem(STORAGE_KEYS.PERFECT_DAY_SHOWN),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_SCHEDULED_DATE),
        ]);

        setHasAskedPermission(askedResult === 'true');
        setPerfectDayShownDates(shownResult ? JSON.parse(shownResult) : []);
        lastScheduledDate.current = scheduledResult;

        // Check current permission status
        const status = await getPermissionStatus();
        setPermissionStatus(status);

        // Schedule notifications if permitted
        if (status === 'granted') {
          await scheduleNotifications(currentStreak, gamesPlayedToday);
        }

        console.log('[Notifications] Provider initialized');
      } catch (error) {
        console.error('[Notifications] Init error:', error);
        Sentry.captureException(error);
      }
    }

    init();
  }, [isSupported, currentStreak, gamesPlayedToday]);

  // ============================================================================
  // Notification Scheduling
  // ============================================================================

  const scheduleNotifications = useCallback(
    async (streak: number, playedToday: number) => {
      if (!isSupported) return;

      const today = getAuthorizedDateUnsafe();

      // Skip if already scheduled today
      if (lastScheduledDate.current === today) {
        console.log('[Notifications] Already scheduled for today');
        return;
      }

      // If user has played today, cancel notifications
      if (playedToday > 0) {
        await cancelNotification(NOTIFICATION_IDS.DAILY_KICKOFF);
        await cancelNotification(NOTIFICATION_IDS.STREAK_SAVER);
        lastScheduledDate.current = today;
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCHEDULED_DATE, today);
        console.log('[Notifications] Cancelled - user has played today');
        return;
      }

      // Schedule morning notification if not past 08:30
      if (!isPastMorningTime()) {
        const morningTrigger = getMorningTriggerTime();
        if (morningTrigger) {
          const { title, body } = getMorningMessage();
          await scheduleNotification({
            id: NOTIFICATION_IDS.DAILY_KICKOFF,
            title,
            body,
            triggerDate: morningTrigger,
          });
        }
      }

      // Schedule evening "Streak Saver" if:
      // 1. User has a streak to lose (streak > 0)
      // 2. Not past 20:00
      // 3. Haven't played today
      if (streak > 0 && !isPastEveningTime()) {
        const eveningTrigger = getEveningTriggerTime();
        if (eveningTrigger) {
          const { title, body } = getStreakSaverMessage(streak);
          await scheduleNotification({
            id: NOTIFICATION_IDS.STREAK_SAVER,
            title,
            body,
            triggerDate: eveningTrigger,
            priority: 'high',
          });
        }
      }

      lastScheduledDate.current = today;
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCHEDULED_DATE, today);
    },
    [isSupported]
  );

  // ============================================================================
  // Midnight Rescheduling
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onMidnight(() => {
      console.log('[Notifications] Midnight - rescheduling');
      lastScheduledDate.current = null;
      scheduleNotifications(currentStreak, 0); // Reset to 0 played at midnight
    });

    return unsubscribe;
  }, [isSupported, currentStreak, scheduleNotifications]);

  // ============================================================================
  // User Activity Monitoring
  // ============================================================================

  // Cancel notifications when user plays
  useEffect(() => {
    if (!isSupported || permissionStatus !== 'granted') return;

    // If user just started playing (0 -> 1+), cancel scheduled notifications
    if (gamesPlayedToday > 0) {
      cancelNotification(NOTIFICATION_IDS.DAILY_KICKOFF);
      cancelNotification(NOTIFICATION_IDS.STREAK_SAVER);
    }
  }, [isSupported, permissionStatus, gamesPlayedToday]);

  // ============================================================================
  // First Puzzle Completion -> Show Permission Modal
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    // Detect first puzzle completion (1 -> 1, with prev at 0)
    const justCompletedFirst =
      totalGamesPlayed === 1 && prevTotalGamesPlayed.current === 0;

    if (justCompletedFirst && !hasAskedPermission) {
      // Small delay for better UX (let result modal show first)
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }

    prevTotalGamesPlayed.current = totalGamesPlayed;
  }, [isSupported, totalGamesPlayed, hasAskedPermission]);

  // ============================================================================
  // Perfect Day Detection
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    const today = getAuthorizedDateUnsafe();
    const isPerfectDay =
      totalPuzzles > 0 && completedCount === totalPuzzles;
    const alreadyShownToday = perfectDayShownDates.includes(today);
    const justCompleted = completedCount > prevCompletedCount.current;

    // Trigger celebration if:
    // 1. All puzzles completed
    // 2. Just completed the last one (not on app load)
    // 3. Haven't shown today
    if (isPerfectDay && justCompleted && !alreadyShownToday) {
      setIsPerfectDayCelebrating(true);

      // Record that we've shown it today
      const newDates = [...perfectDayShownDates, today];
      setPerfectDayShownDates(newDates);
      AsyncStorage.setItem(
        STORAGE_KEYS.PERFECT_DAY_SHOWN,
        JSON.stringify(newDates)
      );
    }

    prevCompletedCount.current = completedCount;
  }, [isSupported, completedCount, totalPuzzles, perfectDayShownDates]);

  // ============================================================================
  // App State Monitoring (re-evaluate on foreground)
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-check permission status
        getPermissionStatus().then(setPermissionStatus);

        // Re-schedule if needed
        if (permissionStatus === 'granted') {
          scheduleNotifications(currentStreak, gamesPlayedToday);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isSupported, permissionStatus, currentStreak, gamesPlayedToday, scheduleNotifications]);

  // ============================================================================
  // Notification Listeners
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    const receivedSub = addReceivedListener((notification) => {
      console.log('[Notifications] Received:', notification.request.identifier);
    });

    const responseSub = addResponseListener((response) => {
      console.log(
        '[Notifications] Opened:',
        response.notification.request.identifier
      );
      // Could navigate to specific screen based on notification type
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSupported]);

  // ============================================================================
  // Context Actions
  // ============================================================================

  const requestNotificationPermission = useCallback(async () => {
    if (!isSupported) return;

    setShowPermissionModal(false);
    setHasAskedPermission(true);
    await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');

    const status = await requestPermissions();
    setPermissionStatus(status);

    if (status === 'granted') {
      await scheduleNotifications(currentStreak, gamesPlayedToday);
    }
  }, [isSupported, currentStreak, gamesPlayedToday, scheduleNotifications]);

  const dismissPermissionModal = useCallback(async () => {
    setShowPermissionModal(false);
    setHasAskedPermission(true);
    await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');
  }, []);

  const triggerPerfectDayCelebration = useCallback(() => {
    setIsPerfectDayCelebrating(true);
  }, []);

  const dismissPerfectDayCelebration = useCallback(() => {
    setIsPerfectDayCelebrating(false);
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo<NotificationContextValue>(
    () => ({
      permissionStatus,
      hasAskedPermission,
      showPermissionModal,
      requestNotificationPermission,
      dismissPermissionModal,
      triggerPerfectDayCelebration,
      isPerfectDayCelebrating,
      dismissPerfectDayCelebration,
    }),
    [
      permissionStatus,
      hasAskedPermission,
      showPermissionModal,
      requestNotificationPermission,
      dismissPermissionModal,
      triggerPerfectDayCelebration,
      isPerfectDayCelebrating,
      dismissPerfectDayCelebration,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context.
 * Must be used within a NotificationProvider.
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
