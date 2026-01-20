"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthHeaderProps {
  month: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function MonthHeader({
  month,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: MonthHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-floodlight">
          {format(month, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="text-xs"
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          Today
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
