"use client";

import { useCallback, useRef } from "react";
import { usePostHog } from "posthog-js/react";

export function useGameTracking(gameMode: string, puzzleDate?: string) {
  const posthog = usePostHog();
  const startedAtRef = useRef<number | null>(null);
  const hasTrackedStart = useRef(false);

  const trackGameStarted = useCallback(() => {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    startedAtRef.current = Date.now();
    try {
      posthog?.capture("game_started", {
        game_mode: gameMode,
        puzzle_date: puzzleDate,
        is_archive: false,
        platform: "web",
      });
    } catch {}
  }, [posthog, gameMode, puzzleDate]);

  const trackGameCompleted = useCallback(
    (result: "won" | "lost", score?: string) => {
      const timeSpent = startedAtRef.current
        ? Math.round((Date.now() - startedAtRef.current) / 1000)
        : null;
      try {
        posthog?.capture("game_completed", {
          game_mode: gameMode,
          result,
          time_spent_seconds: timeSpent,
          puzzle_date: puzzleDate,
          score,
          platform: "web",
        });
      } catch {}
    },
    [posthog, gameMode, puzzleDate]
  );

  const trackShareCompleted = useCallback(() => {
    try {
      posthog?.capture("share_completed", {
        game_mode: gameMode,
        method: "clipboard",
        platform: "web",
      });
    } catch {}
  }, [posthog, gameMode]);

  return { trackGameStarted, trackGameCompleted, trackShareCompleted };
}
