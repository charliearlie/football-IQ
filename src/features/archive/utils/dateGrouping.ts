/**
 * Date Grouping Utilities
 *
 * Functions for grouping archive puzzles by month/year for SectionList display.
 */

import { ArchivePuzzle, ArchiveSection } from '../types/archive.types';

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
 * Group puzzles by month/year for SectionList display.
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

  // Convert to sections array, maintaining sort order
  const sections: ArchiveSection[] = [];

  for (const [monthKey, data] of groups) {
    sections.push({
      title: formatMonthTitle(monthKey),
      monthKey,
      data,
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
 *
 * @param puzzleDate - Puzzle date in YYYY-MM-DD format
 * @returns true if the puzzle is within the 7-day window
 */
export function isWithinFreeWindow(puzzleDate: string): boolean {
  const date = new Date(puzzleDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return date >= sevenDaysAgo;
}

/**
 * Determine if a puzzle should be locked based on user's premium status.
 *
 * @param puzzleDate - Puzzle date in YYYY-MM-DD format
 * @param isPremium - Whether the user has premium access
 * @returns true if the puzzle should show as locked
 */
export function isPuzzleLocked(puzzleDate: string, isPremium: boolean): boolean {
  if (isPremium) return false;
  return !isWithinFreeWindow(puzzleDate);
}
