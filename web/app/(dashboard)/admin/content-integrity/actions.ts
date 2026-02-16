"use server";

import { createAdminClient, ensureAdmin } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/(dashboard)/admin/actions";

// ============================================================================
// TYPES
// ============================================================================

export interface IntegrityIssue {
  puzzleId: string;
  puzzleDate: string | null;
  gameMode: string;
  severity: "error" | "warning";
  check: string;
  message: string;
  field?: string;
  playerQid?: string;
}

export interface IntegrityCheckResult {
  totalPuzzlesChecked: number;
  totalIssues: number;
  issuesByMode: Record<string, number>;
  issuesBySeverity: { error: number; warning: number };
  issues: IntegrityIssue[];
}

// ============================================================================
// MAIN ACTION
// ============================================================================

export async function runContentIntegrityChecks(options: {
  statuses: string[];
  gameModes?: string[];
}): Promise<ActionResult<IntegrityCheckResult>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    // Fetch all daily_puzzles matching status filter
    let query = supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, game_mode, status, content");

    if (options.statuses.length === 1) {
      query = query.eq("status", options.statuses[0]);
    } else if (options.statuses.length > 1) {
      query = query.in("status", options.statuses);
    }

    if (options.gameModes && options.gameModes.length > 0) {
      if (options.gameModes.length === 1) {
        query = query.eq("game_mode", options.gameModes[0]);
      } else {
        query = query.in("game_mode", options.gameModes);
      }
    }

    const { data: puzzles, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const allPuzzles = (puzzles ?? []) as Array<{
      id: string;
      puzzle_date: string | null;
      game_mode: string;
      status: string | null;
      content: Record<string, unknown>;
    }>;

    // Group by game_mode
    const byMode = new Map<string, typeof allPuzzles>();
    for (const p of allPuzzles) {
      const existing = byMode.get(p.game_mode) ?? [];
      existing.push(p);
      byMode.set(p.game_mode, existing);
    }

    // Run per-mode checks
    const allIssues: IntegrityIssue[] = [];

    for (const [mode, modePuzzles] of byMode) {
      const issues = await runChecksForMode(supabase, mode, modePuzzles);
      allIssues.push(...issues);
    }

    // Aggregate results
    const issuesByMode: Record<string, number> = {};
    const issuesBySeverity = { error: 0, warning: 0 };

    for (const issue of allIssues) {
      issuesByMode[issue.gameMode] = (issuesByMode[issue.gameMode] ?? 0) + 1;
      issuesBySeverity[issue.severity]++;
    }

    return {
      success: true,
      data: {
        totalPuzzlesChecked: allPuzzles.length,
        totalIssues: allIssues.length,
        issuesByMode,
        issuesBySeverity,
        issues: allIssues,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to run integrity checks",
    };
  }
}

// ============================================================================
// PER-MODE CHECK DISPATCHER
// ============================================================================

type Puzzle = {
  id: string;
  puzzle_date: string | null;
  game_mode: string;
  content: Record<string, unknown>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

async function runChecksForMode(
  supabase: SupabaseClient,
  mode: string,
  puzzles: Puzzle[]
): Promise<IntegrityIssue[]> {
  switch (mode) {
    case "career_path":
    case "career_path_pro":
      return checkCareerPath(supabase, puzzles);
    case "the_grid":
      return checkTheGrid(supabase, puzzles);
    case "the_chain":
      return checkTheChain(supabase, puzzles);
    case "the_thread":
      return checkTheThread(supabase, puzzles);
    case "guess_the_transfer":
      return checkGuessTheTransfer(supabase, puzzles);
    case "top_tens":
      return checkTopTens(puzzles);
    case "connections":
      return checkConnections(puzzles);
    default:
      return [];
  }
}

// ============================================================================
// BATCH LOOKUP HELPERS
// ============================================================================

async function batchLookupPlayerQids(
  supabase: SupabaseClient,
  qids: string[]
): Promise<Set<string>> {
  if (qids.length === 0) return new Set();
  const { data } = await supabase
    .from("players")
    .select("id")
    .in("id", qids);
  return new Set((data ?? []).map((p: { id: string }) => p.id));
}

async function batchLookupPlayerAppearances(
  supabase: SupabaseClient,
  playerIds: string[]
): Promise<Set<string>> {
  if (playerIds.length === 0) return new Set();
  const { data } = await supabase
    .from("player_appearances")
    .select("player_id")
    .in("player_id", playerIds);
  return new Set((data ?? []).map((a: { player_id: string }) => a.player_id));
}

async function batchLookupClubsBySearchName(
  supabase: SupabaseClient,
  names: string[]
): Promise<Set<string>> {
  if (names.length === 0) return new Set();
  const lowerNames = names.map((n) => n.toLowerCase());
  const { data } = await supabase
    .from("clubs")
    .select("search_name")
    .in("search_name", lowerNames);
  return new Set(
    (data ?? []).map((c: { search_name: string }) => c.search_name.toLowerCase())
  );
}

async function batchLookupClubsByQid(
  supabase: SupabaseClient,
  qids: string[]
): Promise<Set<string>> {
  if (qids.length === 0) return new Set();
  const { data } = await supabase
    .from("clubs")
    .select("id")
    .in("id", qids);
  return new Set((data ?? []).map((c: { id: string }) => c.id));
}

async function batchLookupPlayersByName(
  supabase: SupabaseClient,
  names: string[]
): Promise<Set<string>> {
  if (names.length === 0) return new Set();
  const lowerNames = names.map((n) => n.toLowerCase());
  const { data } = await supabase
    .from("players")
    .select("name")
    .in("name", names);
  const foundSet = new Set<string>(
    (data ?? []).map((p: { name: string }) => p.name.toLowerCase())
  );
  return foundSet;
}

// ============================================================================
// CAREER PATH / CAREER PATH PRO
// ============================================================================

async function checkCareerPath(
  supabase: SupabaseClient,
  puzzles: Puzzle[]
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Collect all answer_qids and club names for batch lookup
  const allQids: string[] = [];
  const allClubNames: string[] = [];

  for (const p of puzzles) {
    const qid = p.content.answer_qid as string | undefined;
    if (qid) allQids.push(qid);

    const steps = p.content.career_steps as Array<{ text?: string }> | undefined;
    if (steps) {
      for (const step of steps) {
        if (step.text) allClubNames.push(step.text);
      }
    }
  }

  const [existingPlayers, existingClubs, playersWithAppearances] =
    await Promise.all([
      batchLookupPlayerQids(supabase, [...new Set(allQids)]),
      batchLookupClubsBySearchName(supabase, [...new Set(allClubNames)]),
      batchLookupPlayerAppearances(supabase, [...new Set(allQids)]),
    ]);

  for (const p of puzzles) {
    const qid = p.content.answer_qid as string | undefined;

    // Check answer_qid exists
    if (!qid) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "answer_qid_missing",
        message: "Missing answer_qid in content",
        field: "answer_qid",
      });
    } else if (!existingPlayers.has(qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "answer_qid_not_found",
        message: `Player QID ${qid} not found in players table`,
        field: "answer_qid",
        playerQid: qid,
      });
    } else if (!playersWithAppearances.has(qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "warning",
        check: "player_no_appearances",
        message: `Player ${qid} has no player_appearances records`,
        field: "answer_qid",
        playerQid: qid,
      });
    }

    // Check career step club names
    const steps = p.content.career_steps as Array<{ text?: string }> | undefined;
    if (steps) {
      for (const step of steps) {
        if (step.text && !existingClubs.has(step.text.toLowerCase())) {
          issues.push({
            puzzleId: p.id,
            puzzleDate: p.puzzle_date,
            gameMode: p.game_mode,
            severity: "warning",
            check: "club_name_unmatched",
            message: `Club name "${step.text}" not found in clubs table (search_name)`,
            field: "career_steps",
          });
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// THE GRID
// ============================================================================

async function checkTheGrid(
  supabase: SupabaseClient,
  puzzles: Puzzle[]
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Collect all club names and player names
  const allClubNames: string[] = [];
  const allPlayerNames: string[] = [];

  for (const p of puzzles) {
    for (const axis of ["xAxis", "yAxis"]) {
      const categories = p.content[axis] as Array<{ type?: string; value?: string }> | undefined;
      if (categories) {
        for (const cat of categories) {
          if (cat.type === "club" && cat.value) {
            allClubNames.push(cat.value);
          }
        }
      }
    }

    const validAnswers = p.content.valid_answers as Record<string, string[]> | undefined;
    if (validAnswers) {
      for (const names of Object.values(validAnswers)) {
        allPlayerNames.push(...names);
      }
    }
  }

  const [existingClubs, existingPlayers] = await Promise.all([
    batchLookupClubsBySearchName(supabase, [...new Set(allClubNames)]),
    batchLookupPlayersByName(supabase, [...new Set(allPlayerNames)]),
  ]);

  for (const p of puzzles) {
    for (const axis of ["xAxis", "yAxis"]) {
      const categories = p.content[axis] as Array<{ type?: string; value?: string }> | undefined;
      if (categories) {
        for (const cat of categories) {
          if (cat.type === "club" && cat.value && !existingClubs.has(cat.value.toLowerCase())) {
            issues.push({
              puzzleId: p.id,
              puzzleDate: p.puzzle_date,
              gameMode: p.game_mode,
              severity: "error",
              check: "grid_club_not_found",
              message: `Club "${cat.value}" not found in clubs table`,
              field: axis,
            });
          }
        }
      }
    }

    const validAnswers = p.content.valid_answers as Record<string, string[]> | undefined;
    if (validAnswers) {
      for (const [cell, names] of Object.entries(validAnswers)) {
        for (const name of names) {
          if (!existingPlayers.has(name.toLowerCase())) {
            issues.push({
              puzzleId: p.id,
              puzzleDate: p.puzzle_date,
              gameMode: p.game_mode,
              severity: "warning",
              check: "grid_player_not_found",
              message: `Player "${name}" (cell ${cell}) not found in players table`,
              field: "valid_answers",
            });
          }
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// THE CHAIN
// ============================================================================

async function checkTheChain(
  supabase: SupabaseClient,
  puzzles: Puzzle[]
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Collect all player QIDs
  const allQids: string[] = [];

  for (const p of puzzles) {
    const startPlayer = p.content.start_player as { qid?: string } | undefined;
    const endPlayer = p.content.end_player as { qid?: string } | undefined;
    if (startPlayer?.qid) allQids.push(startPlayer.qid);
    if (endPlayer?.qid) allQids.push(endPlayer.qid);
  }

  const [existingPlayers, playersWithAppearances] = await Promise.all([
    batchLookupPlayerQids(supabase, [...new Set(allQids)]),
    batchLookupPlayerAppearances(supabase, [...new Set(allQids)]),
  ]);

  // Track puzzles that need path validation (sample max ~20)
  const pathCheckPuzzles: Array<{ puzzle: Puzzle; startQid: string; endQid: string }> = [];

  for (const p of puzzles) {
    const startPlayer = p.content.start_player as { qid?: string; name?: string } | undefined;
    const endPlayer = p.content.end_player as { qid?: string; name?: string } | undefined;

    // Check start player
    if (!startPlayer?.qid) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "chain_start_player_missing",
        message: "Missing start_player.qid",
        field: "start_player",
      });
    } else if (!existingPlayers.has(startPlayer.qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "chain_start_player_not_found",
        message: `Start player QID ${startPlayer.qid} not found in players table`,
        field: "start_player",
        playerQid: startPlayer.qid,
      });
    } else if (!playersWithAppearances.has(startPlayer.qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "chain_start_player_no_appearances",
        message: `Start player ${startPlayer.qid} has no player_appearances`,
        field: "start_player",
        playerQid: startPlayer.qid,
      });
    }

    // Check end player
    if (!endPlayer?.qid) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "chain_end_player_missing",
        message: "Missing end_player.qid",
        field: "end_player",
      });
    } else if (!existingPlayers.has(endPlayer.qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "chain_end_player_not_found",
        message: `End player QID ${endPlayer.qid} not found in players table`,
        field: "end_player",
        playerQid: endPlayer.qid,
      });
    } else if (!playersWithAppearances.has(endPlayer.qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "chain_end_player_no_appearances",
        message: `End player ${endPlayer.qid} has no player_appearances`,
        field: "end_player",
        playerQid: endPlayer.qid,
      });
    }

    // Collect for path validation if both players exist
    if (
      startPlayer?.qid &&
      endPlayer?.qid &&
      existingPlayers.has(startPlayer.qid) &&
      existingPlayers.has(endPlayer.qid) &&
      playersWithAppearances.has(startPlayer.qid) &&
      playersWithAppearances.has(endPlayer.qid)
    ) {
      pathCheckPuzzles.push({
        puzzle: p,
        startQid: startPlayer.qid,
        endQid: endPlayer.qid,
      });
    }
  }

  // Path validation for a sample (max ~20 to avoid timeout)
  const pathSample = pathCheckPuzzles.slice(0, 20);
  for (const { puzzle, startQid, endQid } of pathSample) {
    try {
      const { data: pathResult } = await supabase.rpc(
        "find_shortest_player_path",
        { start_qid: startQid, end_qid: endQid, max_depth: 8 }
      );

      if (!pathResult || (Array.isArray(pathResult) && pathResult.length === 0)) {
        issues.push({
          puzzleId: puzzle.id,
          puzzleDate: puzzle.puzzle_date,
          gameMode: puzzle.game_mode,
          severity: "error",
          check: "chain_no_valid_path",
          message: `No valid path found between ${startQid} and ${endQid} (max depth 8)`,
          field: "path",
          playerQid: startQid,
        });
      }
    } catch {
      // RPC failure is non-fatal for this check
    }
  }

  return issues;
}

// ============================================================================
// THE THREAD
// ============================================================================

async function checkTheThread(
  supabase: SupabaseClient,
  puzzles: Puzzle[]
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Collect all club IDs
  const allClubIds: string[] = [];

  for (const p of puzzles) {
    const clubId = p.content.correct_club_id as string | undefined;
    if (clubId) allClubIds.push(clubId);
  }

  const existingClubs = await batchLookupClubsByQid(
    supabase,
    [...new Set(allClubIds)]
  );

  for (const p of puzzles) {
    const clubId = p.content.correct_club_id as string | undefined;

    if (!clubId) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "thread_club_missing",
        message: "Missing correct_club_id",
        field: "correct_club_id",
      });
    } else if (!existingClubs.has(clubId)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "thread_club_not_found",
        message: `Club QID ${clubId} not found in clubs table`,
        field: "correct_club_id",
      });
    }

    const path = p.content.path as unknown[] | undefined;
    if (!path || path.length < 3) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "warning",
        check: "thread_path_too_short",
        message: `Thread path has ${path?.length ?? 0} entries (minimum 3)`,
        field: "path",
      });
    }
  }

  return issues;
}

// ============================================================================
// GUESS THE TRANSFER
// ============================================================================

async function checkGuessTheTransfer(
  supabase: SupabaseClient,
  puzzles: Puzzle[]
): Promise<IntegrityIssue[]> {
  const issues: IntegrityIssue[] = [];

  // Collect all answer QIDs
  const allQids: string[] = [];

  for (const p of puzzles) {
    const qid = p.content.answer_qid as string | undefined;
    if (qid) allQids.push(qid);
  }

  const existingPlayers = await batchLookupPlayerQids(
    supabase,
    [...new Set(allQids)]
  );

  for (const p of puzzles) {
    const qid = p.content.answer_qid as string | undefined;

    if (!qid) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "warning",
        check: "transfer_qid_missing",
        message: "Missing answer_qid (optional but recommended)",
        field: "answer_qid",
      });
    } else if (!existingPlayers.has(qid)) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "transfer_qid_not_found",
        message: `Player QID ${qid} not found in players table`,
        field: "answer_qid",
        playerQid: qid,
      });
    }
  }

  return issues;
}

// ============================================================================
// TOP TENS
// ============================================================================

function checkTopTens(puzzles: Puzzle[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  for (const p of puzzles) {
    const answers = p.content.answers as unknown[] | undefined;

    if (!answers || answers.length !== 10) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "top_tens_wrong_count",
        message: `Expected 10 answers, found ${answers?.length ?? 0}`,
        field: "answers",
      });
    }
  }

  return issues;
}

// ============================================================================
// CONNECTIONS
// ============================================================================

const VALID_DIFFICULTIES = new Set(["yellow", "green", "blue", "purple"]);

function checkConnections(puzzles: Puzzle[]): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  for (const p of puzzles) {
    const groups = p.content.groups as
      | Array<{
          category?: string;
          difficulty?: string;
          players?: string[];
        }>
      | undefined;

    if (!groups || groups.length !== 4) {
      issues.push({
        puzzleId: p.id,
        puzzleDate: p.puzzle_date,
        gameMode: p.game_mode,
        severity: "error",
        check: "connections_wrong_group_count",
        message: `Expected 4 groups, found ${groups?.length ?? 0}`,
        field: "groups",
      });
      continue;
    }

    const allPlayerNames: string[] = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      // Check group has exactly 4 players
      if (!group.players || group.players.length !== 4) {
        issues.push({
          puzzleId: p.id,
          puzzleDate: p.puzzle_date,
          gameMode: p.game_mode,
          severity: "error",
          check: "connections_wrong_player_count",
          message: `Group ${i + 1} has ${group.players?.length ?? 0} players (expected 4)`,
          field: `groups[${i}].players`,
        });
      } else {
        allPlayerNames.push(...group.players);
      }

      // Check valid difficulty
      if (!group.difficulty || !VALID_DIFFICULTIES.has(group.difficulty)) {
        issues.push({
          puzzleId: p.id,
          puzzleDate: p.puzzle_date,
          gameMode: p.game_mode,
          severity: "error",
          check: "connections_invalid_difficulty",
          message: `Group ${i + 1} has invalid difficulty: "${group.difficulty ?? "missing"}"`,
          field: `groups[${i}].difficulty`,
        });
      }

      // Check non-empty category
      if (!group.category || group.category.trim() === "") {
        issues.push({
          puzzleId: p.id,
          puzzleDate: p.puzzle_date,
          gameMode: p.game_mode,
          severity: "error",
          check: "connections_empty_category",
          message: `Group ${i + 1} has empty category`,
          field: `groups[${i}].category`,
        });
      }
    }

    // Check all 16 names are unique
    if (allPlayerNames.length === 16) {
      const uniqueNames = new Set(allPlayerNames.map((n) => n.toLowerCase()));
      if (uniqueNames.size !== 16) {
        issues.push({
          puzzleId: p.id,
          puzzleDate: p.puzzle_date,
          gameMode: p.game_mode,
          severity: "error",
          check: "connections_duplicate_players",
          message: `Found duplicate player names (${16 - uniqueNames.size} duplicates)`,
          field: "groups",
        });
      }
    }
  }

  return issues;
}
