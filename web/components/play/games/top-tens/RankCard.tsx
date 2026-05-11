"use client";

import { CheckCircle2 } from "lucide-react";
import type { RankSlotState } from "@/lib/top-tens/types";
import { cn } from "@/lib/utils";

interface RankCardProps {
  slot: RankSlotState;
}

export function RankCard({ slot }: RankCardProps) {
  const isFound = slot.found;
  const isRevealed = slot.found || slot.autoRevealed;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors",
        isFound
          ? "bg-pitch-green/10 border-pitch-green/40"
          : slot.autoRevealed
          ? "bg-white/[0.03] border-white/10 opacity-70"
          : "bg-white/[0.04] border-white/10"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-sm",
          isFound
            ? "bg-pitch-green text-stadium-navy"
            : "bg-white/10 text-floodlight/60"
        )}
      >
        {slot.rank}
      </div>
      <div className="min-w-0 flex-1">
        {isRevealed && slot.answer ? (
          <>
            <p className="text-floodlight font-medium text-sm truncate">
              {slot.answer.name}
              {slot.answer.alternates && slot.answer.alternates.length > 0 && (
                <span className="text-slate-400 text-xs ml-1">
                  + {slot.answer.alternates.length} more
                </span>
              )}
            </p>
            {slot.answer.info && (
              <p className="text-slate-400 text-xs truncate">{slot.answer.info}</p>
            )}
          </>
        ) : (
          <p className="text-slate-500 text-sm">?</p>
        )}
      </div>
      {isFound && (
        <CheckCircle2 className="size-4 shrink-0 text-pitch-green" aria-hidden="true" />
      )}
    </div>
  );
}
