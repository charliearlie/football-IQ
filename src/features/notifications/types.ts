/**
 * Notification Feature Types
 *
 * Type definitions for the local notification system.
 */

/**
 * Types of notifications the app can send
 */
export type NotificationType = 'daily_kickoff' | 'streak_saver';

/**
 * Permission status for notifications
 */
export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

/**
 * Notification context value exposed to consumers
 */
export interface NotificationContextValue {
  /** Current permission status */
  permissionStatus: PermissionStatus;
  /** Whether we've asked for permission already */
  hasAskedPermission: boolean;
  /** Whether to show the custom permission modal */
  showPermissionModal: boolean;
  /** Request notification permissions */
  requestNotificationPermission: () => Promise<void>;
  /** Dismiss the permission modal */
  dismissPermissionModal: () => void;
  /** Trigger the Perfect Day celebration */
  triggerPerfectDayCelebration: () => void;
  /** Whether the Perfect Day celebration is showing */
  isPerfectDayCelebrating: boolean;
  /** Dismiss the Perfect Day celebration */
  dismissPerfectDayCelebration: () => void;
}

/**
 * Props for the notification permission modal
 */
export interface NotificationPermissionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when user accepts */
  onAccept: () => void;
  /** Called when user declines */
  onDecline: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the Perfect Day celebration modal
 */
export interface PerfectDayCelebrationProps {
  /** Whether the celebration is visible */
  visible: boolean;
  /** Number of puzzles completed */
  puzzleCount: number;
  /** Current streak count */
  streakCount: number;
  /** Called when user dismisses */
  onDismiss: () => void;
  /** Called when user wants to share */
  onShare: () => Promise<void>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Morning notification message
 */
export interface MorningMessage {
  title: string;
  body: string;
}

/**
 * Scheduled notification info
 */
export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  scheduledFor: Date;
}
