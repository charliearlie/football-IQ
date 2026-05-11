"use client";

import type { GuessFeedback } from "@/lib/whos-that/types";
import { GuessRow } from "./GuessRow";
import { cn } from "@/lib/utils";

const MAX_GUESSES = 6;
const EMPTY_CELL_LABELS = ["Club", "League", "Nat.", "Pos.", "Born"] as const;

interface GridProps {
  guesses: GuessFeedback[];
}

export function Grid({ guesses }: GridProps) {
  const filledCount = guesses.length;
  const emptyCount = MAX_GUESSES - filledCount;

  return (
    <div className="space-y-1.5">
      {guesses.map((guess, index) => (
        <GuessRow key={`guess-${index}`} guess={guess} />
      ))}
      {Array.from({ length: emptyCount }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="flex gap-1 mb-1.5"
          aria-hidden="true"
        >
          {EMPTY_CELL_LABELS.map((label) => (
            <div
              key={label}
              className={cn(
                "flex-1 h-[44px] rounded-md border",
                index === 0
                  ? "bg-pitch-green/[0.08] border-pitch-green/25 animate-pulse"
                  : "bg-white/[0.03] border-white/[0.06]"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
