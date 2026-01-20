"use client";

import { useState, useCallback } from "react";
import { addMonths, subMonths, startOfMonth } from "date-fns";
import { useMonthPuzzles } from "@/hooks/use-puzzles";
import { useCalendarData } from "@/hooks/use-calendar-data";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { MonthHeader } from "@/components/calendar/month-header";
import { Legend } from "@/components/calendar/legend";
import { StatsBar } from "@/components/calendar/stats-bar";
import { QuickViewSheet } from "@/components/puzzle/quick-view-sheet";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { puzzles, isLoading, error } = useMonthPuzzles(currentMonth);
  const calendarData = useCalendarData(puzzles, currentMonth);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(startOfMonth(new Date()));
    setSelectedDate(null);
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedDate(null);
  }, []);

  // Find selected day data
  const selectedDay = selectedDate
    ? calendarData.weeks
        .flatMap((w) => w.days)
        .find((d) => d.date === selectedDate) || null
    : null;

  // Filter puzzles for selected date
  const selectedDatePuzzles = selectedDate
    ? puzzles.filter((p) => p.puzzle_date === selectedDate)
    : [];

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-card mb-2">Failed to load puzzles</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month header with navigation */}
      <MonthHeader
        month={currentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Stats bar */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <StatsBar stats={calendarData.stats} />
      )}

      {/* Main content area */}
      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="glass-card p-4">
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <CalendarGrid
              weeks={calendarData.weeks}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>

        {/* Legend sidebar */}
        <div className="w-72 shrink-0">
          <Legend />
        </div>
      </div>

      {/* Quick view sheet */}
      <QuickViewSheet
        isOpen={!!selectedDate}
        onClose={handleCloseSheet}
        day={selectedDay}
        puzzles={selectedDatePuzzles}
        isLoading={isLoading}
      />
    </div>
  );
}
