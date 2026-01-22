"use client";

import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Wand2,
  Archive,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MonthHeaderProps {
  month: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onInitializeWeek?: () => void;
  onToggleBacklog?: () => void;
  onCreateAdhoc?: () => void;
  backlogCount?: number;
  isInitializing?: boolean;
}

export function MonthHeader({
  month,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onInitializeWeek,
  onToggleBacklog,
  onCreateAdhoc,
  backlogCount = 0,
  isInitializing = false,
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
        {/* Create Ad-hoc button */}
        {onCreateAdhoc && (
          <Button
            variant="default"
            size="sm"
            onClick={onCreateAdhoc}
            className="text-xs bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create Puzzle
          </Button>
        )}

        {/* Backlog button */}
        {onToggleBacklog && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleBacklog}
            className="text-xs"
          >
            <Archive className="h-3 w-3 mr-1" />
            Backlog
            {backlogCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-5 px-1.5 text-[10px] bg-card-yellow/20 text-card-yellow"
              >
                {backlogCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Initialize Week button */}
        {onInitializeWeek && (
          <Button
            variant="outline"
            size="sm"
            onClick={onInitializeWeek}
            disabled={isInitializing}
            className="text-xs border-card-yellow/50 text-card-yellow hover:bg-card-yellow/10 hover:text-card-yellow"
          >
            <Wand2 className="h-3 w-3 mr-1" />
            {isInitializing ? "Initializing..." : "Initialize Week"}
          </Button>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

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
