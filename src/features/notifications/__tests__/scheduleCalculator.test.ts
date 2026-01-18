/**
 * Schedule Calculator Tests
 *
 * Tests for notification time calculations with mocked time system.
 */

import {
  calculateNextTriggerTime,
  getMorningTriggerTime,
  getEveningTriggerTime,
  isPastMorningTime,
  isPastEveningTime,
  getDebugTriggerTime,
} from '../utils/scheduleCalculator';
import { getTimeDriftMs, isTimeTampered } from '@/lib/time';

// Mock the time module
jest.mock('@/lib/time', () => ({
  getTimeDriftMs: jest.fn(() => 0),
  isTimeTampered: jest.fn(() => false),
}));

const mockGetTimeDriftMs = getTimeDriftMs as jest.Mock;
const mockIsTimeTampered = isTimeTampered as jest.Mock;

describe('scheduleCalculator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetTimeDriftMs.mockReturnValue(0);
    mockIsTimeTampered.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('calculateNextTriggerTime', () => {
    it('returns null when time is tampered', () => {
      mockIsTimeTampered.mockReturnValue(true);

      const result = calculateNextTriggerTime(8, 30);

      expect(result).toBeNull();
    });

    it('schedules for today if time has not passed', () => {
      jest.setSystemTime(new Date('2025-01-15T07:00:00'));

      const result = calculateNextTriggerTime(8, 30);

      expect(result).not.toBeNull();
      expect(result?.getHours()).toBe(8);
      expect(result?.getMinutes()).toBe(30);
      expect(result?.getDate()).toBe(15);
    });

    it('schedules for tomorrow if time has passed', () => {
      jest.setSystemTime(new Date('2025-01-15T09:00:00'));

      const result = calculateNextTriggerTime(8, 30);

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(16);
      expect(result?.getHours()).toBe(8);
      expect(result?.getMinutes()).toBe(30);
    });

    it('schedules for tomorrow if time equals trigger time', () => {
      jest.setSystemTime(new Date('2025-01-15T08:30:00'));

      const result = calculateNextTriggerTime(8, 30);

      expect(result?.getDate()).toBe(16);
    });

    it('applies positive drift adjustment when enabled', () => {
      jest.setSystemTime(new Date('2025-01-15T07:00:00'));
      mockGetTimeDriftMs.mockReturnValue(5 * 60 * 1000); // Device 5 min ahead

      const result = calculateNextTriggerTime(8, 30, true);

      // Device clock is ahead, so we schedule later on device clock
      // 8:30 real time = 8:35 device time
      expect(result?.getMinutes()).toBe(35);
    });

    it('applies negative drift adjustment when enabled', () => {
      jest.setSystemTime(new Date('2025-01-15T07:00:00'));
      mockGetTimeDriftMs.mockReturnValue(-5 * 60 * 1000); // Device 5 min behind

      const result = calculateNextTriggerTime(8, 30, true);

      // Device clock is behind, so we schedule earlier on device clock
      // 8:30 real time = 8:25 device time
      expect(result?.getMinutes()).toBe(25);
    });

    it('skips drift adjustment when disabled', () => {
      jest.setSystemTime(new Date('2025-01-15T07:00:00'));
      mockGetTimeDriftMs.mockReturnValue(5 * 60 * 1000);

      const result = calculateNextTriggerTime(8, 30, false);

      expect(result?.getMinutes()).toBe(30); // No adjustment
    });

    it('handles midnight edge case', () => {
      jest.setSystemTime(new Date('2025-01-15T23:30:00'));

      const result = calculateNextTriggerTime(0, 0);

      expect(result?.getDate()).toBe(16);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
    });

    it('handles month boundary', () => {
      jest.setSystemTime(new Date('2025-01-31T23:00:00'));

      const result = calculateNextTriggerTime(8, 30);

      expect(result?.getMonth()).toBe(1); // February (0-indexed)
      expect(result?.getDate()).toBe(1);
    });
  });

  describe('getMorningTriggerTime', () => {
    it('returns 08:30 trigger time', () => {
      jest.setSystemTime(new Date('2025-01-15T06:00:00'));

      const result = getMorningTriggerTime();

      expect(result?.getHours()).toBe(8);
      expect(result?.getMinutes()).toBe(30);
    });

    it('returns null when time is tampered', () => {
      mockIsTimeTampered.mockReturnValue(true);

      const result = getMorningTriggerTime();

      expect(result).toBeNull();
    });

    it('schedules for tomorrow if past 08:30', () => {
      jest.setSystemTime(new Date('2025-01-15T10:00:00'));

      const result = getMorningTriggerTime();

      expect(result?.getDate()).toBe(16);
    });
  });

  describe('getEveningTriggerTime', () => {
    it('returns 20:00 trigger time', () => {
      jest.setSystemTime(new Date('2025-01-15T06:00:00'));

      const result = getEveningTriggerTime();

      expect(result?.getHours()).toBe(20);
      expect(result?.getMinutes()).toBe(0);
    });

    it('returns null when time is tampered', () => {
      mockIsTimeTampered.mockReturnValue(true);

      const result = getEveningTriggerTime();

      expect(result).toBeNull();
    });

    it('schedules for tomorrow if past 20:00', () => {
      jest.setSystemTime(new Date('2025-01-15T21:00:00'));

      const result = getEveningTriggerTime();

      expect(result?.getDate()).toBe(16);
    });
  });

  describe('isPastMorningTime', () => {
    it('returns true when past morning time', () => {
      jest.setSystemTime(new Date('2025-01-15T09:00:00'));

      expect(isPastMorningTime()).toBe(true);
    });

    it('returns false when before morning time', () => {
      jest.setSystemTime(new Date('2025-01-15T07:00:00'));

      expect(isPastMorningTime()).toBe(false);
    });

    it('returns true when exactly at morning time', () => {
      jest.setSystemTime(new Date('2025-01-15T08:30:01'));

      expect(isPastMorningTime()).toBe(true);
    });
  });

  describe('isPastEveningTime', () => {
    it('returns true when past evening time', () => {
      jest.setSystemTime(new Date('2025-01-15T21:00:00'));

      expect(isPastEveningTime()).toBe(true);
    });

    it('returns false when before evening time', () => {
      jest.setSystemTime(new Date('2025-01-15T19:00:00'));

      expect(isPastEveningTime()).toBe(false);
    });

    it('returns true when exactly at evening time', () => {
      jest.setSystemTime(new Date('2025-01-15T20:00:01'));

      expect(isPastEveningTime()).toBe(true);
    });
  });

  describe('getDebugTriggerTime', () => {
    it('returns time 5 seconds in the future', () => {
      const now = new Date('2025-01-15T12:00:00.000Z');
      jest.setSystemTime(now);

      const result = getDebugTriggerTime();

      expect(result.getTime()).toBe(now.getTime() + 5000);
    });
  });
});
