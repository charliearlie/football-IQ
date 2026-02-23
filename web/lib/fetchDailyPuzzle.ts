/**
 * Shared server-side puzzle fetcher for all /play game pages.
 *
 * Fetches a single daily puzzle from Supabase by game mode and date.
 * Used as a server-side utility — not a client component.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface DailyPuzzle {
  content: unknown;
  puzzle_date: string;
}

/**
 * Fetch today's puzzle for a given game mode.
 *
 * @param gameMode - Database game_mode value (e.g. 'career_path', 'connections')
 * @param date - Optional YYYY-MM-DD date string (defaults to today)
 * @returns Puzzle data or null if no live puzzle exists
 */
export async function fetchDailyPuzzle(
  gameMode: string,
  date?: string
): Promise<DailyPuzzle | null> {
  const supabase = await createAdminClient();
  const puzzleDate = date ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("content, puzzle_date")
    .eq("game_mode", gameMode)
    .eq("puzzle_date", puzzleDate)
    .eq("status", "live")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    content: data.content,
    puzzle_date: data.puzzle_date ?? puzzleDate,
  };
}

/**
 * Fetch the next scheduled live puzzle date after today for a game mode.
 *
 * Used to show "check back on {date}" when no puzzle exists today.
 */
export async function fetchNextPuzzleDate(
  gameMode: string
): Promise<string | null> {
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_puzzles")
    .select("puzzle_date")
    .eq("game_mode", gameMode)
    .eq("status", "live")
    .gt("puzzle_date", today)
    .order("puzzle_date", { ascending: true })
    .limit(1)
    .single();

  return data?.puzzle_date ?? null;
}
