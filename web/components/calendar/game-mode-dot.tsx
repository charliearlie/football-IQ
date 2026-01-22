"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";
import { Star } from "lucide-react";

interface GameModeDotProps {
  mode: GameMode;
  hasContent: boolean;
  status?: string | null;
  isBonus?: boolean;
  /** Whether this mode is required by the weekly schedule for this day */
  isScheduled?: boolean;
  /** Whether this is extra content (not in schedule, or marked as bonus) */
  isExtra?: boolean;
  className?: string;
}

export function GameModeDot({
  mode,
  hasContent,
  status,
  isBonus,
  isScheduled,
  isExtra,
  className,
}: GameModeDotProps) {
  const displayName = GAME_MODE_DISPLAY_NAMES[mode];

  // Determine if this dot should show gold ring (extra or bonus content)
  const showGoldRing = isExtra || isBonus;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="flex items-center gap-1">
          <span className="font-medium">{displayName}</span>
          {isBonus && <Star className="h-3 w-3 text-card-yellow" />}
          {isExtra && !isBonus && (
            <span className="text-[10px] text-card-yellow">(Extra)</span>
          )}
        </div>
        <span className="text-muted-foreground">
          {hasContent
            ? status === "draft"
              ? "Draft"
              : "Live"
            : "Mandatory Gap"}
        </span>
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
