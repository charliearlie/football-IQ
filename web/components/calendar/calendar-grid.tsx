"use client";

import { DayCell } from "./day-cell";
import type { CalendarWeek } from "@/hooks/use-calendar-data";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarGridProps {
  weeks: CalendarWeek[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function CalendarGrid({ weeks, selectedDate, onSelectDate }: CalendarGridProps) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {weeks.map((week) =>
          week.days.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              isSelected={selectedDate === day.date}
              onSelect={onSelectDate}
            />
          ))
        )}
      </div>
    </div>
  );
}
