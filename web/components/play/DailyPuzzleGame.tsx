import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { WEB_PLAYABLE_GAMES } from "@/lib/constants";
import { DailyPuzzleClient } from "./DailyPuzzleClient";

interface DailyPuzzleGameProps {
  /** URL slug, e.g. "career-path". */
  mode: string;
  /** Optional override date (YYYY-MM-DD); defaults to today. */
  date?: string;
}

/**
 * Server component that fetches today's puzzle for the given mode and hands it
 * to the client orchestrator. Per-page SEO wrappers render this; the rest of
 * the page (Metadata, JsonLd, HowToPlay) stays in the page file.
 *
 * Uses WEB_PLAYABLE_GAMES (a regular module) for the slug → dbMode lookup
 * rather than the client-only GAME_REGISTRY — Next.js Server Components
 * cannot reliably read object properties from "use client" exports.
 */
export async function DailyPuzzleGame({ mode, date }: DailyPuzzleGameProps) {
  const game = WEB_PLAYABLE_GAMES.find((g) => g.slug === mode);
  if (!game) {
    return null;
  }

  const puzzle = await fetchDailyPuzzle(game.dbMode, date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];

  return (
    <DailyPuzzleClient
      mode={mode}
      content={puzzle?.content ?? null}
      puzzleDate={puzzleDate}
      puzzleIsPremium={puzzle?.is_premium ?? false}
    />
  );
}
