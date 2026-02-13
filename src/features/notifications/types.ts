/**
 * Notification Feature Types
 *
 * Type definitions for the local notification system.
 */

import type { IQTier } from "@/features/stats/utils/tierProgression";

/**
 * Types of notifications the app can send
 */
export type NotificationType = '101' | '102' | '103';

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
  /** Number of puzzles completed today (for Perfect Day celebration) */
  completedPuzzlesToday: number;
  /** Total puzzles available today */
  totalPuzzlesToday: number;
  /** Whether the Tier Level-Up celebration is showing */
  isTierUpCelebrating: boolean;
  /** Tier level-up data */
  tierUpData: { tier: IQTier; totalIQ: number } | null;
  /** Dismiss the Tier Level-Up celebration */
  dismissTierUpCelebration: () => void;
  /** Whether the First Win celebration is showing */
  isFirstWinCelebrating: boolean;
  /** Dismiss the First Win celebration */
  dismissFirstWinCelebration: () => void;
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

/**
 * Props for the Tier Level-Up celebration modal
 */
export interface TierLevelUpCelebrationProps {
  /** Whether the celebration is visible */
  visible: boolean;
  /** The tier that was reached */
  tier: IQTier;
  /** The user's total IQ */
  totalIQ: number;
  /** Called when user dismisses */
  onDismiss: () => void;
  /** Called when user wants to share */
  onShare: () => Promise<void>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the First Win celebration modal
 */
export interface FirstWinCelebrationProps {
  /** Whether the celebration is visible */
  visible: boolean;
  /** Called when user dismisses */
  onDismiss: () => void;
  /** Called when user wants to share */
  onShare: () => Promise<void>;
  /** Test ID for testing */
  testID?: string;
}
