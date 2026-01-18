/**
 * Notification Service Tests
 *
 * Tests for the expo-notifications wrapper service.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  initializeNotifications,
  requestPermissions,
  getPermissionStatus,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  NOTIFICATION_IDS,
} from '../services/notificationService';

// Get reference to mocked notifications
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('notificationService', () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to ios by default
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatformOS,
      writable: true,
    });
  });

  describe('NOTIFICATION_IDS', () => {
    it('exports expected notification IDs', () => {
      expect(NOTIFICATION_IDS.DAILY_KICKOFF).toBe('daily_kickoff');
      expect(NOTIFICATION_IDS.STREAK_SAVER).toBe('streak_saver');
    });
  });

  describe('initializeNotifications', () => {
    it('sets notification handler', async () => {
      await initializeNotifications();

      expect(mockNotifications.setNotificationHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          handleNotification: expect.any(Function),
        })
      );
    });

    it('creates Android channel on Android', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });

      await initializeNotifications();

      expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'football-iq-reminders',
        expect.objectContaining({
          name: 'Game Reminders',
          importance: Notifications.AndroidImportance.HIGH,
        })
      );
    });

    it('skips Android channel on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });

      await initializeNotifications();

      expect(mockNotifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe('requestPermissions', () => {
    it('returns denied on web platform', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });

      const result = await requestPermissions();

      expect(result).toBe('denied');
      expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns granted when already granted', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestPermissions();

      expect(result).toBe('granted');
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission when not granted', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestPermissions();

      expect(result).toBe('granted');
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns denied when permission denied', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestPermissions();

      expect(result).toBe('denied');
    });

    it('handles errors gracefully', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission error')
      );

      const result = await requestPermissions();

      expect(result).toBe('denied');
    });
  });

  describe('getPermissionStatus', () => {
    it('returns denied on web platform', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });

      const result = await getPermissionStatus();

      expect(result).toBe('denied');
    });

    it('returns granted when permission is granted', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await getPermissionStatus();

      expect(result).toBe('granted');
    });

    it('returns undetermined when status is undetermined', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });

      const result = await getPermissionStatus();

      expect(result).toBe('undetermined');
    });

    it('handles errors gracefully', async () => {
      (mockNotifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Error')
      );

      const result = await getPermissionStatus();

      expect(result).toBe('undetermined');
    });
  });

  describe('scheduleNotification', () => {
    it('skips past notifications', async () => {
      const pastDate = new Date(Date.now() - 1000);

      const result = await scheduleNotification({
        id: 'test',
        title: 'Test',
        body: 'Test body',
        triggerDate: pastDate,
      });

      expect(result).toBeNull();
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('schedules future notifications', async () => {
      const futureDate = new Date(Date.now() + 60000);

      const result = await scheduleNotification({
        id: 'test',
        title: 'Test Title',
        body: 'Test body',
        triggerDate: futureDate,
      });

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'test',
          content: expect.objectContaining({
            title: 'Test Title',
            body: 'Test body',
          }),
        })
      );
      expect(result).toBe('notification-id');
    });

    it('cancels existing notification before scheduling', async () => {
      const futureDate = new Date(Date.now() + 60000);

      await scheduleNotification({
        id: 'test',
        title: 'Test',
        body: 'Test body',
        triggerDate: futureDate,
      });

      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('test');
    });

    it('sets high priority when specified', async () => {
      const futureDate = new Date(Date.now() + 60000);

      await scheduleNotification({
        id: 'test',
        title: 'Test',
        body: 'Test body',
        triggerDate: futureDate,
        priority: 'high',
      });

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            priority: Notifications.AndroidNotificationPriority.HIGH,
          }),
        })
      );
    });

    it('handles scheduling errors gracefully', async () => {
      const futureDate = new Date(Date.now() + 60000);
      (mockNotifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Schedule failed')
      );

      const result = await scheduleNotification({
        id: 'test',
        title: 'Test',
        body: 'Test body',
        triggerDate: futureDate,
      });

      expect(result).toBeNull();
    });
  });

  describe('cancelNotification', () => {
    it('calls expo cancelScheduledNotificationAsync', async () => {
      await cancelNotification('test-id');

      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('test-id');
    });

    it('handles errors gracefully', async () => {
      (mockNotifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      await expect(cancelNotification('test-id')).resolves.not.toThrow();
    });
  });

  describe('cancelAllNotifications', () => {
    it('calls expo cancelAllScheduledNotificationsAsync', async () => {
      await cancelAllNotifications();

      expect(mockNotifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      (mockNotifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );

      await expect(cancelAllNotifications()).resolves.not.toThrow();
    });
  });

  describe('getScheduledNotifications', () => {
    it('returns scheduled notifications', async () => {
      const mockNotificationsList = [
        { identifier: 'test1' },
        { identifier: 'test2' },
      ];
      (mockNotifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        mockNotificationsList
      );

      const result = await getScheduledNotifications();

      expect(result).toEqual(mockNotificationsList);
    });

    it('returns empty array on error', async () => {
      (mockNotifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );

      const result = await getScheduledNotifications();

      expect(result).toEqual([]);
    });
  });
});
