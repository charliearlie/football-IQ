"use server";

import { createAdminClient, ensureAdmin } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/(dashboard)/admin/actions";
import type { SupabaseClient } from "@supabase/supabase-js";

// The new analytics RPCs aren't in the generated types yet.
// Cast to untyped client for RPC calls.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = SupabaseClient<any, any, any>;

// ============================================================================
// Types
// ============================================================================

export interface FunnelData {
  registered: number;
  everPlayed: number;
  active7d: number;
  premium: number;
}

export type UserCohort =
  | "all"
  | "never_played"
  | "active"
  | "lapsed"
  | "churned";

export interface UserRow {
  id: string;
  display_name: string | null;
  created_at: string | null;
  is_premium: boolean;
  total_iq: number;
  total_attempts: number;
  last_active: string | null;
}

export interface UserListResult {
  rows: UserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface UserAttemptDetail {
  id: string;
  puzzle_id: string | null;
  game_mode: string | null;
  score: number | null;
  score_display: string | null;
  completed: boolean | null;
  completed_at: string | null;
}

export interface UserDetailData {
  profile: {
    id: string;
    display_name: string | null;
    created_at: string | null;
    is_premium: boolean;
    premium_purchased_at: string | null;
    total_iq: number;
  };
  attempts: UserAttemptDetail[];
  hasPushToken: boolean;
  streaks: Array<{
    game_mode: string;
    current_streak: number;
    longest_streak: number;
    last_played_date: string | null;
  }>;
}

// ============================================================================
// Funnel Data
// ============================================================================

export async function fetchFunnelData(): Promise<ActionResult<FunnelData>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    const rpc = supabase as UntypedClient;
    const [registeredRes, everPlayedRes, active7dRes, premiumRes] =
      await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        rpc.rpc("count_distinct_users_played"),
        rpc.rpc("count_active_users_7d"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_premium", true),
      ]);

    return {
      success: true,
      data: {
        registered: registeredRes.count ?? 0,
        everPlayed: Number(everPlayedRes.data) || 0,
        active7d: Number(active7dRes.data) || 0,
        premium: premiumRes.count ?? 0,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch funnel data",
    };
  }
}

// ============================================================================
// User List
// ============================================================================

export async function fetchUserList(input: {
  page: number;
  pageSize: number;
  cohort: UserCohort;
  search?: string;
}): Promise<ActionResult<UserListResult>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    const rpc = supabase as UntypedClient;
    const { data, error } = await rpc.rpc("get_user_list", {
      p_cohort: input.cohort,
      p_search: input.search || null,
      p_limit: input.pageSize,
      p_offset: (input.page - 1) * input.pageSize,
    });

    if (error) return { success: false, error: error.message };

    const result = data as { rows: UserRow[]; total_count: number };

    return {
      success: true,
      data: {
        rows: result.rows ?? [],
        totalCount: result.total_count ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch users",
    };
  }
}

// ============================================================================
// User Detail
// ============================================================================

export async function fetchUserDetail(
  userId: string
): Promise<ActionResult<UserDetailData>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    const [profileRes, attemptsRes, pushTokenRes, streaksRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("puzzle_attempts")
          .select(
            "id, puzzle_id, score, score_display, completed, completed_at"
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(100),
        supabase
          .from("push_tokens")
          .select("id")
          .eq("user_id", userId)
          .limit(1),
        supabase
          .from("user_streaks")
          .select(
            "game_mode, current_streak, longest_streak, last_played_date"
          )
          .eq("user_id", userId),
      ]);

    if (profileRes.error)
      return { success: false, error: profileRes.error.message };

    // Resolve game_mode from daily_puzzles for each attempt
    const puzzleIds = (attemptsRes.data ?? [])
      .map((a) => a.puzzle_id)
      .filter(Boolean) as string[];

    const gameModeMap = new Map<string, string>();
    if (puzzleIds.length > 0) {
      const { data: puzzles } = await supabase
        .from("daily_puzzles")
        .select("id, game_mode")
        .in("id", puzzleIds);
      if (puzzles) {
        for (const p of puzzles) {
          gameModeMap.set(p.id, p.game_mode);
        }
      }
    }

    const attempts: UserAttemptDetail[] = (attemptsRes.data ?? []).map((a) => ({
      id: a.id,
      puzzle_id: a.puzzle_id,
      game_mode: a.puzzle_id ? (gameModeMap.get(a.puzzle_id) ?? null) : null,
      score: a.score,
      score_display: a.score_display,
      completed: a.completed,
      completed_at: a.completed_at,
    }));

    return {
      success: true,
      data: {
        profile: {
          id: profileRes.data.id,
          display_name: profileRes.data.display_name,
          created_at: profileRes.data.created_at,
          is_premium: profileRes.data.is_premium ?? false,
          premium_purchased_at:
            (profileRes.data as Record<string, unknown>)
              .premium_purchased_at as string | null,
          total_iq: profileRes.data.total_iq ?? 0,
        },
        attempts,
        hasPushToken: (pushTokenRes.data ?? []).length > 0,
        streaks: (streaksRes.data ?? []).map((s) => ({
          game_mode: s.game_mode,
          current_streak: s.current_streak ?? 0,
          longest_streak: s.longest_streak ?? 0,
          last_played_date: s.last_played_date,
        })),
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch user detail",
    };
  }
}
