"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import type { GuessFeedback, FeedbackColor } from "@/lib/whos-that/types";
import { cn } from "@/lib/utils";

const CELL_BG: Record<FeedbackColor, string> = {
  green: "bg-pitch-green",
  yellow: "bg-card-yellow",
  red: "bg-red-card",
};

const CELL_TEXT: Record<FeedbackColor, string> = {
  green: "text-stadium-navy",
  yellow: "text-stadium-navy",
  red: "text-floodlight",
};

const ATTRIBUTE_LABELS = ["Club", "League", "Nat.", "Pos.", "Born"] as const;

interface GuessRowProps {
  guess: GuessFeedback;
}

export function GuessRow({ guess }: GuessRowProps) {
  const attributes = [
    guess.club,
    guess.league,
    guess.nationality,
    guess.position,
    guess.birthYear,
  ];

  return (
    <div className="mb-1.5">
      <p className="text-floodlight text-[13px] font-medium mb-1 px-0.5 truncate">
        {guess.playerName}
      </p>
      <div className="flex gap-1">
        {attributes.map((attr, index) => (
          <div
            key={ATTRIBUTE_LABELS[index]}
            className={cn(
              "flex-1 rounded-md py-1.5 px-1 flex flex-col items-center justify-center min-h-[44px]",
              CELL_BG[attr.color]
            )}
          >
            <span
              className={cn(
                "text-[9px] uppercase tracking-wider opacity-70 leading-none",
                CELL_TEXT[attr.color]
              )}
            >
              {ATTRIBUTE_LABELS[index]}
            </span>
            <div className="flex items-center gap-0.5 mt-1">
              <span
                className={cn(
                  "text-[11px] font-medium text-center leading-tight",
                  CELL_TEXT[attr.color]
                )}
              >
                {attr.value}
              </span>
              {attr.direction === "up" && (
                <ArrowUp size={10} strokeWidth={2.5} className={CELL_TEXT[attr.color]} />
              )}
              {attr.direction === "down" && (
                <ArrowDown size={10} strokeWidth={2.5} className={CELL_TEXT[attr.color]} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
