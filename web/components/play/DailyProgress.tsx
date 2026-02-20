"use client";

import { useEffect, useState } from "react";
import { WEB_PLAYABLE_GAMES } from "@/lib/constants";
import { hasPlayedToday } from "@/lib/playSession";

export function DailyProgress() {
  const [played, setPlayed] = useState<boolean[]>([]);

  useEffect(() => {
    // Read play state on the client after hydration
    const states = WEB_PLAYABLE_GAMES.map((game) =>
      hasPlayedToday(game.slug)
    );
    setPlayed(states);
  }, []);

  const playedCount = played.filter(Boolean).length;
  const total = WEB_PLAYABLE_GAMES.length;

  return (
    <div className="flex items-center gap-2">
      {/* Segment bars */}
      <div className="flex gap-1">
        {WEB_PLAYABLE_GAMES.map((game, i) => (
          <div
            key={game.slug}
            className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
              played[i] ? "bg-pitch-green" : "bg-white/20"
            }`}
            title={game.title}
          />
        ))}
      </div>

      {/* Count label */}
      <span className="text-xs text-slate-400 tabular-nums">
        {playedCount}/{total} played
      </span>
    </div>
  );
}
