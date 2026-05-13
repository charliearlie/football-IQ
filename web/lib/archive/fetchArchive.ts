/**
 * Server-side fetcher for archived live puzzles in a given game mode.
 *
 * Pulls every live puzzle with a populated `puzzle_date`, ordered newest
 * first. The list is intentionally complete — pagination on the page is
 * unnecessary for ~100 entries and the orchestrator's gating handles whether
 * each entry is playable.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface ArchivePuzzleEntry {
  puzzleDate: string;
  isPremium: boolean;
}

export async function fetchArchivePuzzles(
  gameMode: string,
): Promise<ArchivePuzzleEntry[]> {
  const supabase = await createAdminClient();

  const { data, error } = (await supabase
    .from("daily_puzzles")
    .select("puzzle_date, is_premium")
    .eq("game_mode", gameMode)
    .eq("status", "live")
    .not("puzzle_date", "is", null)
    .order("puzzle_date", { ascending: false })) as {
    data: Array<{ puzzle_date: string | null; is_premium: boolean | null }> | null;
    error: unknown;
  };

  if (error || !data) return [];

  return data
    .filter((row): row is { puzzle_date: string; is_premium: boolean | null } =>
      Boolean(row.puzzle_date),
    )
    .map((row) => ({
      puzzleDate: row.puzzle_date,
      isPremium: row.is_premium ?? false,
    }));
}
