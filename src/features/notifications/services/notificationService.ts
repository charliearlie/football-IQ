/**
 * Notification Service
 *
 * Wrapper around expo-notifications for scheduling local notifications.
 * Handles platform-specific configuration and permission requests.
 */

import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import type { NotificationType, PermissionStatus } from '../types';

// Notification IDs (stable for cancellation)
export const NOTIFICATION_IDS = {
  DAILY_KICKOFF: 'daily_kickoff',
  STREAK_SAVER: 'streak_saver',
} as const;

// Android notification channel
const CHANNEL_ID = 'football-iq-reminders';
const CHANNEL_NAME = 'Game Reminders';

/**
 * Initialize the notification system.
 * Must be called before scheduling any notifications.
 */
export async function initializeNotifications(): Promise<void> {
  // Set notification handler for foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Create Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22C55E', // Pitch Green
    });
  }

  Sentry.addBreadcrumb({
    category: 'notifications',
    message: 'Notification system initialized',
    level: 'info',
  });
}

/**
 * Request notification permissions from the user.
 * Returns the resulting permission status.
 */
export async function requestPermissions(): Promise<PermissionStatus> {
  // Skip on web
  if (Platform.OS === 'web') {
    return 'denied';
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    // Already granted
    if (existingStatus === 'granted') {
      return 'granted';
    }

    // Request permission
    const { status } = await Notifications.requestPermissionsAsync();

    Sentry.addBreadcrumb({
      category: 'notifications',
      message: 'Permission requested',
      level: 'info',
      data: { status },
    });

    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    }

    return 'undetermined';
  } catch (error) {
    console.error('[Notifications] Failed to request permissions:', error);
    Sentry.captureException(error);
    return 'denied';
  }
}

/**
 * Get the current notification permission status.
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'denied';
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    }

    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/**
 * Schedule a local notification at a specific time.
 */
export async function scheduleNotification(options: {
  id: string;
  title: string;
  body: string;
  triggerDate: Date;
  priority?: 'default' | 'high';
}): Promise<string | null> {
  const { id, title, body, triggerDate, priority = 'default' } = options;

  // Don't schedule in the past
  if (triggerDate.getTime() <= Date.now()) {
    console.log('[Notifications] Skipping past notification:', id);
    return null;
  }

  try {
    // Cancel existing notification with same ID first
    await cancelNotification(id);

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title,
        body,
        sound: true,
        priority:
          priority === 'high'
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT,
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    Sentry.addBreadcrumb({
      category: 'notifications',
      message: 'notification_scheduled',
      level: 'info',
      data: {
        id,
        scheduledFor: triggerDate.toISOString(),
        priority,
      },
    });

    console.log(
      '[Notifications] Scheduled:',
      id,
      'for',
      triggerDate.toLocaleTimeString()
    );

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Failed to schedule:', error);
    Sentry.captureException(error);
    return null;
  }
}

/**
 * Cancel a scheduled notification by its ID.
 */
export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log('[Notifications] Cancelled:', id);
  } catch (error) {
    // Ignore errors - notification may not exist
    console.log('[Notifications] Cancel failed (may not exist):', id);
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] Cancelled all notifications');
  } catch (error) {
    console.error('[Notifications] Failed to cancel all:', error);
  }
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

/**
 * Add a listener for received notifications (app in foreground).
 */
export function addReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    const type = notification.request.identifier as NotificationType;

    Sentry.addBreadcrumb({
      category: 'notifications',
      message: 'notification_received',
      level: 'info',
      data: {
        type,
        timestamp: new Date().toISOString(),
      },
    });

    callback(notification);
  });
}

/**
 * Add a listener for notification interactions (user tapped notification).
 */
export function addResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const type = response.notification.request.identifier as NotificationType;

    Sentry.addBreadcrumb({
      category: 'notifications',
      message: 'notification_opened',
      level: 'info',
      data: {
        type,
        timestamp: new Date().toISOString(),
      },
    });

    callback(response);
  });
}
