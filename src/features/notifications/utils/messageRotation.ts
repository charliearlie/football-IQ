/**
 * Message Rotation
 *
 * Provides rotating notification messages for variety.
 * Selection is deterministic based on day-of-year to ensure
 * consistent messages across app restarts on the same day.
 */

import type { MorningMessage } from '../types';

/**
 * Morning "Daily Kick-off" notification messages.
 * Rotated daily based on day-of-year.
 *
 * Note: Only reference guaranteed daily games (Career Path, Transfer Guess)
 * or use generic messages. Other games rotate so can't be mentioned specifically.
 */
const MORNING_MESSAGES: MorningMessage[] = [
  {
    title: 'Daily Kick-off!',
    body: 'Your new daily games are ready!',
  },
  {
    title: 'Career Path awaits!',
    body: "Can you guess today's mystery player?",
  },
  {
    title: 'New Transfer to guess!',
    body: 'A new transfer puzzle is ready. Who made the move?',
  },
  {
    title: 'Game On!',
    body: 'Fresh daily challenges are waiting for you!',
  },
];

/**
 * Streak-aware morning messages.
 * Returns messages that incorporate the user's current streak count.
 */
function getStreakMessages(streakCount: number): MorningMessage[] {
  return [
    {
      title: `Day ${streakCount}!`,
      body: 'Keep your streak alive — new games are ready.',
    },
    {
      title: `${streakCount} days strong!`,
      body: "Today's games are waiting. Don't break the chain!",
    },
    {
      title: `Streak: ${streakCount} days`,
      body: 'Your daily challenges are ready. Keep it going!',
    },
  ];
}

/**
 * Get the day-of-year (1-366) for a given date.
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get the morning notification message for today.
 * Selection is deterministic based on day-of-year.
 *
 * When the user has a streak of 3+ days, alternates between
 * streak-aware messages and regular messages (50/50 based on day-of-year).
 */
export function getMorningMessage(streakCount?: number): MorningMessage {
  const dayOfYear = getDayOfYear(new Date());

  // For streaks of 3+, alternate between streak and regular messages
  if (streakCount !== undefined && streakCount >= 3) {
    const useStreakMessage = dayOfYear % 2 === 0;
    if (useStreakMessage) {
      const streakMessages = getStreakMessages(streakCount);
      const index = dayOfYear % streakMessages.length;
      return streakMessages[index];
    }
  }

  const index = dayOfYear % MORNING_MESSAGES.length;
  return MORNING_MESSAGES[index];
}

/**
 * Get the "Streak Saver" notification content.
 * @param streakCount - The user's current streak count
 */
export function getStreakSaverMessage(streakCount: number): {
  title: string;
  body: string;
} {
  return {
    title: 'STREAK AT RISK',
    body: `Your ${streakCount} day streak ends in 4 hours!`,
  };
}

/**
 * Get the weekly recap notification content.
 * @param stats - Week stats including days played, total days, IQ gained, and tier name
 */
export function getWeeklyRecapMessage(stats: {
  daysPlayed: number;
  totalDays: number;
  iqGained: number;
  tierName: string;
}): { title: string; body: string } {
  return {
    title: 'YOUR WEEK IN REVIEW',
    body: `This week: ${stats.daysPlayed}/${stats.totalDays} days played, +${stats.iqGained} IQ. You're a ${stats.tierName}!`,
  };
}

/**
 * Get a specific morning message by index (for testing/preview).
 */
export function getMorningMessageByIndex(index: number): MorningMessage {
  return MORNING_MESSAGES[index % MORNING_MESSAGES.length];
}

/**
 * Get all available morning messages (for settings preview).
 */
export function getAllMorningMessages(): MorningMessage[] {
  return [...MORNING_MESSAGES];
}
