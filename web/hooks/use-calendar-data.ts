"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isBefore,
  addDays,
  parseISO,
} from "date-fns";
import type { DailyPuzzle } from "@/types/supabase";
import { GAME_MODES, type GameMode } from "@/lib/constants";
import {
  getRequirementsForDate,
  type ScheduleRequirement,
} from "@/lib/scheduler";

export interface GameModeStatus {
  mode: GameMode;
  hasContent: boolean;
  puzzleId?: string;
  status?: string | null;
  difficulty?: string | null;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  gameModes: GameModeStatus[];
  totalPopulated: number;
  totalMissing: number;
  // Schedule-aware fields
  requiredModes: ScheduleRequirement[];
  requiredCount: number;
  populatedRequired: number;
  missingRequired: number;
  hasAllRequired: boolean;
  /** True if this day is in the next 14 days and has missing required puzzles */
  isUpcomingGap: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarData {
  weeks: CalendarWeek[];
  month: Date;
  stats: {
    totalDays: number;
    fullyPopulatedDays: number;
    partiallyPopulatedDays: number;
    emptyDays: number;
    upcomingGaps: number; // Days in next 7 days with missing content
    // Schedule-aware stats
    totalRequiredSlots: number;
    populatedRequiredSlots: number;
    missingRequiredSlots: number;
    scheduleCoverage: number; // 0-100 percentage
  };
}

export function useCalendarData(puzzles: DailyPuzzle[], month: Date): CalendarData {
  return useMemo(() => {
    // Create a map of puzzles by date and game_mode for O(1) lookup
    // Filter out backlog puzzles (null puzzle_date)
    const puzzleMap = new Map<string, Map<string, DailyPuzzle>>();

    for (const puzzle of puzzles) {
      if (puzzle.puzzle_date === null) continue;
      if (!puzzleMap.has(puzzle.puzzle_date)) {
        puzzleMap.set(puzzle.puzzle_date, new Map());
      }
      puzzleMap.get(puzzle.puzzle_date)!.set(puzzle.game_mode, puzzle);
    }

    // Generate calendar grid (including days from adjacent months to fill weeks)
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);
    const fourteenDaysFromNow = addDays(today, 14);

    // Build calendar days
    const calendarDays: CalendarDay[] = days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const puzzlesForDay = puzzleMap.get(dateStr);

      const gameModes: GameModeStatus[] = GAME_MODES.map((mode) => {
        const puzzle = puzzlesForDay?.get(mode);
        return {
          mode,
          hasContent: !!puzzle,
          puzzleId: puzzle?.id,
          status: puzzle?.status,
          difficulty: puzzle?.difficulty,
        };
      });

      const totalPopulated = gameModes.filter((gm) => gm.hasContent).length;
      const totalMissing = GAME_MODES.length - totalPopulated;

      // Schedule-aware calculations
      const requiredModes = getRequirementsForDate(day);
      const requiredCount = requiredModes.length;
      const populatedRequired = requiredModes.filter((req) =>
        gameModes.find((gm) => gm.mode === req.gameMode && gm.hasContent)
      ).length;
      const missingRequired = requiredCount - populatedRequired;
      const hasAllRequired = missingRequired === 0;

      // Check if this is an upcoming gap (in next 14 days with missing required puzzles)
      const isUpcomingGap =
        !isBefore(day, today) &&
        isBefore(day, fourteenDaysFromNow) &&
        missingRequired > 0;

      return {
        date: dateStr,
        dayNumber: day.getDate(),
        isCurrentMonth: isSameMonth(day, month),
        isToday: isToday(day),
        isPast: isBefore(day, today) && !isToday(day),
        isFuture: !isBefore(day, today) && !isToday(day),
        gameModes,
        totalPopulated,
        totalMissing,
        requiredModes,
        requiredCount,
        populatedRequired,
        missingRequired,
        hasAllRequired,
        isUpcomingGap,
      };
    });

    // Group into weeks
    const weeks: CalendarWeek[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push({
        days: calendarDays.slice(i, i + 7),
      });
    }

    // Calculate stats for current month only
    const currentMonthDays = calendarDays.filter((d) => d.isCurrentMonth);

    // Schedule-aware stats
    const totalRequiredSlots = currentMonthDays.reduce(
      (sum, d) => sum + d.requiredCount,
      0
    );
    const populatedRequiredSlots = currentMonthDays.reduce(
      (sum, d) => sum + d.populatedRequired,
      0
    );
    const missingRequiredSlots = totalRequiredSlots - populatedRequiredSlots;
    const scheduleCoverage =
      totalRequiredSlots > 0
        ? Math.round((populatedRequiredSlots / totalRequiredSlots) * 100)
        : 0;

    const stats = {
      totalDays: currentMonthDays.length,
      fullyPopulatedDays: currentMonthDays.filter(
        (d) => d.totalPopulated === GAME_MODES.length
      ).length,
      partiallyPopulatedDays: currentMonthDays.filter(
        (d) => d.totalPopulated > 0 && d.totalPopulated < GAME_MODES.length
      ).length,
      emptyDays: currentMonthDays.filter((d) => d.totalPopulated === 0).length,
      upcomingGaps: calendarDays.filter((d) => {
        const dayDate = parseISO(d.date);
        return (
          !isBefore(dayDate, today) &&
          isBefore(dayDate, sevenDaysFromNow) &&
          d.missingRequired > 0
        );
      }).length,
      totalRequiredSlots,
      populatedRequiredSlots,
      missingRequiredSlots,
      scheduleCoverage,
    };

    return { weeks, month, stats };
  }, [puzzles, month]);
}
