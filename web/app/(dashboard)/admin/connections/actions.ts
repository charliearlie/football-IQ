"use server";

import { createAdminClient, ensureAdminWrite } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(dashboard)/admin/actions";
import type { Json } from "@/types/supabase";

interface ConnectionsGroup {
  category: string;
  difficulty: "yellow" | "green" | "blue" | "purple";
  players: string[];
}

interface CreateConnectionsPuzzleInput {
  puzzleDate: string;
  status: "draft" | "live";
  groups: ConnectionsGroup[];
}

export async function createConnectionsPuzzle(
  input: CreateConnectionsPuzzleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await ensureAdminWrite();
    const supabase = await createAdminClient();

    const { puzzleDate, status, groups } = input;

    // Validate: exactly 4 groups
    if (groups.length !== 4) {
      return { success: false, error: "Exactly 4 groups are required" };
    }

    // Validate each group
    const difficulties = new Set<string>();
    const allPlayers = new Set<string>();

    for (const group of groups) {
      if (!group.category.trim()) {
        return { success: false, error: "Each group must have a non-empty category" };
      }

      const validDifficulties = ["yellow", "green", "blue", "purple"];
      if (!validDifficulties.includes(group.difficulty)) {
        return { success: false, error: `Invalid difficulty: ${group.difficulty}` };
      }

      if (difficulties.has(group.difficulty)) {
        return { success: false, error: `Duplicate difficulty: ${group.difficulty}` };
      }
      difficulties.add(group.difficulty);

      if (group.players.length !== 4) {
        return {
          success: false,
          error: `Group "${group.category}" must have exactly 4 players`,
        };
      }

      for (const player of group.players) {
        if (!player.trim()) {
          return {
            success: false,
            error: `Group "${group.category}" has an empty player name`,
          };
        }
        const normalized = player.trim().toLowerCase();
        if (allPlayers.has(normalized)) {
          return {
            success: false,
            error: `Duplicate player name: "${player.trim()}"`,
          };
        }
        allPlayers.add(normalized);
      }
    }

    // Validate one group per difficulty
    if (difficulties.size !== 4) {
      return {
        success: false,
        error: "Must have exactly one group per difficulty level (yellow, green, blue, purple)",
      };
    }

    // Insert into daily_puzzles
    const { data, error } = await supabase
      .from("daily_puzzles")
      .insert({
        puzzle_date: puzzleDate,
        game_mode: "connections",
        status,
        content: { groups } as unknown as Json,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/connections");
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create puzzle",
    };
  }
}

interface ConnectionsPuzzleRow {
  id: string;
  puzzle_date: string | null;
  status: string | null;
  content: Record<string, unknown>;
}

export async function fetchConnectionsPuzzles(
  page: number,
  pageSize: number
): Promise<ActionResult<{ puzzles: ConnectionsPuzzleRow[]; totalCount: number }>> {
  try {
    const supabase = await createAdminClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, status, content", { count: "exact" })
      .eq("game_mode", "connections")
      .order("puzzle_date", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        puzzles: (data ?? []) as ConnectionsPuzzleRow[],
        totalCount: count ?? 0,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch puzzles",
    };
  }
}
