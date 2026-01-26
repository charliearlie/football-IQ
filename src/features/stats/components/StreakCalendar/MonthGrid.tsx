/**
 * MonthGrid Component
 *
 * Renders a 7-column calendar grid for a specific month.
 * Shows day labels (Mon-Sun), handles month start padding,
 * and indicates perfect weeks with a special visual.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, fonts, spacing } from '@/theme';
import { CalendarMonth, CalendarDay, CellPosition } from '../../types/calendar.types';
import { LAUNCH_DATE } from '../../hooks/useStreakCalendar';
import { MonthHeader } from './MonthHeader';
import { DayCell } from './DayCell';

export interface MonthGridProps {
  /** Month data with days */
  month: CalendarMonth;
  /** Whether this is the current month */
  isCurrentMonth: boolean;
  /** Callback when a day cell is pressed */
  onDayPress: (day: CalendarDay, position: CellPosition) => void;
  /** Whether to show the internal month header (default: true) */
  showHeader?: boolean;
  /** Test ID for testing */
  testID?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const GRID_GAP = 4;
const MIN_CELL_SIZE = 40;

/**
 * Get local date string in YYYY-MM-DD format.
 * Uses local timezone (not UTC) for accurate "today" comparison.
 */
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Grid cell data for rendering.
 * Contains either a day with data, a day number only (no data), or null (padding).
 */
interface GridCell {
  /** Day number (1-31) or null for padding */
  dayNumber: number | null;
  /** Calendar day data if available */
  day: CalendarDay | null;
  /** Whether this cell is in a perfect week */
  isInPerfectWeek: boolean;
  /** Whether this date is in the future (not yet playable) */
  isFutureDate: boolean;
  /** Whether this date is before the app launch (Jan 20, 2026) */
  isPreLaunchDate: boolean;
}

/**
 * Build the full grid of cells for a month.
 * Handles start-of-month padding and maps day data.
 */
function buildMonthGrid(month: CalendarMonth): GridCell[] {
  const { year, month: monthNum, days, perfectWeeks } = month;
  const cells: GridCell[] = [];

  // Get first day of month (0 = Sunday, convert to Mon = 0)
  const firstDay = new Date(year, monthNum - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon = 0, Sun = 6

  // Get number of days in month
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Create a map of date -> CalendarDay for quick lookup
  const dayMap = new Map<string, CalendarDay>();
  for (const day of days) {
    dayMap.set(day.date, day);
  }

  // Add leading padding cells
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ dayNumber: null, day: null, isInPerfectWeek: false, isFutureDate: false, isPreLaunchDate: false });
  }

  // Get today's date string for comparison (local timezone)
  const today = getLocalDateString();

  // Add day cells
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    // Check if this date is in the future
    const isFutureDate = dateStr > today;

    // Check if this date is before the app launch
    const isPreLaunchDate = dateStr < LAUNCH_DATE;

    // Get data from map, or create empty CalendarDay for past/today dates only
    // Future dates and pre-launch dates should not be clickable
    const existingData = dayMap.get(dateStr);
    const dayData = existingData ?? (isFutureDate || isPreLaunchDate ? null : {
      date: dateStr,
      count: 0,
      totalIQ: 0,
      gameModes: [],
    });

    // Calculate which week this day is in (for perfect week check)
    const cellIndex = cells.length;
    const weekIndex = Math.floor(cellIndex / 7);
    const isInPerfectWeek = perfectWeeks.includes(weekIndex);

    cells.push({
      dayNumber: dayNum,
      day: dayData,
      isInPerfectWeek,
      isFutureDate,
      isPreLaunchDate,
    });
  }

  // Add trailing padding cells to complete the last row
  const remainder = cells.length % 7;
  if (remainder > 0) {
    const padding = 7 - remainder;
    for (let i = 0; i < padding; i++) {
      cells.push({ dayNumber: null, day: null, isInPerfectWeek: false, isFutureDate: false, isPreLaunchDate: false });
    }
  }

  return cells;
}

/**
 * Check if a date is today (local timezone).
 */
function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getLocalDateString();
}

/**
 * MonthGrid - Calendar grid for a single month.
 *
 * Features:
 * - 7-column layout (Mon-Sun)
 * - Automatic padding for month start
 * - Perfect week visual indicators
 * - Today highlighting
 */
export function MonthGrid({
  month,
  isCurrentMonth,
  onDayPress,
  showHeader = true,
  testID,
}: MonthGridProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Calculate cell size based on available width
  // Account for screen padding and gaps between cells
  const availableWidth = windowWidth - spacing.xl * 2; // Screen padding
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.floor((availableWidth - GRID_GAP * 6) / 7)
  );

  // Build grid cells
  const gridCells = useMemo(() => buildMonthGrid(month), [month]);

  // Split cells into weeks for row-based rendering with perfect week indicators
  const weeks = useMemo(() => {
    const result: GridCell[][] = [];
    for (let i = 0; i < gridCells.length; i += 7) {
      result.push(gridCells.slice(i, i + 7));
    }
    return result;
  }, [gridCells]);

  // Check if a week is perfect (all 7 days have completions)
  const isWeekPerfect = (weekCells: GridCell[]): boolean => {
    // All non-padding cells must have completions
    const actualDays = weekCells.filter((c) => c.dayNumber !== null);
    if (actualDays.length < 7) return false; // Incomplete week
    return actualDays.every((c) => c.day && c.day.count > 0);
  };

  return (
    <View style={styles.container} testID={testID}>
      {showHeader && (
        <MonthHeader
          monthName={month.monthName}
          longestStreak={month.longestStreak}
          totalIQ={month.totalIQ}
          isCurrentMonth={isCurrentMonth}
        />
      )}

      {/* Day labels */}
      <View style={[styles.dayLabelsRow, { gap: GRID_GAP }]}>
        {DAY_LABELS.map((label) => (
          <View
            key={label}
            style={[styles.dayLabelCell, { width: cellSize }]}
          >
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid by weeks */}
      {weeks.map((weekCells, weekIndex) => {
        const isPerfect = isWeekPerfect(weekCells);

        return (
          <View
            key={weekIndex}
            style={[
              styles.weekRow,
              { gap: GRID_GAP },
              isPerfect && styles.perfectWeekRow,
            ]}
          >
            {weekCells.map((cell, cellIndex) => {
              const globalIndex = weekIndex * 7 + cellIndex;
              const dateStr = cell.day?.date ?? null;

              return (
                <DayCell
                  key={globalIndex}
                  day={cell.day}
                  dayNumber={cell.dayNumber}
                  size={cellSize}
                  isInPerfectWeek={cell.isInPerfectWeek}
                  isToday={isToday(dateStr)}
                  isFutureDate={cell.isFutureDate}
                  isPreLaunchDate={cell.isPreLaunchDate}
                  onPress={onDayPress}
                  testID={`day-cell-${globalIndex}`}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayLabelCell: {
    alignItems: 'center',
  },
  dayLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: GRID_GAP,
  },
  perfectWeekRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.cardYellow,
    paddingLeft: spacing.xs,
    marginLeft: -spacing.xs - 3,
    borderRadius: 2,
  },
});
