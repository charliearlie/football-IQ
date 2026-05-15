"use client";

import { useState, type ComponentType } from "react";
import { GamePageShell } from "./GamePageShell";
import { PlayedTodayGate } from "./PlayedTodayGate";
import { Paywall } from "@/components/billing/PaywallModal";
import { usePremium } from "@/lib/billing/usePremium";
import { isSubscriptionsEnabled } from "@/lib/billing/config";
import { getGameEntry } from "@/lib/play/registry";
import { isWithinFreeWindow } from "@/lib/archive/freeWindow";
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
  const dateIsLocked = !isWithinFreeWindow(puzzleDate);
  const requiresPremium = modeIsPremium || puzzleIsPremium || dateIsLocked;
  // The subscriptions feature flag is the master switch — when off, nothing
  // is ever paywalled regardless of mode/date/premium-flag.
  const showPaywall =
    isSubscriptionsEnabled() &&
    requiresPremium &&
    premium.ready &&
    !premium.isPremium;

  if (showPaywall) {
    const isDateOnlyLock = dateIsLocked && !modeIsPremium && !puzzleIsPremium;
    const headline = isDateOnlyLock
      ? `Unlock this ${entry.title} puzzle`
      : `${entry.title} is a Football IQ Pro game`;
    const subheadline = isDateOnlyLock
      ? "Today plus the last two days are free. Subscribe to replay the full archive."
      : "Subscribe to unlock the full archive, Career Path Pro, and ad-free play across web and mobile.";
    return (
      <GamePageShell title={entry.title} gameSlug={mode} result={null}>
        <Paywall
          source={isDateOnlyLock ? `archive_${mode}` : `game_${mode}`}
          redirectPath={`/play/${mode}${isDateOnlyLock ? `?date=${puzzleDate}` : ""}`}
          headline={headline}
          subheadline={subheadline}
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
