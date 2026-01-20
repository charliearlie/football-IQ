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
} from "date-fns";
import type { DailyPuzzle } from "@/types/supabase";
import { GAME_MODES, type GameMode } from "@/lib/constants";

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
  };
}

export function useCalendarData(puzzles: DailyPuzzle[], month: Date): CalendarData {
  return useMemo(() => {
    // Create a map of puzzles by date and game_mode for O(1) lookup
    const puzzleMap = new Map<string, Map<string, DailyPuzzle>>();

    for (const puzzle of puzzles) {
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
        const dayDate = new Date(d.date);
        return (
          !isBefore(dayDate, today) &&
          isBefore(dayDate, sevenDaysFromNow) &&
          d.totalMissing > 0
        );
      }).length,
    };

    return { weeks, month, stats };
  }, [puzzles, month]);
}
