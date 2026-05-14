/**
 * Server-side fetcher for archived live puzzles in a given game mode.
 *
 * Pulls every live puzzle with a populated `puzzle_date` up to and including
 * today, ordered newest first. Future-dated scheduled puzzles are excluded —
 * the archive is past + present, not a content schedule preview.
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
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = (await supabase
    .from("daily_puzzles")
    .select("puzzle_date, is_premium")
    .eq("game_mode", gameMode)
    .eq("status", "live")
    .not("puzzle_date", "is", null)
    .lte("puzzle_date", today)
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
