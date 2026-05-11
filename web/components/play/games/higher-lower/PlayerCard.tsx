// web/components/play/games/higher-lower/PlayerCard.tsx
"use client";

import type { HigherLowerEntry } from "@/lib/higher-lower/types";
import { formatStatValue } from "@/lib/higher-lower/formatStatValue";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  entry: HigherLowerEntry;
  /** When false, the stat value is hidden behind a "?" placeholder. */
  revealed: boolean;
  /** Visual highlight after the user has answered: "correct" (green) | "wrong" (red) | undefined (neutral). */
  resultHighlight?: "correct" | "wrong";
}

export function PlayerCard({ entry, revealed, resultHighlight }: PlayerCardProps) {
  const ringClass =
    resultHighlight === "correct"
      ? "ring-2 ring-pitch-green"
      : resultHighlight === "wrong"
      ? "ring-2 ring-red-card"
      : "ring-1 ring-white/10";

  return (
    <div
      className={cn(
        "rounded-lg bg-white/[0.04] px-4 py-5 text-center",
        ringClass
      )}
    >
      <p className="text-floodlight font-semibold text-base mb-1 line-clamp-2">
        {entry.name}
      </p>
      <p className="text-slate-400 text-xs mb-3 line-clamp-1">{entry.context}</p>
      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
        {entry.statLabel}
      </p>
      <p
        className={cn(
          "font-bold text-2xl",
          revealed ? "text-pitch-green" : "text-slate-600"
        )}
      >
        {revealed ? formatStatValue(entry.value, entry.statType) : "?"}
      </p>
    </div>
  );
}
