import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { GAME_MODES } from "@/lib/constants";
import type { GameMode } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/puzzles/next-available?game_mode=career_path&from=2026-03-17
 *
 * Returns the first date without a puzzle for the given game mode,
 * searching up to 365 days from the start date.
 */
export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const gameMode = searchParams.get("game_mode");
  const fromParam = searchParams.get("from");

  if (!gameMode) {
    return Response.json(
      { success: false, error: "game_mode is required" },
      { status: 400 }
    );
  }

  if (!GAME_MODES.includes(gameMode as GameMode)) {
    return Response.json(
      { success: false, error: `Invalid game_mode "${gameMode}". Valid modes: ${GAME_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  // Default to tomorrow UTC
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const defaultFrom = tomorrow.toISOString().split("T")[0];
  const from = fromParam ?? defaultFrom;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    return Response.json(
      { success: false, error: "from must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const startDate = new Date(from + "T00:00:00Z");
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 365);
  const endDateStr = endDate.toISOString().split("T")[0];

  const supabase = await createAdminClient();

  const { data: puzzles, error } = await supabase
    .from("daily_puzzles")
    .select("puzzle_date")
    .eq("game_mode", gameMode)
    .gte("puzzle_date", from)
    .lte("puzzle_date", endDateStr);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  const occupied = new Set(puzzles.map((p) => p.puzzle_date));

  // Walk day-by-day to find first gap
  const cursor = new Date(startDate);
  let daysAhead = 0;

  while (daysAhead <= 365) {
    const dateStr = cursor.toISOString().split("T")[0];
    if (!occupied.has(dateStr)) {
      return Response.json({
        success: true,
        game_mode: gameMode,
        next_available_date: dateStr,
        searched_from: from,
        days_ahead: daysAhead,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    daysAhead++;
  }

  return Response.json({
    success: true,
    game_mode: gameMode,
    next_available_date: null,
    searched_from: from,
    days_ahead: null,
  });
}
