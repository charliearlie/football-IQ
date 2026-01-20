"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";

interface GameModeDotProps {
  mode: GameMode;
  hasContent: boolean;
  status?: string | null;
  className?: string;
}

export function GameModeDot({ mode, hasContent, status, className }: GameModeDotProps) {
  const displayName = GAME_MODE_DISPLAY_NAMES[mode];

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
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <span className="font-medium">{displayName}</span>
        <span className="ml-2 text-muted-foreground">
          {hasContent ? (status === "draft" ? "Draft" : "Live") : "Empty"}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
