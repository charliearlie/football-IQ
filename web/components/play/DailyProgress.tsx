"use client";

import { useEffect, useState } from "react";
import { WEB_PLAYABLE_GAMES } from "@/lib/constants";
import { hasPlayedToday } from "@/lib/playSession";

export interface DailyProgressProps {
  /**
   * Slugs of games that have a live puzzle today. The bar + counter only
   * include these — there's no point promising "0/12" when only 4 modes
   * have puzzles scheduled.
   */
  activeSlugs: string[];
}

const SLUG_TO_TITLE = new Map(
  WEB_PLAYABLE_GAMES.map((game) => [game.slug, game.title] as const),
);

export function DailyProgress({ activeSlugs }: DailyProgressProps) {
  const [played, setPlayed] = useState<boolean[]>(() =>
    activeSlugs.map(() => false),
  );

  useEffect(() => {
    setPlayed(activeSlugs.map((slug) => hasPlayedToday(slug)));
  }, [activeSlugs]);

  if (activeSlugs.length === 0) return null;

  const playedCount = played.filter(Boolean).length;
  const total = activeSlugs.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {activeSlugs.map((slug, i) => (
          <div
            key={slug}
            className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
              played[i] ? "bg-pitch-green" : "bg-white/20"
            }`}
            title={SLUG_TO_TITLE.get(slug) ?? slug}
          />
        ))}
      </div>

      <span className="text-xs text-slate-400 tabular-nums">
        {playedCount}/{total} played
      </span>
    </div>
  );
}
