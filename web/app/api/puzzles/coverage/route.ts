import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/puzzles/coverage?date=2026-03-15
 *
 * Returns puzzle coverage for every game mode on a given date.
 * Defaults to today if no date is provided.
 */
export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { success: false, error: "date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  const { data: puzzles, error } = await supabase
    .from("daily_puzzles")
    .select("id, game_mode, status, difficulty, source")
    .eq("puzzle_date", date);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  const puzzlesByMode = new Map(
    puzzles.map((p) => [p.game_mode, p])
  );

  const modes = GAME_MODES.map((mode) => {
    const puzzle = puzzlesByMode.get(mode);
    return {
      game_mode: mode,
      display_name: GAME_MODE_DISPLAY_NAMES[mode],
      has_puzzle: !!puzzle,
      ...(puzzle && {
        id: puzzle.id,
        status: puzzle.status,
        difficulty: puzzle.difficulty,
        source: puzzle.source,
      }),
    };
  });

  const total = GAME_MODES.length;
  const filled = modes.filter((m) => m.has_puzzle).length;
  const live = modes.filter((m) => m.has_puzzle && m.status === "live").length;
  const missing = modes.filter((m) => !m.has_puzzle).map((m) => m.game_mode);

  return Response.json({
    success: true,
    date,
    summary: { total, filled, live, missing },
    modes,
  });
}
