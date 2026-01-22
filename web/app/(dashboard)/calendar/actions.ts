"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { GameMode, PuzzleStatus } from "@/lib/constants";
import { validateContent } from "@/lib/schemas";
import type { TablesInsert, TablesUpdate, Json, DailyPuzzle } from "@/types/supabase";
import type { CareerScoutResult } from "@/types/ai";
import {
  getRequirementsForDate,
  getMissingPuzzlesForWeek,
  isPremiumOnDate,
} from "@/lib/scheduler";
import {
  findNextAvailableSlot,
  calculateDisplacementChain,
  buildPuzzleMap,
  getOccupiedDates,
  type ConflictInfo,
  type DisplacementMove,
  type AvailableSlot,
} from "@/lib/displacement";
import { parseISO, startOfWeek, addDays, format } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePuzzleInput {
  puzzle_date: string | null;
  game_mode: GameMode;
  content: unknown;
  status: PuzzleStatus;
  difficulty?: string | null;
  source?: string | null;
  is_premium?: boolean;
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

    // For scheduled puzzles, check if one already exists for this date and mode
    // Backlog puzzles (null date) can always be created without duplicate check
    if (input.puzzle_date !== null) {
      const { data: existing } = await supabase
        .from("daily_puzzles")
        .select("id")
        .eq("puzzle_date", input.puzzle_date)
        .eq("game_mode", input.game_mode)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: "A puzzle already exists for this date and game mode. Use update instead.",
        };
      }
    }

    // Insert the puzzle
    const insertData: TablesInsert<"daily_puzzles"> = {
      puzzle_date: input.puzzle_date,
      game_mode: input.game_mode,
      content: validation.data as Json,
      status: input.status,
      difficulty: input.difficulty || null,
      source: input.source || "manual",
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

    // Determine is_premium: use provided value, or derive from schedule if date is provided
    let isPremium = input.is_premium;
    if (isPremium === undefined && input.puzzle_date) {
      isPremium = isPremiumOnDate(input.game_mode, parseISO(input.puzzle_date)) ?? false;
    }

    // For backlog puzzles (null date), always insert new
    // For scheduled puzzles, check if one exists for this date+mode
    let existing: { id: string } | null = null;

    if (input.puzzle_date !== null) {
      const { data, error: lookupError } = await supabase
        .from("daily_puzzles")
        .select("id")
        .eq("puzzle_date", input.puzzle_date)
        .eq("game_mode", input.game_mode)
        .maybeSingle();

      if (lookupError) {
        console.error("Puzzle lookup error:", lookupError);
      }
      existing = data as { id: string } | null;
    }

    console.log("Upsert lookup:", { puzzle_date: input.puzzle_date, game_mode: input.game_mode, existing });

    let result;

    if (existing) {
      // Update existing scheduled puzzle
      const updateData: TablesUpdate<"daily_puzzles"> = {
        content: validation.data as Json,
        status: input.status,
        difficulty: input.difficulty || null,
        source: input.source || "manual",
        is_premium: isPremium,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (supabase as any)
        .from("daily_puzzles")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .maybeSingle();

      if (!result.data && !result.error) {
        result.error = { message: "Update failed - record not found" };
      }
    } else {
      // Insert new puzzle (either scheduled or backlog)
      const insertData: TablesInsert<"daily_puzzles"> = {
        puzzle_date: input.puzzle_date,
        game_mode: input.game_mode,
        content: validation.data as Json,
        status: input.status,
        difficulty: input.difficulty || null,
        source: input.source || "manual",
        is_premium: isPremium ?? false,
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

// ============================================================================
// SCOUT PLAYER CAREER (AI)
// ============================================================================

export async function scoutPlayerCareer(
  wikipediaUrl: string
): Promise<ActionResult<CareerScoutResult>> {
  try {
    // Validate URL format
    if (!wikipediaUrl || !wikipediaUrl.includes("wikipedia.org/wiki/")) {
      return {
        success: false,
        error: "Invalid Wikipedia URL. Must be a Wikipedia article URL (e.g., https://en.wikipedia.org/wiki/Player_Name)",
      };
    }

    // Dynamically import the AI service to keep it server-side only
    const { scoutPlayerCareer: scout } = await import("@/lib/ai/career-scout");
    const result = await scout(wikipediaUrl);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error("Scout player career error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred while scouting player",
    };
  }
}

// ============================================================================
// BACKLOG PUZZLES
// ============================================================================

/**
 * Get all backlog puzzles (puzzles without a scheduled date).
 */
export async function getBacklogPuzzles(): Promise<ActionResult<DailyPuzzle[]>> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("daily_puzzles")
      .select("*")
      .is("puzzle_date", null)
      .order("game_mode", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get backlog puzzles error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DailyPuzzle[] };
  } catch (err) {
    console.error("Get backlog puzzles error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Assign a date to a backlog puzzle.
 * This moves a puzzle from the backlog to a scheduled slot.
 */
export async function assignPuzzleDate(
  puzzleId: string,
  targetDate: string,
  isPremium?: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    // First, get the puzzle to check it's a backlog puzzle
    const { data: puzzle, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("*")
      .eq("id", puzzleId)
      .single();

    if (fetchError || !puzzle) {
      return { success: false, error: "Puzzle not found" };
    }

    if (puzzle.puzzle_date !== null) {
      return { success: false, error: "Puzzle is already scheduled" };
    }

    // Check if target slot is already occupied
    const { data: existing } = await supabase
      .from("daily_puzzles")
      .select("id")
      .eq("puzzle_date", targetDate)
      .eq("game_mode", puzzle.game_mode)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `A ${puzzle.game_mode} puzzle already exists for ${targetDate}`,
      };
    }

    // Determine is_premium from schedule if not provided
    const finalIsPremium =
      isPremium ?? isPremiumOnDate(puzzle.game_mode as GameMode, parseISO(targetDate)) ?? false;

    // Update the puzzle with the new date
    const { data, error } = await supabase
      .from("daily_puzzles")
      .update({
        puzzle_date: targetDate,
        is_premium: finalIsPremium,
        updated_at: new Date().toISOString(),
      })
      .eq("id", puzzleId)
      .select()
      .single();

    if (error) {
      console.error("Assign puzzle date error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true, data };
  } catch (err) {
    console.error("Assign puzzle date error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// INITIALIZE WEEK
// ============================================================================

/**
 * Placeholder content for each game mode when initializing empty slots.
 */
const PLACEHOLDER_CONTENT: Record<GameMode, unknown> = {
  career_path: {
    answer: "",
    career_steps: [
      { type: "club", text: "", year: "", apps: 0, goals: 0 },
      { type: "club", text: "", year: "", apps: 0, goals: 0 },
      { type: "club", text: "", year: "", apps: 0, goals: 0 },
    ],
  },
  career_path_pro: {
    answer: "",
    career_steps: [
      { type: "club", text: "", year: "", apps: 0, goals: 0 },
      { type: "club", text: "", year: "", apps: 0, goals: 0 },
      { type: "club", text: "", year: "", apps: 0, goals: 0 },
    ],
  },
  guess_the_transfer: {
    answer: "",
    from_club: "",
    to_club: "",
    year: 2026,
    fee: "",
    hints: ["", "", ""],
  },
  guess_the_goalscorers: {
    home_team: "",
    away_team: "",
    home_score: 0,
    away_score: 0,
    competition: "",
    match_date: "",
    goals: [],
  },
  topical_quiz: {
    questions: [
      { id: "q1", question: "", options: ["", "", "", ""], correctIndex: 0 },
      { id: "q2", question: "", options: ["", "", "", ""], correctIndex: 0 },
      { id: "q3", question: "", options: ["", "", "", ""], correctIndex: 0 },
      { id: "q4", question: "", options: ["", "", "", ""], correctIndex: 0 },
      { id: "q5", question: "", options: ["", "", "", ""], correctIndex: 0 },
    ],
  },
  top_tens: {
    title: "",
    category: "",
    answers: Array.from({ length: 10 }, () => ({ name: "", aliases: [], info: "" })),
  },
  starting_xi: {
    match_name: "",
    competition: "",
    match_date: "",
    formation: "4-3-3",
    team: "",
    players: [],
  },
  the_grid: {
    xAxis: [
      { type: "club", value: "" },
      { type: "club", value: "" },
      { type: "club", value: "" },
    ],
    yAxis: [
      { type: "nation", value: "" },
      { type: "nation", value: "" },
      { type: "nation", value: "" },
    ],
    valid_answers: {},
  },
};

/**
 * Initialize a week with draft placeholders for all missing required slots.
 *
 * @param weekStartDate - Any date within the target week (will be normalized to Monday)
 * @returns The number of draft puzzles created
 */
export async function initializeWeek(
  weekStartDate: string
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const supabase = await createAdminClient();

    // Get the Monday of the target week
    const monday = startOfWeek(parseISO(weekStartDate), { weekStartsOn: 1 });

    // Fetch existing puzzles for this week
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(format(addDays(monday, i), "yyyy-MM-dd"));
    }

    const { data: existingPuzzles, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("puzzle_date, game_mode")
      .gte("puzzle_date", weekDates[0])
      .lte("puzzle_date", weekDates[6]);

    if (fetchError) {
      console.error("Fetch existing puzzles error:", fetchError);
      return { success: false, error: fetchError.message };
    }

    // Get missing puzzles using the scheduler
    const missing = getMissingPuzzlesForWeek(
      monday,
      (existingPuzzles || []) as { puzzle_date: string | null; game_mode: string }[]
    );

    if (missing.length === 0) {
      return { success: true, data: { created: 0, skipped: 0 } };
    }

    // Create draft placeholders for each missing puzzle
    const inserts: TablesInsert<"daily_puzzles">[] = missing.map((m) => ({
      puzzle_date: m.date,
      game_mode: m.gameMode,
      content: PLACEHOLDER_CONTENT[m.gameMode] as Json,
      status: "draft",
      is_premium: m.isPremium,
      source: "scheduler",
      triggered_by: "initialize_week",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("daily_puzzles")
      .insert(inserts)
      .select();

    if (error) {
      console.error("Initialize week error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/calendar");

    return {
      success: true,
      data: {
        created: data?.length || 0,
        skipped: (existingPuzzles?.length || 0),
      },
    };
  } catch (err) {
    console.error("Initialize week error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// BONUS PUZZLES
// ============================================================================

/**
 * Toggle the is_bonus flag on a puzzle.
 * Bonus puzzles do not count toward daily schedule requirements.
 */
export async function toggleBonusPuzzle(
  puzzleId: string,
  isBonus: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("daily_puzzles")
      .update({
        is_bonus: isBonus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", puzzleId)
      .select()
      .single();

    if (error) {
      console.error("Toggle bonus puzzle error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true, data };
  } catch (err) {
    console.error("Toggle bonus puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Extract a human-readable title from puzzle content.
 */
function getPuzzleTitleFromContent(
  gameMode: string,
  content: unknown
): string {
  const c = content as Record<string, unknown>;

  switch (gameMode) {
    case "career_path":
    case "career_path_pro":
      return (c.answer as string) || "Untitled Career Path";
    case "guess_the_transfer":
      return (c.answer as string) || "Untitled Transfer";
    case "guess_the_goalscorers":
      return `${c.home_team || "?"} vs ${c.away_team || "?"}`;
    case "topical_quiz":
      return "Topical Quiz";
    case "top_tens":
      return (c.title as string) || "Untitled Top Tens";
    case "starting_xi":
      return (c.match_name as string) || "Untitled Starting XI";
    case "the_grid":
      return "The Grid";
    default:
      return "Untitled Puzzle";
  }
}

/**
 * Check if a specific date/mode slot has an existing puzzle (conflict).
 * Returns conflict info if occupied, null if available.
 */
export async function checkSlotConflict(
  gameMode: GameMode,
  targetDate: string,
  excludePuzzleId?: string
): Promise<ActionResult<{ conflict: ConflictInfo | null; nextSlot: AvailableSlot | null }>> {
  try {
    const supabase = await createAdminClient();

    // Check if slot is occupied
    let query = supabase
      .from("daily_puzzles")
      .select("id, content, game_mode, puzzle_date")
      .eq("puzzle_date", targetDate)
      .eq("game_mode", gameMode);

    if (excludePuzzleId) {
      query = query.neq("id", excludePuzzleId);
    }

    const { data: existing, error } = await query.maybeSingle();

    if (error) {
      console.error("Check slot conflict error:", error);
      return { success: false, error: error.message };
    }

    if (!existing) {
      return { success: true, data: { conflict: null, nextSlot: null } };
    }

    // There is a conflict - get all puzzles of this mode to find next available slot
    const { data: allPuzzles, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, game_mode")
      .eq("game_mode", gameMode)
      .not("puzzle_date", "is", null);

    if (fetchError) {
      console.error("Fetch puzzles for slot error:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const occupiedDates = getOccupiedDates(
      (allPuzzles || []) as Array<{ puzzle_date: string | null; game_mode: string }>,
      gameMode
    );

    // Find next available slot
    const nextSlot = findNextAvailableSlot(gameMode, targetDate, occupiedDates);

    const conflict: ConflictInfo = {
      existingPuzzleId: existing.id,
      existingPuzzleTitle: getPuzzleTitleFromContent(existing.game_mode, existing.content),
      gameMode,
      date: targetDate,
    };

    return { success: true, data: { conflict, nextSlot } };
  } catch (err) {
    console.error("Check slot conflict error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// PUZZLE DISPLACEMENT
// ============================================================================

/**
 * Displace a puzzle to a new date, with optional ripple effect.
 * If the target date is occupied, the existing puzzle is moved to the next available slot.
 */
export async function displacePuzzle(
  puzzleId: string,
  newDate: string
): Promise<ActionResult<{ moves: DisplacementMove[] }>> {
  try {
    const supabase = await createAdminClient();

    // Fetch the puzzle to displace
    const { data: puzzle, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("*")
      .eq("id", puzzleId)
      .single();

    if (fetchError || !puzzle) {
      return { success: false, error: "Puzzle not found" };
    }

    const gameMode = puzzle.game_mode as GameMode;

    // Get all puzzles of this mode to build the map
    const { data: allPuzzles, error: allError } = await supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, game_mode, content")
      .eq("game_mode", gameMode)
      .not("puzzle_date", "is", null);

    if (allError) {
      console.error("Fetch all puzzles error:", allError);
      return { success: false, error: allError.message };
    }

    // Build puzzle map
    const puzzleMap = buildPuzzleMap(
      (allPuzzles || []) as Array<{ id: string; puzzle_date: string | null; game_mode: string; content?: unknown }>,
      gameMode,
      (p) => getPuzzleTitleFromContent(p.game_mode, p.content)
    );

    // Calculate displacement chain
    const chain = calculateDisplacementChain(newDate, gameMode, puzzleMap);

    if (!chain.success) {
      return { success: false, error: chain.error };
    }

    // Execute moves in order (the chain is already ordered with deepest first)
    for (const move of chain.moves) {
      const { error: moveError } = await supabase
        .from("daily_puzzles")
        .update({
          puzzle_date: move.toDate,
          is_premium: isPremiumOnDate(gameMode, parseISO(move.toDate)) ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", move.puzzleId);

      if (moveError) {
        console.error("Displacement move error:", moveError);
        return { success: false, error: `Failed to move puzzle: ${moveError.message}` };
      }
    }

    // Now move the original puzzle to its new date
    const { error: finalMoveError } = await supabase
      .from("daily_puzzles")
      .update({
        puzzle_date: newDate,
        is_premium: isPremiumOnDate(gameMode, parseISO(newDate)) ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", puzzleId);

    if (finalMoveError) {
      console.error("Final displacement error:", finalMoveError);
      return { success: false, error: finalMoveError.message };
    }

    revalidatePath("/dashboard/calendar");

    // Include the original move in the result
    const allMoves: DisplacementMove[] = [
      ...chain.moves,
      {
        puzzleId,
        fromDate: puzzle.puzzle_date || "",
        toDate: newDate,
      },
    ];

    return { success: true, data: { moves: allMoves } };
  } catch (err) {
    console.error("Displace puzzle error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Swap dates between two puzzles.
 * Both puzzles must be of the same game mode.
 */
export async function swapPuzzleDates(
  puzzleId1: string,
  puzzleId2: string
): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    // Fetch both puzzles
    const { data: puzzles, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("*")
      .in("id", [puzzleId1, puzzleId2]);

    if (fetchError || !puzzles || puzzles.length !== 2) {
      return { success: false, error: "One or both puzzles not found" };
    }

    const puzzle1 = puzzles.find((p) => p.id === puzzleId1);
    const puzzle2 = puzzles.find((p) => p.id === puzzleId2);

    if (!puzzle1 || !puzzle2) {
      return { success: false, error: "Puzzles not found" };
    }

    if (puzzle1.game_mode !== puzzle2.game_mode) {
      return { success: false, error: "Cannot swap puzzles of different game modes" };
    }

    const gameMode = puzzle1.game_mode as GameMode;
    const date1 = puzzle1.puzzle_date;
    const date2 = puzzle2.puzzle_date;

    // Use a temporary null to avoid unique constraint violation
    // Step 1: Set puzzle1's date to null
    const { error: step1Error } = await supabase
      .from("daily_puzzles")
      .update({ puzzle_date: null, updated_at: new Date().toISOString() })
      .eq("id", puzzleId1);

    if (step1Error) {
      console.error("Swap step 1 error:", step1Error);
      return { success: false, error: step1Error.message };
    }

    // Step 2: Set puzzle2's date to puzzle1's original date
    const { error: step2Error } = await supabase
      .from("daily_puzzles")
      .update({
        puzzle_date: date1,
        is_premium: date1 ? isPremiumOnDate(gameMode, parseISO(date1)) ?? false : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", puzzleId2);

    if (step2Error) {
      // Try to rollback step 1
      await supabase
        .from("daily_puzzles")
        .update({ puzzle_date: date1, updated_at: new Date().toISOString() })
        .eq("id", puzzleId1);
      console.error("Swap step 2 error:", step2Error);
      return { success: false, error: step2Error.message };
    }

    // Step 3: Set puzzle1's date to puzzle2's original date
    const { error: step3Error } = await supabase
      .from("daily_puzzles")
      .update({
        puzzle_date: date2,
        is_premium: date2 ? isPremiumOnDate(gameMode, parseISO(date2)) ?? false : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", puzzleId1);

    if (step3Error) {
      // Try to rollback - this is a best effort
      await supabase
        .from("daily_puzzles")
        .update({ puzzle_date: date2, updated_at: new Date().toISOString() })
        .eq("id", puzzleId2);
      await supabase
        .from("daily_puzzles")
        .update({ puzzle_date: date1, updated_at: new Date().toISOString() })
        .eq("id", puzzleId1);
      console.error("Swap step 3 error:", step3Error);
      return { success: false, error: step3Error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true };
  } catch (err) {
    console.error("Swap puzzle dates error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Assign a date to a backlog puzzle, with conflict resolution options.
 * Enhanced version that supports forcing as bonus on conflict.
 */
export async function assignPuzzleDateWithConflictHandling(
  puzzleId: string,
  targetDate: string,
  options?: {
    forceAsBonus?: boolean;
  }
): Promise<ActionResult<{ conflict?: ConflictInfo }>> {
  try {
    const supabase = await createAdminClient();

    // First, get the puzzle to check it's a backlog puzzle
    const { data: puzzle, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("*")
      .eq("id", puzzleId)
      .single();

    if (fetchError || !puzzle) {
      return { success: false, error: "Puzzle not found" };
    }

    if (puzzle.puzzle_date !== null) {
      return { success: false, error: "Puzzle is already scheduled" };
    }

    const gameMode = puzzle.game_mode as GameMode;

    // Check for conflict
    const conflictResult = await checkSlotConflict(gameMode, targetDate);
    if (!conflictResult.success) {
      return { success: false, error: conflictResult.error };
    }

    const { conflict } = conflictResult.data!;

    if (conflict && !options?.forceAsBonus) {
      // Return conflict info for the UI to handle
      return { success: true, data: { conflict } };
    }

    // If forceAsBonus is true or no conflict, proceed with assignment
    const isPremium = isPremiumOnDate(gameMode, parseISO(targetDate)) ?? false;

    const { data, error } = await supabase
      .from("daily_puzzles")
      .update({
        puzzle_date: targetDate,
        is_premium: isPremium,
        is_bonus: options?.forceAsBonus || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", puzzleId)
      .select()
      .single();

    if (error) {
      console.error("Assign puzzle date error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/calendar");

    return { success: true, data };
  } catch (err) {
    console.error("Assign puzzle date with conflict handling error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
