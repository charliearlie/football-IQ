/**
 * Intelligent Scheduler Engine
 *
 * Defines the weekly puzzle schedule and provides utilities for:
 * - Determining which puzzles are required on any given day
 * - Detecting missing puzzles (gaps) in a date range
 * - Checking if a game mode is required/premium on a specific date
 */

import { format, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import type { GameMode } from "./constants";

// ============================================================================
// TYPES
// ============================================================================

/** Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A slot in the weekly schedule */
export interface ScheduleSlot {
  gameMode: GameMode;
  /** Days of week when this mode runs. Empty array = daily */
  days: DayOfWeek[];
  /** Whether this slot produces premium content */
  isPremium: boolean;
}

/** A required puzzle for a specific date */
export interface ScheduleRequirement {
  gameMode: GameMode;
  isPremium: boolean;
}

/** A missing puzzle identified by the scheduler */
export interface MissingPuzzle {
  date: string; // YYYY-MM-DD
  gameMode: GameMode;
  isPremium: boolean;
  dayOfWeek: DayOfWeek;
}

/** Existing puzzle for comparison (minimal interface) */
export interface ExistingPuzzle {
  puzzle_date: string | null;
  game_mode: string;
}

// ============================================================================
// WEEKLY SCHEDULE CONFIGURATION
// ============================================================================

/**
 * The master weekly schedule for Football IQ puzzles.
 *
 * Schedule rules:
 * - career_path: Daily (Free)
 * - career_path_pro: Daily (Premium)
 * - guess_the_transfer: Daily (Free)
 * - guess_the_goalscorers: Wednesday, Saturday (Free)
 * - topical_quiz: Friday (Free), Tuesday (Premium)
 * - top_tens: Monday, Thursday (Premium)
 * - starting_xi: Sunday (Free)
 *
 * Note: the_grid is excluded from schedule (not yet live)
 */
export const WEEKLY_SCHEDULE: ScheduleSlot[] = [
  // Daily Free modes
  { gameMode: "career_path", days: [], isPremium: false },
  { gameMode: "guess_the_transfer", days: [], isPremium: false },

  // Daily Premium modes
  { gameMode: "career_path_pro", days: [], isPremium: true },

  // Specific days - Free
  { gameMode: "guess_the_goalscorers", days: [3, 6], isPremium: false }, // Wed, Sat
  { gameMode: "topical_quiz", days: [5], isPremium: false }, // Friday (Free)
  { gameMode: "starting_xi", days: [0], isPremium: false }, // Sunday

  // Specific days - Premium
  { gameMode: "topical_quiz", days: [2], isPremium: true }, // Tuesday (Premium)
  { gameMode: "top_tens", days: [1, 4], isPremium: true }, // Mon, Thu
];

/**
 * Game modes that are part of the active schedule.
 * Use this to filter UI when showing "required" vs "optional" modes.
 */
export const SCHEDULED_MODES: GameMode[] = [
  "career_path",
  "career_path_pro",
  "guess_the_transfer",
  "guess_the_goalscorers",
  "topical_quiz",
  "top_tens",
  "starting_xi",
];

/**
 * Game modes not currently in the schedule (can still be created manually).
 */
export const UNSCHEDULED_MODES: GameMode[] = ["the_grid"];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get all required puzzles for a specific date.
 *
 * @param date - The date to check
 * @returns Array of required game modes with their premium status
 *
 * @example
 * // Monday requirements
 * getRequirementsForDate(new Date('2026-01-26'))
 * // Returns: [
 * //   { gameMode: 'career_path', isPremium: false },
 * //   { gameMode: 'career_path_pro', isPremium: true },
 * //   { gameMode: 'guess_the_transfer', isPremium: false },
 * //   { gameMode: 'top_tens', isPremium: true },
 * // ]
 */
export function getRequirementsForDate(date: Date): ScheduleRequirement[] {
  const dayOfWeek = date.getDay() as DayOfWeek;
  const requirements: ScheduleRequirement[] = [];

  for (const slot of WEEKLY_SCHEDULE) {
    // Daily modes (empty days array)
    if (slot.days.length === 0) {
      requirements.push({
        gameMode: slot.gameMode,
        isPremium: slot.isPremium,
      });
    }
    // Specific day modes
    else if (slot.days.includes(dayOfWeek)) {
      requirements.push({
        gameMode: slot.gameMode,
        isPremium: slot.isPremium,
      });
    }
  }

  return requirements;
}

/**
 * Get the count of required puzzles for a specific date.
 */
export function getRequiredCountForDate(date: Date): number {
  return getRequirementsForDate(date).length;
}

/**
 * Check if a game mode is required on a specific date.
 */
export function isRequiredOnDate(gameMode: GameMode, date: Date): boolean {
  const requirements = getRequirementsForDate(date);
  return requirements.some((r) => r.gameMode === gameMode);
}

/**
 * Check if a game mode is premium on a specific date.
 * This accounts for modes like topical_quiz that are premium on some days but not others.
 *
 * @returns true if premium, false if free, undefined if not scheduled that day
 */
export function isPremiumOnDate(
  gameMode: GameMode,
  date: Date
): boolean | undefined {
  const requirements = getRequirementsForDate(date);
  const match = requirements.find((r) => r.gameMode === gameMode);
  return match?.isPremium;
}

/**
 * Get missing puzzles for a date range by comparing against existing puzzles.
 *
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @param existingPuzzles - Array of existing puzzles to compare against
 * @returns Array of missing puzzles sorted by date then game mode
 *
 * @example
 * const missing = getMissingPuzzles(
 *   new Date('2026-01-20'),
 *   new Date('2026-01-26'),
 *   puzzlesFromDB
 * );
 */
export function getMissingPuzzles(
  startDate: Date,
  endDate: Date,
  existingPuzzles: ExistingPuzzle[]
): MissingPuzzle[] {
  const missing: MissingPuzzle[] = [];

  // Create a Set of existing "date:mode" keys for O(1) lookup
  const existingSet = new Set(
    existingPuzzles
      .filter((p) => p.puzzle_date !== null)
      .map((p) => `${p.puzzle_date}:${p.game_mode}`)
  );

  // Iterate through each day in the range
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = format(current, "yyyy-MM-dd");
    const dayOfWeek = current.getDay() as DayOfWeek;
    const requirements = getRequirementsForDate(current);

    for (const req of requirements) {
      const key = `${dateStr}:${req.gameMode}`;
      if (!existingSet.has(key)) {
        missing.push({
          date: dateStr,
          gameMode: req.gameMode,
          isPremium: req.isPremium,
          dayOfWeek,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return missing;
}

/**
 * Get missing puzzles for a specific week (Monday to Sunday).
 *
 * @param anyDateInWeek - Any date within the target week
 * @param existingPuzzles - Existing puzzles to compare against
 */
export function getMissingPuzzlesForWeek(
  anyDateInWeek: Date,
  existingPuzzles: ExistingPuzzle[]
): MissingPuzzle[] {
  // Start week on Monday (weekStartsOn: 1)
  const monday = startOfWeek(anyDateInWeek, { weekStartsOn: 1 });
  const sunday = endOfWeek(anyDateInWeek, { weekStartsOn: 1 });

  return getMissingPuzzles(monday, sunday, existingPuzzles);
}

/**
 * Get all dates in a week (Monday to Sunday) as YYYY-MM-DD strings.
 */
export function getWeekDates(anyDateInWeek: Date): string[] {
  const monday = startOfWeek(anyDateInWeek, { weekStartsOn: 1 });
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    dates.push(format(addDays(monday, i), "yyyy-MM-dd"));
  }

  return dates;
}

/**
 * Find the next missing puzzle after a given date.
 * Useful for "Save & Next Gap" workflow.
 *
 * @param fromDate - Start searching from this date (exclusive)
 * @param existingPuzzles - Existing puzzles to compare against
 * @param maxDaysToSearch - Maximum days to search ahead (default: 30)
 * @returns The next missing puzzle, or null if none found
 */
export function findNextGap(
  fromDate: string,
  existingPuzzles: ExistingPuzzle[],
  maxDaysToSearch: number = 30
): MissingPuzzle | null {
  const startDate = addDays(parseISO(fromDate), 1); // Start from next day
  const endDate = addDays(startDate, maxDaysToSearch);

  const missing = getMissingPuzzles(startDate, endDate, existingPuzzles);

  return missing.length > 0 ? missing[0] : null;
}

/**
 * Get a summary of schedule coverage for a date range.
 */
export function getScheduleCoverage(
  startDate: Date,
  endDate: Date,
  existingPuzzles: ExistingPuzzle[]
): {
  totalRequired: number;
  totalPopulated: number;
  totalMissing: number;
  coverage: number; // 0-100
} {
  let totalRequired = 0;
  let totalPopulated = 0;

  const existingSet = new Set(
    existingPuzzles
      .filter((p) => p.puzzle_date !== null)
      .map((p) => `${p.puzzle_date}:${p.game_mode}`)
  );

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = format(current, "yyyy-MM-dd");
    const requirements = getRequirementsForDate(current);

    totalRequired += requirements.length;

    for (const req of requirements) {
      const key = `${dateStr}:${req.gameMode}`;
      if (existingSet.has(key)) {
        totalPopulated++;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const totalMissing = totalRequired - totalPopulated;
  const coverage =
    totalRequired > 0 ? Math.round((totalPopulated / totalRequired) * 100) : 0;

  return { totalRequired, totalPopulated, totalMissing, coverage };
}

// ============================================================================
// DAY NAME HELPERS
// ============================================================================

const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const DAY_SHORT_NAMES: Record<DayOfWeek, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export function getDayName(day: DayOfWeek): string {
  return DAY_NAMES[day];
}

export function getDayShortName(day: DayOfWeek): string {
  return DAY_SHORT_NAMES[day];
}

/**
 * Get a human-readable description of when a game mode runs.
 *
 * @example
 * getScheduleDescription('career_path') // "Daily"
 * getScheduleDescription('top_tens') // "Mon, Thu"
 * getScheduleDescription('topical_quiz') // "Tue (Premium), Fri"
 */
export function getScheduleDescription(gameMode: GameMode): string {
  const slots = WEEKLY_SCHEDULE.filter((s) => s.gameMode === gameMode);

  if (slots.length === 0) {
    return "Not scheduled";
  }

  // Check if it's daily (any slot with empty days array)
  if (slots.some((s) => s.days.length === 0)) {
    const slot = slots.find((s) => s.days.length === 0)!;
    return slot.isPremium ? "Daily (Premium)" : "Daily";
  }

  // Build description for specific days
  const parts: string[] = [];
  for (const slot of slots) {
    const dayNames = slot.days.map((d) => DAY_SHORT_NAMES[d]).join(", ");
    parts.push(slot.isPremium ? `${dayNames} (Premium)` : dayNames);
  }

  return parts.join(", ");
}
