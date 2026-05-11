"use client";

import { useState, type ComponentType } from "react";
import { GamePageShell } from "./GamePageShell";
import { PlayedTodayGate } from "./PlayedTodayGate";
import { getGameEntry } from "@/lib/play/registry";
import type { GameProps, GameResult } from "@/lib/play/types";

interface DailyPuzzleClientProps {
  /** URL slug, e.g. "career-path". Must match a key in GAME_REGISTRY. */
  mode: string;
  /** Today's puzzle content from Supabase, or null if no live puzzle exists. */
  content: unknown;
  /** ISO date string (YYYY-MM-DD) for the puzzle being played. */
  puzzleDate: string;
}

export function DailyPuzzleClient({
  mode,
  content,
  puzzleDate,
}: DailyPuzzleClientProps) {
  const [result, setResult] = useState<GameResult | null>(null);
  const entry = getGameEntry(mode);

  if (!entry) {
    return null;
  }

  // The registry is a discriminated union; once we have a slug match we know
  // the component matches the fallback's content type. The cast reflects this.
  const Game = entry.component as ComponentType<GameProps<unknown>>;
  const puzzleContent = content ?? entry.fallbackContent;

  return (
    <GamePageShell title={entry.title} gameSlug={mode} result={result}>
      <PlayedTodayGate gameSlug={mode}>
        <Game
          content={puzzleContent}
          puzzleDate={puzzleDate}
          onComplete={setResult}
        />
      </PlayedTodayGate>
    </GamePageShell>
  );
}
