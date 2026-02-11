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
import { router, type Href, useRootNavigationState } from 'expo-router';
import {
  initializeNotifications,
  requestPermissions,
  getPermissionStatus,
  scheduleNotification,
  cancelNotification,
  addReceivedListener,
  addResponseListener,
  getLastNotificationResponse,
  registerForPushNotifications,
  savePushToken,
  NOTIFICATION_IDS,
} from '../services/notificationService';
import { GAME_MODE_ROUTES } from '@/features/archive/constants/routes';
import type { GameMode } from '@/features/puzzles/types/puzzle.types';
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
  /** Games played today from useUserStats (completed attempts) */
  gamesPlayedToday: number;
  /** Total games played (for first completion detection) */
  totalGamesPlayed: number;
  /** Number of puzzles completed today (same as gamesPlayedToday, explicit naming) */
  completedPuzzlesToday: number;
  /** Total number of puzzles available today */
  totalPuzzlesToday: number;
  /** User ID for push token registration */
  userId: string | null;
}

export function NotificationProvider({
  children,
  currentStreak,
  gamesPlayedToday,
  totalGamesPlayed,
  completedPuzzlesToday,
  totalPuzzlesToday,
  userId,
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
  const prevCompletedCount = useRef(completedPuzzlesToday);
  const pushTokenRegistered = useRef(false);
  const pendingDeepLink = useRef<Record<string, unknown> | null>(null);

  // Skip on web
  const isSupported = Platform.OS !== 'web';

  // Navigation readiness — used for cold-start deep linking
  const navigationState = useRootNavigationState();
  const isNavigationReady = !!navigationState?.key;

  // ============================================================================
  // Push Token Registration
  // ============================================================================

  const registerPushToken = useCallback(async () => {
    if (!isSupported || !userId || pushTokenRegistered.current) return;

    const token = await registerForPushNotifications();
    if (token) {
      await savePushToken(userId, token);
      pushTokenRegistered.current = true;
    }
  }, [isSupported, userId]);

  // ============================================================================
  // Deep Link Navigation from Push Notifications
  // ============================================================================

  const handleNotificationNavigation = useCallback((data: Record<string, unknown>) => {
    const { gameMode, puzzleId } = data ?? {};

    // Validate gameMode is a recognised key in GAME_MODE_ROUTES
    if (typeof gameMode !== 'string' || !(gameMode in GAME_MODE_ROUTES)) {
      console.warn('[Notifications] Unknown or missing gameMode in notification data:', gameMode);
      return;
    }

    const routePath = GAME_MODE_ROUTES[gameMode as GameMode];

    // Validate puzzleId if present: must be a non-empty alphanumeric/dash/underscore string
    if (puzzleId !== undefined) {
      if (typeof puzzleId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(puzzleId)) {
        console.warn('[Notifications] Invalid puzzleId in notification data:', puzzleId);
        return;
      }
    }

    const pathname = puzzleId ? `/${routePath}/${puzzleId}` : `/${routePath}`;
    router.push(pathname as Href);
  }, []);

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

        const wasAsked = askedResult === 'true';
        setHasAskedPermission(wasAsked);
        setPerfectDayShownDates(shownResult ? JSON.parse(shownResult) : []);
        lastScheduledDate.current = scheduledResult;

        // Check current permission status
        const status = await getPermissionStatus();
        setPermissionStatus(status);

        // Schedule notifications if permitted
        if (status === 'granted') {
          await scheduleNotifications(currentStreak, gamesPlayedToday);
        }

        // Show permission modal on first app load if not asked yet
        if (!wasAsked && status !== 'granted') {
          setTimeout(() => {
            setShowPermissionModal(true);
          }, 1500);
        }

        // Handle cold-start deep linking (app opened via notification tap)
        const lastResponse = await getLastNotificationResponse();
        if (lastResponse) {
          const data = lastResponse.notification.request.content.data;
          if (data?.gameMode) {
            pendingDeepLink.current = data as Record<string, unknown>;
          }
        }

        console.log('[Notifications] Provider initialized');
      } catch (error) {
        console.error('[Notifications] Init error:', error);
        Sentry.captureException(error);
      }
    }

    init();
  }, [isSupported, currentStreak, gamesPlayedToday, handleNotificationNavigation]);

  // Process pending cold-start deep link once the navigation tree is mounted
  useEffect(() => {
    if (isNavigationReady && pendingDeepLink.current) {
      handleNotificationNavigation(pendingDeepLink.current);
      pendingDeepLink.current = null;
    }
  }, [isNavigationReady, handleNotificationNavigation]);

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
      console.log('[Notifications] Cancelling reminders - user completed a puzzle today');
      Sentry.addBreadcrumb({
        category: 'notifications',
        message: 'Cancelled reminders - puzzle completed',
        level: 'info',
        data: { gamesPlayedToday, completedPuzzlesToday },
      });
      cancelNotification(NOTIFICATION_IDS.DAILY_KICKOFF);
      cancelNotification(NOTIFICATION_IDS.STREAK_SAVER);
    }
  }, [isSupported, permissionStatus, gamesPlayedToday, completedPuzzlesToday]);

  // ============================================================================
  // Push Token Registration (when userId becomes available or permission changes)
  // ============================================================================

  useEffect(() => {
    if (permissionStatus === 'granted' && userId) {
      registerPushToken();
    }
  }, [permissionStatus, userId, registerPushToken]);

  // ============================================================================
  // Perfect Day Detection
  // ============================================================================

  useEffect(() => {
    if (!isSupported) return;

    const today = getAuthorizedDateUnsafe();
    const isPerfectDay =
      totalPuzzlesToday > 0 && completedPuzzlesToday === totalPuzzlesToday;
    const alreadyShownToday = perfectDayShownDates.includes(today);
    const justCompleted = completedPuzzlesToday > prevCompletedCount.current;

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

    prevCompletedCount.current = completedPuzzlesToday;
  }, [isSupported, completedPuzzlesToday, totalPuzzlesToday, perfectDayShownDates]);

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

      // Deep link to specific game mode when user taps a push notification
      const data = response.notification.request.content.data;
      if (data?.gameMode) {
        handleNotificationNavigation(data as Record<string, unknown>);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSupported, handleNotificationNavigation]);

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
      // Register push token immediately after permission is granted
      await registerPushToken();
    }
  }, [isSupported, currentStreak, gamesPlayedToday, scheduleNotifications, registerPushToken]);

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
      completedPuzzlesToday,
      totalPuzzlesToday,
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
      completedPuzzlesToday,
      totalPuzzlesToday,
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
