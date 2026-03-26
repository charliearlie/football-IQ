import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type HealthStatus = "critical" | "warning" | "ok";

/**
 * GET /api/content-health
 *
 * Returns forward content health for every game mode:
 * how many days of live puzzles are scheduled from today onwards.
 */
export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("game_mode, puzzle_date")
    .eq("status", "live")
    .gte("puzzle_date", today)
    .order("puzzle_date", { ascending: true });

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  const modeMap = new Map<string, string[]>();
  for (const row of data ?? []) {
    const dates = modeMap.get(row.game_mode) ?? [];
    if (row.puzzle_date) dates.push(row.puzzle_date);
    modeMap.set(row.game_mode, dates);
  }

  const modes = GAME_MODES.map((mode) => {
    const dates = modeMap.get(mode) ?? [];
    const days_coverage = dates.length;
    const status: HealthStatus =
      days_coverage < 3 ? "critical" : days_coverage < 7 ? "warning" : "ok";

    return {
      game_mode: mode,
      display_name: GAME_MODE_DISPLAY_NAMES[mode],
      days_coverage,
      live_puzzles: dates.length,
      status,
      last_puzzle_date: dates.length > 0 ? dates[dates.length - 1] : null,
    };
  });

  const statusOrder: Record<HealthStatus, number> = { critical: 0, warning: 1, ok: 2 };
  modes.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  const overallStatus: HealthStatus = modes.some((m) => m.status === "critical")
    ? "critical"
    : modes.some((m) => m.status === "warning")
      ? "warning"
      : "ok";

  return Response.json({
    success: true,
    overall_status: overallStatus,
    modes,
  });
}
