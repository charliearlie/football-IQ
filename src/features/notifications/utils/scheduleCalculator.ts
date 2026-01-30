/**
 * Schedule Calculator
 *
 * Calculates notification trigger times adjusted for True-Time drift.
 * This ensures notifications fire at the correct "real" time even if
 * the device clock is slightly off.
 */

import { getTimeDriftMs, isTimeTampered } from '@/lib/time';

/**
 * Notification schedule configuration.
 * Centralizes timing constants for easy modification and testing.
 */
export interface NotificationScheduleConfig {
  dailyReminder: { hour: number; minute: number };
  streakSaverOffsetHours: number; // Hours after daily reminder
}

/**
 * Default notification schedule.
 * - Daily Reminder: 08:30
 * - Streak Saver: 12 hours after daily = 20:30
 */
export const DEFAULT_SCHEDULE_CONFIG: NotificationScheduleConfig = {
  dailyReminder: { hour: 8, minute: 30 },
  streakSaverOffsetHours: 12,
};

// Derived timing values (for backward compatibility)
const MORNING_HOUR = DEFAULT_SCHEDULE_CONFIG.dailyReminder.hour;
const MORNING_MINUTE = DEFAULT_SCHEDULE_CONFIG.dailyReminder.minute;

// Calculate streak saver time from offset
const streakSaverHour =
  (MORNING_HOUR + DEFAULT_SCHEDULE_CONFIG.streakSaverOffsetHours) % 24;
const EVENING_HOUR = streakSaverHour;
const EVENING_MINUTE = MORNING_MINUTE; // Same minute as daily (XX:30)

/**
 * Calculate the next occurrence of a specific local time.
 *
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @param adjustForDrift - Whether to adjust for True-Time drift
 * @returns Date object for the next occurrence, or null if time is tampered
 */
export function calculateNextTriggerTime(
  hour: number,
  minute: number,
  adjustForDrift: boolean = true
): Date | null {
  // Don't schedule if time is tampered
  if (isTimeTampered()) {
    console.log('[ScheduleCalculator] Time tampered, skipping schedule');
    return null;
  }

  const now = new Date();
  const trigger = new Date();

  // Set to today at the specified time
  trigger.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  // Adjust for True-Time drift if enabled
  // If device clock is ahead by 5 minutes, we need to trigger 5 minutes earlier
  // If device clock is behind by 5 minutes, we need to trigger 5 minutes later
  if (adjustForDrift) {
    const driftMs = getTimeDriftMs();
    trigger.setTime(trigger.getTime() + driftMs);
  }

  return trigger;
}

/**
 * Get the trigger time for the morning "Daily Kick-off" notification.
 * Scheduled for 08:30 local time.
 */
export function getMorningTriggerTime(): Date | null {
  return calculateNextTriggerTime(MORNING_HOUR, MORNING_MINUTE);
}

/**
 * Get the trigger time for the evening "Streak Saver" notification.
 * Scheduled for 20:00 local time.
 */
export function getEveningTriggerTime(): Date | null {
  return calculateNextTriggerTime(EVENING_HOUR, EVENING_MINUTE);
}

/**
 * Check if the current time is past the morning notification time.
 * Used to determine if we should schedule for today or tomorrow.
 */
export function isPastMorningTime(): boolean {
  const now = new Date();
  const morning = new Date();
  morning.setHours(MORNING_HOUR, MORNING_MINUTE, 0, 0);
  return now.getTime() > morning.getTime();
}

/**
 * Check if the current time is past the evening notification time.
 * Used to determine if streak saver should be scheduled.
 */
export function isPastEveningTime(): boolean {
  const now = new Date();
  const evening = new Date();
  evening.setHours(EVENING_HOUR, EVENING_MINUTE, 0, 0);
  return now.getTime() > evening.getTime();
}

/**
 * Get a debug-friendly trigger time for testing (5 seconds from now).
 * Only use during development.
 */
export function getDebugTriggerTime(): Date {
  const trigger = new Date();
  trigger.setTime(trigger.getTime() + 5000);
  return trigger;
}
