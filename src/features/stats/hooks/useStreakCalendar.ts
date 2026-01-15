/**
 * Streak Calendar Hook
 *
 * Fetches and aggregates puzzle attempt data to display a calendar view
 * of daily completions. Groups data by month with streak calculations.
 *
 * Automatically refreshes when app comes to foreground.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  getCalendarAttempts,
  CalendarAttemptRow,
  getAllCatalogEntries,
  LocalCatalogEntry,
} from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { asMetadataObject, getMetadataNumber } from '@/types/gameMetadata';
import {
  CalendarData,
  CalendarMonth,
  CalendarDay,
  GameModeCompletion,
  UseStreakCalendarResult,
} from '../types/calendar.types';

/**
 * Get local date string in YYYY-MM-DD format.
 * Uses local timezone (not UTC) to avoid DST/timezone issues.
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Group catalog entries by date.
 */
function groupCatalogByDate(
  catalog: LocalCatalogEntry[]
): Map<string, LocalCatalogEntry[]> {
  const byDate = new Map<string, LocalCatalogEntry[]>();

  for (const entry of catalog) {
    const existing = byDate.get(entry.puzzle_date) ?? [];
    existing.push(entry);
    byDate.set(entry.puzzle_date, existing);
  }

  return byDate;
}

/**
 * Format month name from year and month number.
 * Returns "January 2026" format.
 */
function formatMonthName(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Extract IQ/points from attempt metadata.
 * Different game modes store score differently.
 */
function extractIQFromMetadata(metadata: string | null, gameMode: string): number {
  if (!metadata) return 0;

  try {
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    const data = asMetadataObject(parsed);
    if (!data) return 0;

    // Career Path, Transfer Guess, Tic Tac Toe, The Grid, Topical Quiz use 'points'
    const points = getMetadataNumber(data, 'points');
    if (points > 0) return points;

    // Goalscorer Recall uses 'percentage'
    const percentage = getMetadataNumber(data, 'percentage');
    if (percentage > 0) return Math.round(percentage);

    // Top Tens also uses 'points'
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Group raw attempts by date.
 */
function groupAttemptsByDate(
  attempts: CalendarAttemptRow[]
): Map<string, CalendarAttemptRow[]> {
  const byDate = new Map<string, CalendarAttemptRow[]>();

  for (const attempt of attempts) {
    const existing = byDate.get(attempt.puzzle_date) ?? [];
    existing.push(attempt);
    byDate.set(attempt.puzzle_date, existing);
  }

  return byDate;
}

/**
 * Create CalendarDay from catalog and attempts on a specific date.
 * Uses catalog to know which games were available (dynamic per day).
 */
function createCalendarDay(
  date: string,
  availableGames: LocalCatalogEntry[],
  attempts: CalendarAttemptRow[]
): CalendarDay {
  // Create gameModes from catalog entries (only games that exist for this date)
  const gameModes: GameModeCompletion[] = availableGames.map((catalogEntry) => {
    const mode = catalogEntry.game_mode as GameMode;
    const modeAttempt = attempts.find((a) => a.game_mode === mode);
    const iqEarned = modeAttempt
      ? extractIQFromMetadata(modeAttempt.metadata, mode)
      : 0;

    return {
      gameMode: mode,
      completed: !!modeAttempt,
      iqEarned,
    };
  });

  const totalIQ = gameModes.reduce((sum, gm) => sum + gm.iqEarned, 0);
  const completedCount = gameModes.filter((gm) => gm.completed).length;

  return {
    date,
    count: completedCount,
    totalIQ,
    gameModes,
  };
}

/**
 * Calculate longest streak within a single month.
 * Looks at consecutive days with completions.
 */
function calculateMonthStreak(days: CalendarDay[], year: number, month: number): number {
  if (days.length === 0) return 0;

  // Get all days in this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dateSet = new Set(days.map((d) => d.date));

  let currentStreak = 0;
  let maxStreak = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (dateSet.has(dateStr)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Find perfect weeks in a month.
 * A perfect week is Mon-Sun where all 7 days have at least one completion.
 * Returns array of week indices (0-based).
 */
function findPerfectWeeks(days: CalendarDay[], year: number, month: number): number[] {
  const perfectWeeks: number[] = [];
  const dateSet = new Set(days.map((d) => d.date));

  // Get the first day of the month
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Find all Mondays in this month
  let weekIndex = 0;
  let currentDay = new Date(firstDay);

  // Move to first Monday (could be in previous month)
  const dayOfWeek = currentDay.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;

  if (daysUntilMonday > 0) {
    currentDay.setDate(currentDay.getDate() + daysUntilMonday);
  }

  // Check each week starting from Monday
  while (currentDay.getMonth() === month - 1) {
    let allDaysCompleted = true;

    // Check Mon-Sun (7 days)
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentDay);
      checkDate.setDate(currentDay.getDate() + i);

      // Only count days that are in this month
      if (checkDate.getMonth() !== month - 1) {
        allDaysCompleted = false;
        break;
      }

      const dateStr = getLocalDateString(checkDate);
      if (!dateSet.has(dateStr)) {
        allDaysCompleted = false;
        break;
      }
    }

    if (allDaysCompleted) {
      perfectWeeks.push(weekIndex);
    }

    // Move to next Monday
    currentDay.setDate(currentDay.getDate() + 7);
    weekIndex++;
  }

  return perfectWeeks;
}

/**
 * Calculate overall longest streak across all attempts.
 */
function calculateOverallStreak(byDate: Map<string, CalendarAttemptRow[]>): number {
  if (byDate.size === 0) return 0;

  // Sort dates
  const sortedDates = Array.from(byDate.keys()).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    // Check if consecutive days (accounting for timezone)
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Aggregate catalog and attempts into calendar months.
 * Uses catalog as source of truth for available games per day.
 */
function aggregateCalendarData(
  catalog: LocalCatalogEntry[],
  attempts: CalendarAttemptRow[]
): CalendarData {
  // Group catalog and attempts by date
  const catalogByDate = groupCatalogByDate(catalog);
  const attemptsByDate = groupAttemptsByDate(attempts);

  if (catalogByDate.size === 0) {
    return {
      months: [],
      overallLongestStreak: 0,
      overallTotalIQ: 0,
    };
  }

  // Create calendar days for ALL dates with catalog entries
  const calendarDays: CalendarDay[] = [];
  for (const [date, availableGames] of catalogByDate) {
    const dateAttempts = attemptsByDate.get(date) ?? [];
    calendarDays.push(createCalendarDay(date, availableGames, dateAttempts));
  }

  // Group by month
  const byMonth = new Map<string, CalendarDay[]>();
  for (const day of calendarDays) {
    const monthKey = day.date.slice(0, 7); // "YYYY-MM"
    const existing = byMonth.get(monthKey) ?? [];
    existing.push(day);
    byMonth.set(monthKey, existing);
  }

  // Build month objects
  const months: CalendarMonth[] = [];
  for (const [monthKey, days] of byMonth) {
    const [year, month] = monthKey.split('-').map(Number);
    const sortedDays = days.sort((a, b) => a.date.localeCompare(b.date));

    months.push({
      monthKey,
      monthName: formatMonthName(year, month),
      year,
      month,
      days: sortedDays,
      longestStreak: calculateMonthStreak(sortedDays, year, month),
      totalIQ: sortedDays.reduce((sum, d) => sum + d.totalIQ, 0),
      perfectWeeks: findPerfectWeeks(sortedDays, year, month),
    });
  }

  // Sort months by recency (newest first)
  months.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Calculate overall stats
  const overallLongestStreak = calculateOverallStreak(attemptsByDate);
  const overallTotalIQ = calendarDays.reduce((sum, d) => sum + d.totalIQ, 0);

  return {
    months,
    overallLongestStreak,
    overallTotalIQ,
  };
}

/**
 * Hook to fetch and provide calendar data for the Streak Calendar.
 *
 * @example
 * ```tsx
 * function StreakCalendar() {
 *   const { data, isLoading, refresh } = useStreakCalendar();
 *
 *   if (isLoading) return <CalendarSkeleton />;
 *
 *   return (
 *     <View>
 *       {data?.months.map(month => (
 *         <MonthGrid key={month.monthKey} month={month} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useStreakCalendar(): UseStreakCalendarResult {
  const [data, setData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastLoadTime = useRef<number>(0);

  const loadData = useCallback(async () => {
    try {
      // Fetch catalog (available games) and attempts (completions) in parallel
      const [catalog, attempts] = await Promise.all([
        getAllCatalogEntries(),
        getCalendarAttempts(),
      ]);

      // Aggregate into calendar structure using catalog as source of truth
      const calendarData = aggregateCalendarData(catalog, attempts);

      setData(calendarData);
      setError(null);
      lastLoadTime.current = Date.now();
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load calendar'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadData();
  }, [loadData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh on app foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Debounce: only refresh if more than 2 seconds since last load
        const timeSinceLastLoad = Date.now() - lastLoadTime.current;
        if (timeSinceLastLoad > 2000) {
          refresh();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
