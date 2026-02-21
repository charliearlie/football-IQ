"use server";

import { createAdminClient, ensureAdmin } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/(dashboard)/admin/actions";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";

export type HealthStatus = "critical" | "warning" | "ok";

export interface GameModeHealth {
  game_mode: GameMode;
  display_name: string;
  days_coverage: number;
  live_puzzles: number;
  status: HealthStatus;
  last_puzzle_date: string | null;
}

export interface ContentHealthData {
  modes: GameModeHealth[];
  overallStatus: HealthStatus;
}

export async function fetchContentHealth(): Promise<
  ActionResult<ContentHealthData>
> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_puzzles")
      .select("game_mode, puzzle_date")
      .eq("status", "live")
      .gte("puzzle_date", today)
      .order("puzzle_date", { ascending: true });

    if (error) return { success: false, error: error.message };

    // Group by game_mode
    const modeMap = new Map<string, string[]>();
    for (const row of data ?? []) {
      const dates = modeMap.get(row.game_mode) ?? [];
      if (row.puzzle_date) dates.push(row.puzzle_date);
      modeMap.set(row.game_mode, dates);
    }

    // Build result for ALL game modes (including those with 0 coverage)
    const modes: GameModeHealth[] = GAME_MODES.map((mode) => {
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

    // Sort: critical first, then warning, then ok
    const statusOrder: Record<HealthStatus, number> = {
      critical: 0,
      warning: 1,
      ok: 2,
    };
    modes.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const overallStatus: HealthStatus = modes.some(
      (m) => m.status === "critical"
    )
      ? "critical"
      : modes.some((m) => m.status === "warning")
        ? "warning"
        : "ok";

    return { success: true, data: { modes, overallStatus } };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch content health",
    };
  }
}
