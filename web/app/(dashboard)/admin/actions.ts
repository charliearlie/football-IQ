"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { GameMode } from "@/lib/constants";
import { GAME_MODES } from "@/lib/constants";
import { extractAnswer } from "@/lib/admin-utils";

// ============================================================================
// TYPES
// ============================================================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ArchiveRow {
  id: string;
  puzzle_date: string | null;
  game_mode: string;
  status: string | null;
  answer: string;
  answer_qid: string | null;
  nationality_code: string | null;
  usage_count: number;
}

export interface ArchiveResult {
  rows: ArchiveRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FetchArchiveInput {
  gameMode: GameMode | GameMode[];
  page: number;
  pageSize: number;
  status?: string | null;
}

export interface RapSheetEntry {
  puzzle_id: string;
  puzzle_date: string | null;
  game_mode: string;
  status: string | null;
}

export interface RapSheetResult {
  player: { id: string; name: string; nationality_code: string | null };
  appearances: RapSheetEntry[];
  modesSummary: Record<string, number>;
}

export interface CleanupRow {
  id: string;
  puzzle_date: string | null;
  game_mode: string;
  answer: string;
  status: string | null;
}

// ============================================================================
// FETCH PUZZLE ARCHIVE
// ============================================================================

export async function fetchPuzzleArchive(
  input: FetchArchiveInput
): Promise<ActionResult<ArchiveResult>> {
  try {
    const supabase = await createAdminClient();
    const { gameMode, page, pageSize, status } = input;
    const modes = Array.isArray(gameMode) ? gameMode : [gameMode];

    // Build query
    let query = supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, game_mode, status, content", { count: "exact" });

    // Filter by mode(s)
    if (modes.length === 1) {
      query = query.eq("game_mode", modes[0]);
    } else {
      query = query.in("game_mode", modes);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order("puzzle_date", { ascending: false, nullsFirst: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const puzzles = (data ?? []) as Array<{
      id: string;
      puzzle_date: string | null;
      game_mode: string;
      status: string | null;
      content: Record<string, unknown>;
    }>;

    // Extract answers and collect QIDs for player lookup
    const qids = new Set<string>();
    const rows: ArchiveRow[] = puzzles.map((p) => {
      const extracted = extractAnswer(p.game_mode, p.content);
      if (extracted.qid) qids.add(extracted.qid);
      return {
        id: p.id,
        puzzle_date: p.puzzle_date,
        game_mode: p.game_mode,
        status: p.status,
        answer: extracted.text,
        answer_qid: extracted.qid ?? null,
        nationality_code: null,
        usage_count: 0,
      };
    });

    // Batch lookup nationality codes from players table
    if (qids.size > 0) {
      const { data: players } = await supabase
        .from("players")
        .select("id, nationality_code")
        .in("id", Array.from(qids));

      if (players) {
        const playerMap = new Map(players.map((p) => [p.id, p.nationality_code]));
        for (const row of rows) {
          if (row.answer_qid && playerMap.has(row.answer_qid)) {
            row.nationality_code = playerMap.get(row.answer_qid) ?? null;
          }
        }
      }
    }

    // Compute usage counts: how many times each answer appears in these modes
    const answerNames = [...new Set(rows.map((r) => r.answer).filter((a) => a !== "Unknown"))];
    if (answerNames.length > 0) {
      // Fetch all puzzles for these modes and count answer occurrences
      let countQuery = supabase
        .from("daily_puzzles")
        .select("content, game_mode");

      if (modes.length === 1) {
        countQuery = countQuery.eq("game_mode", modes[0]);
      } else {
        countQuery = countQuery.in("game_mode", modes);
      }

      const { data: allPuzzles } = await countQuery;

      if (allPuzzles) {
        const counts = new Map<string, number>();
        for (const p of allPuzzles) {
          const content = p.content as Record<string, unknown>;
          const extracted = extractAnswer(p.game_mode, content);
          const key = extracted.text.toLowerCase();
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        for (const row of rows) {
          row.usage_count = counts.get(row.answer.toLowerCase()) ?? 0;
        }
      }
    }

    return {
      success: true,
      data: {
        rows,
        totalCount: count ?? 0,
        page,
        pageSize,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch archive",
    };
  }
}

// ============================================================================
// FETCH PLAYER RAP SHEET
// ============================================================================

export async function fetchPlayerRapSheet(
  playerQid: string
): Promise<ActionResult<RapSheetResult>> {
  try {
    const supabase = await createAdminClient();

    // Look up player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, name, nationality_code")
      .eq("id", playerQid)
      .maybeSingle();

    if (playerError) {
      return { success: false, error: playerError.message };
    }

    if (!player) {
      return { success: false, error: `Player ${playerQid} not found` };
    }

    // Find all puzzle appearances
    // Search by QID in content->answer_qid, OR by name match in content->answer
    const { data: puzzles, error: puzzleError } = await supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, game_mode, status, content")
      .or(
        `content->answer_qid.eq.${playerQid},content->answer.ilike.%${player.name}%`
      );

    if (puzzleError) {
      return { success: false, error: puzzleError.message };
    }

    const appearances: RapSheetEntry[] = (puzzles ?? []).map((p) => ({
      puzzle_id: p.id,
      puzzle_date: p.puzzle_date,
      game_mode: p.game_mode,
      status: p.status,
    }));

    // Build mode summary
    const modesSummary: Record<string, number> = {};
    for (const mode of GAME_MODES) {
      modesSummary[mode] = 0;
    }
    for (const app of appearances) {
      modesSummary[app.game_mode] = (modesSummary[app.game_mode] ?? 0) + 1;
    }

    return {
      success: true,
      data: {
        player: {
          id: player.id,
          name: player.name,
          nationality_code: player.nationality_code,
        },
        appearances,
        modesSummary,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch rap sheet",
    };
  }
}

// ============================================================================
// FETCH PUZZLES MISSING QID
// ============================================================================

export async function fetchPuzzlesMissingQid(
  gameMode: GameMode | GameMode[]
): Promise<ActionResult<CleanupRow[]>> {
  try {
    const supabase = await createAdminClient();
    const modes = Array.isArray(gameMode) ? gameMode : [gameMode];

    let query = supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, game_mode, content, status")
      .is("content->answer_qid", null);

    if (modes.length === 1) {
      query = query.eq("game_mode", modes[0]);
    } else {
      query = query.in("game_mode", modes);
    }

    query = query.order("puzzle_date", { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const rows: CleanupRow[] = (data ?? []).map((p) => {
      const content = p.content as Record<string, unknown>;
      const extracted = extractAnswer(p.game_mode, content);
      return {
        id: p.id,
        puzzle_date: p.puzzle_date,
        game_mode: p.game_mode,
        answer: extracted.text,
        status: p.status,
      };
    });

    return { success: true, data: rows };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch cleanup data",
    };
  }
}

// ============================================================================
// UPDATE PUZZLE ANSWER QID
// ============================================================================

export async function updatePuzzleAnswerQid(
  puzzleId: string,
  qid: string
): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    // Fetch current content
    const { data: puzzle, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("id, content")
      .eq("id", puzzleId)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!puzzle) {
      return { success: false, error: `Puzzle ${puzzleId} not found` };
    }

    // Patch content with answer_qid
    const content = puzzle.content as Record<string, unknown>;
    const updatedContent = { ...content, answer_qid: qid };

    const { error: updateError } = await supabase
      .from("daily_puzzles")
      .update({ content: updatedContent })
      .eq("id", puzzleId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update QID",
    };
  }
}
