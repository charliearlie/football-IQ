"use client";

import { cn } from "@/lib/utils";
import type { WhoAmIClue } from "@/lib/schemas/puzzle-schemas";

interface ClueCardProps {
  clue: WhoAmIClue;
  isLatest: boolean;
}

export function ClueCard({ clue, isLatest }: ClueCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isLatest
          ? "bg-pitch-green/[0.08] border-pitch-green/30"
          : "bg-white/[0.03] border-white/[0.08]"
      )}
      data-testid={`clue-${clue.number}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
            isLatest
              ? "bg-pitch-green text-deep-night"
              : "bg-white/10 text-white/70"
          )}
        >
          {clue.number}
        </span>
        <p className="text-sm leading-relaxed text-white/90">{clue.text}</p>
      </div>
    </div>
  );
}
