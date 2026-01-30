"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";
import { Star, AlertTriangle } from "lucide-react";

interface GameModeDotProps {
  mode: GameMode;
  hasContent: boolean;
  status?: string | null;
  isBonus?: boolean;
  /** Whether this mode is required by the weekly schedule for this day */
  isScheduled?: boolean;
  /** Whether this is extra content (not in schedule, or marked as bonus) */
  isExtra?: boolean;
  /** Whether there are pending user reports for this puzzle */
  hasPendingReport?: boolean;
  /** Number of pending reports (for tooltip) */
  pendingReportCount?: number;
  className?: string;
}

export function GameModeDot({
  mode,
  hasContent,
  status,
  isBonus,

  isExtra,
  hasPendingReport,
  pendingReportCount,
  className,
}: GameModeDotProps) {
  const displayName = GAME_MODE_DISPLAY_NAMES[mode];

  // Determine if this dot should show gold ring (extra or bonus content)
  const showGoldRing = isExtra || isBonus;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <div
            className={cn(
              "status-dot cursor-pointer transition-transform hover:scale-125",
              hasContent
                ? status === "draft"
                  ? "status-dot-draft"
                  : "status-dot-success"
                : "status-dot-empty",
              // Gold ring for extra/bonus content
              showGoldRing &&
                "ring-1 ring-card-yellow ring-offset-1 ring-offset-stadium-navy",
              className
            )}
          />
          {/* Report indicator badge */}
          {hasPendingReport && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-card rounded-full flex items-center justify-center animate-pulse">
              <span className="sr-only">Has pending reports</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="flex items-center gap-1">
          <span className="font-medium">{displayName}</span>
          {isBonus && <Star className="h-3 w-3 text-card-yellow" />}
          {isExtra && !isBonus && (
            <span className="text-[10px] text-card-yellow">(Extra)</span>
          )}
          {hasPendingReport && (
            <AlertTriangle className="h-3 w-3 text-red-card" />
          )}
        </div>
        <span className="text-muted-foreground">
          {hasContent
            ? status === "draft"
              ? "Draft"
              : "Live"
            : "Mandatory Gap"}
        </span>
        {hasPendingReport && (
          <span className="block text-[10px] text-red-card mt-0.5">
            {pendingReportCount === 1
              ? "1 pending report"
              : `${pendingReportCount || ""}${pendingReportCount ? " " : ""}pending reports`}
          </span>
        )}
        {isBonus && (
          <span className="block text-[10px] text-card-yellow mt-0.5">
            Bonus content (not counted)
          </span>
        )}
        {isExtra && !isBonus && (
          <span className="block text-[10px] text-card-yellow mt-0.5">
            Extra content (outside schedule)
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
