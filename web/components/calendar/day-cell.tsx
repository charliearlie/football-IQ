"use client";

import { cn } from "@/lib/utils";
import { GameModeDot } from "./game-mode-dot";
import type { CalendarDay } from "@/hooks/use-calendar-data";
import type { GameMode } from "@/lib/constants";

interface DayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  onSelect: (date: string) => void;
}

export function DayCell({ day, isSelected, onSelect }: DayCellProps) {
  const handleClick = () => {
    if (day.isCurrentMonth) {
      onSelect(day.date);
    }
  };

  // Progress indicator text (e.g., "4/5")
  const progressText = `${day.populatedRequired}/${day.requiredCount}`;
  const hasRequiredContent = day.requiredCount > 0;

  return (
    <button
      onClick={handleClick}
      disabled={!day.isCurrentMonth}
      className={cn(
        "relative min-h-[80px] p-2 text-left border transition-all",
        // Base border
        "border-white/5",
        // Upcoming gap warning (yellow border for days in next 14 days with missing required)
        day.isUpcomingGap && "border-card-yellow ring-1 ring-card-yellow/50",
        day.isCurrentMonth
          ? "hover:bg-white/5 cursor-pointer"
          : "opacity-30 cursor-default",
        day.isToday && "bg-pitch-green/10 border-pitch-green/30",
        isSelected && "ring-2 ring-pitch-green bg-pitch-green/5",
        !day.isCurrentMonth && "bg-white/[0.02]"
      )}
    >
      {/* Day number and progress indicator */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={cn(
            "text-sm font-medium",
            day.isToday && "text-pitch-green font-bold",
            !day.isCurrentMonth && "text-muted-foreground"
          )}
        >
          {day.dayNumber}
        </span>
        {/* Progress indicator */}
        {day.isCurrentMonth && hasRequiredContent && (
          <span
            className={cn(
              "text-[10px] font-mono tabular-nums",
              day.hasAllRequired
                ? "text-pitch-green"
                : day.isUpcomingGap
                  ? "text-card-yellow"
                  : "text-muted-foreground"
            )}
          >
            {progressText}
          </span>
        )}
      </div>

      {/* Game mode dots - 2x4 grid */}
      {day.isCurrentMonth && (
        <div className="grid grid-cols-4 gap-1">
          {day.gameModes.map((gm) => (
            <GameModeDot
              key={gm.mode}
              mode={gm.mode as GameMode}
              hasContent={gm.hasContent}
              status={gm.status}
            />
          ))}
        </div>
      )}

      {/* Status indicator for fully populated days (all 8 modes) */}
      {day.isCurrentMonth && day.totalPopulated === 8 && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-pitch-green animate-pulse" />
        </div>
      )}
    </button>
  );
}
