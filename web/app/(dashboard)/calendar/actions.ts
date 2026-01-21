"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { GameMode, PuzzleStatus } from "@/lib/constants";
import { validateContent } from "@/lib/schemas";
import type { TablesInsert, TablesUpdate, Json } from "@/types/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePuzzleInput {
  puzzle_date: string;
  game_mode: GameMode;
  content: unknown;
  status: PuzzleStatus;
  difficulty?: string | null;
  source?: string | null;
}

export interface UpdatePuzzleInput {
  content?: unknown;
  status?: PuzzleStatus;
  difficulty?: string | null;
  source?: string | null;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// CREATE PUZZLE
// ============================================================================

export async function createPuzzle(
  input: CreatePuzzleInput
): Promise<ActionResult> {
  try {
    // Validate content against the schema for this game mode
    const validation = validateContent(input.game_mode, input.content);

    if (!validation.success) {
      const errors = validation.error.flatten();
      return {
        success: false,
        error: `Validation failed: ${JSON.stringify(errors.fieldErrors)}`,
      };
    }

    // Get admin client (bypasses RLS)
    const supabase = await createAdminClient();

    // Check if puzzle already exists for this date and mode
    const { data: existing } = await supabase
      .from("daily_puzzles")
      .select("id")
      .eq("puzzle_date", input.puzzle_date)
      .eq("game_mode", input.game_mode)
      .single();

    if (existing) {
      return {
        success: false,
        error: "A puzzle already exists for this date and game mode. Use update instead.",
      };
    }

    // Insert the puzzle
    const insertData: TablesInsert<"daily_puzzles"> = {
      puzzle_date: input.puzzle_date,
      game_mode: input.game_mode,
      content: validation.data as Json,
      status: input.status,
      difficulty: input.difficulty || null,
      source: input.source || "cms",
      triggered_by: "manual",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("daily_puzzles")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    // Revalidate the calendar page
    revalidatePath("/dashboard/calendar");

    return { success: true, data };
  } catch (err) {
    console.error("Create puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// UPDATE PUZZLE
// ============================================================================

export async function updatePuzzle(
  id: string,
  gameMode: GameMode,
  input: UpdatePuzzleInput
): Promise<ActionResult> {
  try {
    // Validate content if provided
    if (input.content !== undefined) {
      const validation = validateContent(gameMode, input.content);

      if (!validation.success) {
        const errors = validation.error.flatten();
        return {
          success: false,
          error: `Validation failed: ${JSON.stringify(errors.fieldErrors)}`,
        };
      }

      input.content = validation.data;
    }

    const supabase = await createAdminClient();

    const updateData: TablesUpdate<"daily_puzzles"> = {
      ...(input.content !== undefined && { content: input.content as Json }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.source !== undefined && { source: input.source }),
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("daily_puzzles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true, data };
  } catch (err) {
    console.error("Update puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// DELETE PUZZLE
// ============================================================================

export async function deletePuzzle(id: string): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("daily_puzzles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (err) {
    console.error("Delete puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// COPY FROM PREVIOUS DAY
// ============================================================================

export async function copyFromPreviousDay(
  sourceDate: string,
  gameMode: GameMode
): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    // Fetch source puzzle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: source, error: fetchError } = await (supabase as any)
      .from("daily_puzzles")
      .select("content, difficulty")
      .eq("puzzle_date", sourceDate)
      .eq("game_mode", gameMode)
      .single();

    if (fetchError || !source) {
      return {
        success: false,
        error: `No ${gameMode} puzzle found for ${sourceDate}`,
      };
    }

    // Return the content for the form to use
    return {
      success: true,
      data: {
        content: (source as { content: unknown; difficulty: string | null }).content,
        difficulty: (source as { content: unknown; difficulty: string | null }).difficulty,
      },
    };
  } catch (err) {
    console.error("Copy puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// UPSERT PUZZLE (CREATE OR UPDATE)
// ============================================================================

export async function upsertPuzzle(
  input: CreatePuzzleInput
): Promise<ActionResult> {
  try {
    // Validate content
    const validation = validateContent(input.game_mode, input.content);

    if (!validation.success) {
      const errors = validation.error.flatten();
      return {
        success: false,
        error: `Validation failed: ${JSON.stringify(errors.fieldErrors)}`,
      };
    }

    const supabase = await createAdminClient();

    // Check if puzzle exists
    const { data: existing } = await supabase
      .from("daily_puzzles")
      .select("id")
      .eq("puzzle_date", input.puzzle_date)
      .eq("game_mode", input.game_mode)
      .single();

    let result;

    if (existing) {
      // Update existing
      const updateData: TablesUpdate<"daily_puzzles"> = {
        content: validation.data as Json,
        status: input.status,
        difficulty: input.difficulty || null,
        source: input.source || "cms",
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (supabase as any)
        .from("daily_puzzles")
        .update(updateData)
        .eq("id", (existing as { id: string }).id)
        .select()
        .single();
    } else {
      // Insert new
      const insertData: TablesInsert<"daily_puzzles"> = {
        puzzle_date: input.puzzle_date,
        game_mode: input.game_mode,
        content: validation.data as Json,
        status: input.status,
        difficulty: input.difficulty || null,
        source: input.source || "cms",
        triggered_by: "manual",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (supabase as any)
        .from("daily_puzzles")
        .insert(insertData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Supabase upsert error:", result.error);
      return { success: false, error: result.error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true, data: result.data };
  } catch (err) {
    console.error("Upsert puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
