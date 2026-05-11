import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { GAME_REGISTRY } from "@/lib/play/registry";
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
 */
export async function DailyPuzzleGame({ mode, date }: DailyPuzzleGameProps) {
  const entry = GAME_REGISTRY[mode];
  if (!entry) {
    return null;
  }

  const puzzle = await fetchDailyPuzzle(entry.dbMode, date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];

  return (
    <DailyPuzzleClient
      mode={mode}
      content={puzzle?.content ?? null}
      puzzleDate={puzzleDate}
    />
  );
}
