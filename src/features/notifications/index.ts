/**
 * Notifications Feature Module
 *
 * Local notification system for maximizing DAU and retention.
 * Features:
 * - Daily Kick-off (08:30): Morning reminder if user hasn't played
 * - Streak Saver (20:00): Evening alert if streak at risk
 * - Perfect Day Celebration: Full-screen celebration when all puzzles completed
 */

// Context
export {
  NotificationProvider,
  useNotifications,
} from './context/NotificationContext';

// Components
export { NotificationPermissionModal } from './components/NotificationPermissionModal';
export { PerfectDayCelebration } from './components/PerfectDayCelebration';
export { NotificationWrapper } from './components/NotificationWrapper';

// Services
export {
  initializeNotifications,
  requestPermissions,
  getPermissionStatus,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  NOTIFICATION_IDS,
} from './services/notificationService';

// Utils
export {
  getMorningTriggerTime,
  getEveningTriggerTime,
  calculateNextTriggerTime,
} from './utils/scheduleCalculator';
export {
  getMorningMessage,
  getStreakSaverMessage,
} from './utils/messageRotation';

// Types
export type {
  NotificationType,
  PermissionStatus,
  NotificationContextValue,
  NotificationPermissionModalProps,
  PerfectDayCelebrationProps,
  MorningMessage,
  ScheduledNotification,
} from './types';
