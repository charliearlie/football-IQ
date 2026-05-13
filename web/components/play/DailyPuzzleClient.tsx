"use client";

import { useState, type ComponentType } from "react";
import { GamePageShell } from "./GamePageShell";
import { PlayedTodayGate } from "./PlayedTodayGate";
import { Paywall } from "@/components/billing/PaywallModal";
import { usePremium } from "@/lib/billing/usePremium";
import { getGameEntry } from "@/lib/play/registry";
import { PREMIUM_MODES } from "@/lib/constants";
import type { GameProps, GameResult } from "@/lib/play/types";

interface DailyPuzzleClientProps {
  /** URL slug, e.g. "career-path". Must match a key in GAME_REGISTRY. */
  mode: string;
  /** Today's puzzle content from Supabase, or null if no live puzzle exists. */
  content: unknown;
  /** ISO date string (YYYY-MM-DD) for the puzzle being played. */
  puzzleDate: string;
  /** Whether this specific puzzle is flagged premium in Supabase. */
  puzzleIsPremium?: boolean;
}

export function DailyPuzzleClient({
  mode,
  content,
  puzzleDate,
  puzzleIsPremium = false,
}: DailyPuzzleClientProps) {
  const [result, setResult] = useState<GameResult | null>(null);
  const premium = usePremium();
  const entry = getGameEntry(mode);

  if (!entry) {
    return null;
  }

  const modeIsPremium = (PREMIUM_MODES as readonly string[]).includes(
    entry.dbMode,
  );
  const requiresPremium = modeIsPremium || puzzleIsPremium;
  const showPaywall = requiresPremium && premium.ready && !premium.isPremium;

  if (showPaywall) {
    return (
      <GamePageShell title={entry.title} gameSlug={mode} result={null}>
        <Paywall
          source={`game_${mode}`}
          redirectPath={`/play/${mode}`}
          headline={`${entry.title} is a Football IQ Pro game`}
          subheadline="Subscribe to unlock the full archive, Career Path Pro, and ad-free play across web and mobile."
        />
      </GamePageShell>
    );
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
