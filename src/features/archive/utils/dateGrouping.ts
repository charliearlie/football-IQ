/**
 * Date Grouping Utilities
 *
 * Functions for grouping archive puzzles by month/year for SectionList display.
 * Also includes lock logic for premium/ad-unlock gating.
 */

import { ArchivePuzzle, ArchiveSection, DayGroup } from '../types/archive.types';
import { UnlockedPuzzle } from '@/types/database';
import { getAuthorizedDateUnsafe } from '@/lib/time';

/**
 * Month names for display formatting.
 */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Get the month key (YYYY-MM) from a date string.
 */
function getMonthKey(dateString: string): string {
  const [year, month] = dateString.split('-');
  return `${year}-${month}`;
}

/**
 * Format a month key to display title (e.g., "December 2024").
 */
function formatMonthTitle(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/**
 * Group puzzles within a month by day.
 *
 * @param puzzles - Array of puzzles within a single month
 * @returns Array of day groups sorted by date DESC
 */
function groupPuzzlesByDay(puzzles: ArchivePuzzle[]): DayGroup[] {
  const dayMap = new Map<string, ArchivePuzzle[]>();

  for (const puzzle of puzzles) {
    const existing = dayMap.get(puzzle.puzzleDate);
    if (existing) {
      existing.push(puzzle);
    } else {
      dayMap.set(puzzle.puzzleDate, [puzzle]);
    }
  }

  const days: DayGroup[] = [];
  for (const [dayKey, dayPuzzles] of dayMap) {
    days.push({
      dayKey,
      dayTitle: formatPuzzleDate(dayKey),
      puzzles: dayPuzzles,
    });
  }

  // Sort by day descending (newest first)
  days.sort((a, b) => b.dayKey.localeCompare(a.dayKey));

  return days;
}

/**
 * Group puzzles by month/year for SectionList display.
 * Also includes day sub-grouping within each month.
 *
 * @param puzzles - Array of archive puzzles (already sorted by date DESC)
 * @returns Array of sections with puzzles grouped by month
 */
export function groupByMonth(puzzles: ArchivePuzzle[]): ArchiveSection[] {
  if (puzzles.length === 0) return [];

  // Group puzzles by month key
  const groups = new Map<string, ArchivePuzzle[]>();

  for (const puzzle of puzzles) {
    const key = getMonthKey(puzzle.puzzleDate);
    const existing = groups.get(key);
    if (existing) {
      existing.push(puzzle);
    } else {
      groups.set(key, [puzzle]);
    }
  }

  // Convert to sections array with day sub-groups
  const sections: ArchiveSection[] = [];

  for (const [monthKey, data] of groups) {
    sections.push({
      title: formatMonthTitle(monthKey),
      monthKey,
      data,
      days: groupPuzzlesByDay(data),
    });
  }

  // Sort sections by monthKey descending (newest first)
  sections.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  return sections;
}

/**
 * Format a puzzle date for display.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Tuesday, Dec 24")
 */
export function formatPuzzleDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00'); // Add time to avoid timezone issues
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${dayName}, ${monthDay}`;
}

/**
 * Check if a puzzle date is within the free access window (last 7 days).
 * Uses the time integrity system for the authorized "today" date.
 *
 * @param puzzleDate - Puzzle date in YYYY-MM-DD format
 * @returns true if the puzzle is within the 7-day window
 */
export function isWithinFreeWindow(puzzleDate: string): boolean {
  // Add time component to avoid timezone parsing issues
  // (YYYY-MM-DD without time is parsed as UTC, which can shift the day in local timezone)
  const date = new Date(puzzleDate + 'T12:00:00');
  date.setHours(0, 0, 0, 0);

  // Use authorized date from time integrity system (local timezone)
  const todayStr = getAuthorizedDateUnsafe();
  const today = new Date(todayStr + 'T12:00:00');
  today.setHours(0, 0, 0, 0);

  // 7-day window = today + 6 previous days (7 total)
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 6);

  return date >= windowStart;
}

/**
 * Check if a puzzle has been unlocked via ad (permanent unlock).
 *
 * @param puzzleId - The puzzle ID to check
 * @param adUnlocks - Array of ad unlocks to check against
 * @returns true if the puzzle has been ad-unlocked
 */
export function hasValidAdUnlock(
  puzzleId: string,
  adUnlocks: UnlockedPuzzle[]
): boolean {
  if (!puzzleId || !adUnlocks.length) return false;

  // Ad unlocks are permanent - just check if puzzle is in the list
  return adUnlocks.some((unlock) => unlock.puzzle_id === puzzleId);
}

/**
 * Determine if a puzzle should be locked based on user's premium status,
 * ad unlocks, and completion status.
 *
 * Access hierarchy (checked in order):
 * 1. Completed puzzles: always unlocked (can view results indefinitely)
 * 2. Premium users: always unlocked
 * 3. Within free window (7 days): unlocked
 * 4. Has valid ad unlock: unlocked
 * 5. Otherwise: locked
 *
 * @param puzzleDate - Puzzle date in YYYY-MM-DD format
 * @param isPremium - Whether the user has premium access
 * @param puzzleId - Optional puzzle ID for ad unlock and completion checking
 * @param adUnlocks - Optional array of valid ad unlocks
 * @param hasCompletedAttempt - Optional flag indicating puzzle completion
 * @returns true if the puzzle should show as locked
 */
export function isPuzzleLocked(
  puzzleDate: string,
  isPremium: boolean,
  puzzleId?: string,
  adUnlocks?: UnlockedPuzzle[],
  hasCompletedAttempt?: boolean
): boolean {
  // HIGHEST PRIORITY: Completed puzzles are never locked (permanent unlock)
  // Users can always view results for puzzles they've completed
  if (hasCompletedAttempt) return false;

  // Premium users: never locked
  if (isPremium) return false;

  // Within free window: not locked
  if (isWithinFreeWindow(puzzleDate)) return false;

  // Has valid ad unlock: not locked
  if (puzzleId && adUnlocks && hasValidAdUnlock(puzzleId, adUnlocks)) {
    return false;
  }

  // Otherwise: locked
  return true;
}
