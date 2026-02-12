"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { GameMode } from "@/lib/constants";
import { GAME_MODES } from "@/lib/constants";
import { extractAnswer } from "@/lib/admin-utils";
import {
  runMappingBatch,
  runCareerValidationBatch,
  fetchPlayerTeams,
  apiTeamsToClubSummaries,
  type MappingRunResult,
  type CareerValidationResult,
  type OurAppearance,
  type ClubMapping,
  type AmbiguousCandidate,
  type ApiClubSummary,
} from "@/lib/data-pipeline/map-external-ids";

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

// ============================================================================
// PLAYER COMMAND CENTER
// ============================================================================

export interface ClubHistoryEntry {
  club_id: string;
  club_name: string;
  country_code: string | null;
  start_year: number | null;
  end_year: number | null;
}

export interface TrophyEntry {
  achievement_id: string;
  name: string;
  category: string;
  year: number | null;
  club_name: string | null;
}

export interface CommandCenterResult {
  player: {
    id: string;
    name: string;
    nationality_code: string | null;
    scout_rank: number;
  };
  clubHistory: ClubHistoryEntry[];
  trophyCabinet: TrophyEntry[];
}

/**
 * Fetch comprehensive player data for the command center:
 * - Player details with scout_rank
 * - Club history from player_appearances
 * - Trophy cabinet from player_achievements
 */
export async function fetchPlayerCommandCenterData(
  playerQid: string
): Promise<ActionResult<CommandCenterResult>> {
  try {
    const supabase = await createAdminClient();

    // Fetch player details
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, name, nationality_code, scout_rank")
      .eq("id", playerQid)
      .maybeSingle();

    if (playerError) {
      return { success: false, error: playerError.message };
    }

    if (!player) {
      return { success: false, error: `Player ${playerQid} not found` };
    }

    // Fetch club history (player_appearances joined with clubs)
    const { data: appearances, error: appearancesError } = await supabase
      .from("player_appearances")
      .select(`
        club_id,
        start_year,
        end_year,
        clubs (
          id,
          name,
          country_code
        )
      `)
      .eq("player_id", playerQid)
      .order("start_year", { ascending: true, nullsFirst: true });

    if (appearancesError) {
      return { success: false, error: appearancesError.message };
    }

    const clubHistory: ClubHistoryEntry[] = (appearances ?? []).map((app) => {
      const club = app.clubs as { id: string; name: string; country_code: string | null } | null;
      return {
        club_id: app.club_id,
        club_name: club?.name ?? "Unknown Club",
        country_code: club?.country_code ?? null,
        start_year: app.start_year,
        end_year: app.end_year,
      };
    });

    // Fetch trophy cabinet (player_achievements joined with achievements and clubs)
    // Table added via migration, not yet in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trophies, error: trophiesError } = await (supabase as any)
      .from("player_achievements")
      .select(`
        achievement_id,
        year,
        club_id,
        achievements (
          id,
          name,
          category
        ),
        clubs (
          id,
          name
        )
      `)
      .eq("player_id", playerQid)
      .order("year", { ascending: false, nullsFirst: true });

    if (trophiesError) {
      return { success: false, error: trophiesError.message };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trophyCabinet: TrophyEntry[] = (trophies ?? []).map((trophy: any) => {
      const achievement = trophy.achievements as { id: string; name: string; category: string } | null;
      const club = trophy.clubs as { id: string; name: string } | null;
      return {
        achievement_id: trophy.achievement_id,
        name: achievement?.name ?? "Unknown Achievement",
        category: achievement?.category ?? "Unknown",
        year: trophy.year,
        club_name: club?.name ?? null,
      };
    });

    return {
      success: true,
      data: {
        player: {
          id: player.id,
          name: player.name,
          nationality_code: player.nationality_code,
          scout_rank: player.scout_rank ?? 0,
        },
        clubHistory,
        trophyCabinet,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch player data",
    };
  }
}

export interface ResyncResult {
  careersUpdated: number;
  achievementsUpdated: number;
}

/**
 * Force re-sync a player's career and achievements from Wikidata.
 * Uses the player-scout actions for fetching and saving.
 */
export async function resyncPlayerFromWikidata(
  playerQid: string
): Promise<ActionResult<ResyncResult>> {
  try {
    // Import the player-scout actions dynamically to avoid circular deps
    const {
      fetchPlayerCareer,
      saveCareerToSupabase,
      syncPlayerAchievements,
    } = await import("@/app/(dashboard)/player-scout/actions");

    // Re-sync career from Wikidata
    const career = await fetchPlayerCareer(playerQid);
    const careerResult = await saveCareerToSupabase(playerQid, career);

    if (!careerResult.success) {
      return { success: false, error: `Career sync failed: ${careerResult.error}` };
    }

    // Re-sync achievements from Wikidata
    const achievementResult = await syncPlayerAchievements(playerQid);

    if (!achievementResult.success) {
      return { success: false, error: `Achievement sync failed: ${achievementResult.error}` };
    }

    revalidatePath("/admin");

    return {
      success: true,
      data: {
        careersUpdated: career.length,
        achievementsUpdated: achievementResult.count,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to resync player",
    };
  }
}

// ============================================================================
// API-FOOTBALL EXTERNAL ID MAPPING
// ============================================================================

/**
 * Fetch players that don't yet have an api_football_id,
 * ordered by scout_rank DESC (most notable first).
 * Requires birth_year AND nationality_code for safe disambiguation.
 */
async function getUnmappedPlayers(
  limit: number
): Promise<Array<{ id: string; name: string; birth_year: number | null; nationality_code: string | null }>> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("players")
    .select("id, name, birth_year, nationality_code")
    .is("api_football_id", null)
    .is("mapping_status" as string, null)
    .not("birth_year", "is", null)
    .not("nationality_code", "is", null)
    .order("scout_rank", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch unmapped players: ${error.message}`);
  return data ?? [];
}

/**
 * Save high-confidence API-Football ID mappings to the players table.
 */
async function saveMappingsToSupabase(
  mappings: Array<{ playerQid: string; apiFootballId: number | null }>
): Promise<{ count: number }> {
  const supabase = await createAdminClient();
  let count = 0;

  for (const mapping of mappings) {
    if (mapping.apiFootballId == null) continue;

    const { error } = await supabase
      .from("players")
      .update({ api_football_id: mapping.apiFootballId } as Record<string, unknown>)
      .eq("id", mapping.playerQid);

    if (error) {
      console.error(`Failed to save mapping for ${mapping.playerQid}: ${error.message}`);
    } else {
      count++;
    }
  }

  return { count };
}

/**
 * Save mapping_status for flagged and skipped players so they
 * aren't re-processed on subsequent runs.
 */
async function saveMappingStatuses(result: MappingRunResult) {
  const supabase = await createAdminClient();

  const updates: Array<{ qid: string; status: string }> = [];

  for (const m of result.flaggedForReview) {
    updates.push({ qid: m.playerQid, status: "flagged" });
  }
  for (const m of result.skipped) {
    // Distinguish between "not found in API" and "skipped due to bad data"
    const status = m.reason.includes("No API results") || m.reason.includes("none matched")
      ? "not_found"
      : "skipped";
    updates.push({ qid: m.playerQid, status });
  }

  for (const { qid, status } of updates) {
    await supabase
      .from("players")
      .update({ mapping_status: status } as Record<string, unknown>)
      .eq("id", qid);
  }
}

/**
 * Run the API-Football external ID mapping pipeline.
 * Fetches unmapped players (by scout_rank DESC), searches API-Football,
 * and saves high-confidence matches.
 *
 * Safety: auto-stops at 90 requests to preserve trial quota (100/day).
 */
export async function runApiFootballMapping(
  options: { limit?: number; dryRun?: boolean }
): Promise<ActionResult<MappingRunResult & { savedCount: number }>> {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return { success: false, error: "API_FOOTBALL_KEY not configured in environment" };
    }

    const players = await getUnmappedPlayers(options.limit ?? 50);
    if (players.length === 0) {
      return {
        success: true,
        data: {
          mapped: [],
          flaggedForReview: [],
          skipped: [],
          requestsUsed: 0,
          requestBudget: 90,
          savedCount: 0,
        },
      };
    }

    const result = await runMappingBatch(players, apiKey);

    let savedCount = 0;
    if (!options.dryRun) {
      const highConfidence = result.mapped.filter(
        (m) => m.confidence === "high" && m.apiFootballId != null
      );
      if (highConfidence.length > 0) {
        const saveResult = await saveMappingsToSupabase(highConfidence);
        savedCount = saveResult.count;
      }

      // Mark flagged/skipped players so they don't get re-processed
      await saveMappingStatuses(result);
    }

    // Log run to agent_runs table
    try {
      const supabase = await createAdminClient();
      await supabase.from("agent_runs").insert({
        run_date: new Date().toISOString().split("T")[0],
        agent_name: "api_football_mapper",
        status: "success",
        puzzles_created: 0,
        logs: {
          mapped_count: result.mapped.length,
          flagged_count: result.flaggedForReview.length,
          skipped_count: result.skipped.length,
          requests_used: result.requestsUsed,
          saved_count: savedCount,
          dry_run: options.dryRun ?? false,
          flagged_players: result.flaggedForReview.map((f) => ({
            qid: f.playerQid,
            name: f.playerName,
            reason: f.reason,
            candidates: f.candidates,
          })),
        },
      });
    } catch {
      // Non-fatal: logging failure shouldn't block the result
    }

    return {
      success: true,
      data: { ...result, savedCount },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "API-Football mapping failed",
    };
  }
}

// ============================================================================
// ACCEPT FLAGGED MAPPING
// ============================================================================

/**
 * Accept a flagged (medium-confidence) player mapping.
 * Saves the api_football_id to the players table.
 */
export async function acceptFlaggedMapping(
  playerQid: string,
  apiFootballId: number
): Promise<ActionResult> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("players")
      .update({ api_football_id: apiFootballId, mapping_status: null } as Record<string, unknown>)
      .eq("id", playerQid);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save mapping",
    };
  }
}

// ============================================================================
// INSPECT API PLAYER (for flagged review)
// ============================================================================

/**
 * Fetch a player's team history from API-Football for manual review.
 * Returns club summaries (national teams filtered out).
 * Costs 1 API request.
 */
export async function inspectApiPlayer(
  apiFootballId: number
): Promise<ActionResult<{ clubs: ApiClubSummary[] }>> {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return { success: false, error: "API_FOOTBALL_KEY not configured" };
    }

    const teams = await fetchPlayerTeams(apiFootballId, apiKey);
    const clubs = apiTeamsToClubSummaries(teams);

    return { success: true, data: { clubs } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch player teams",
    };
  }
}

// ============================================================================
// CAREER VALIDATION (Phase 2)
// ============================================================================

/**
 * Fetch mapped players (those with api_football_id) and their appearances.
 */
async function getMappedPlayersWithAppearances(
  limit: number
): Promise<{
  players: Array<{
    playerQid: string;
    playerName: string;
    apiFootballId: number;
    ourAppearances: OurAppearance[];
  }>;
  existingClubMap: Map<string, number>;
}> {
  const supabase = await createAdminClient();

  // Get players that have been mapped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: players, error } = await (supabase as any)
    .from("players")
    .select("id, name, api_football_id")
    .not("api_football_id", "is", null)
    .order("scout_rank", { ascending: false })
    .limit(limit) as { data: Array<{ id: string; name: string; api_football_id: number }> | null; error: { message: string } | null };

  if (error) throw new Error(`Failed to fetch mapped players: ${error.message}`);
  if (!players || players.length === 0) {
    return { players: [], existingClubMap: new Map() };
  }

  // Load existing club ID mappings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mappedClubs } = await (supabase as any)
    .from("clubs")
    .select("id, api_football_id")
    .not("api_football_id", "is", null) as { data: Array<{ id: string; api_football_id: number }> | null };

  const existingClubMap = new Map<string, number>();
  for (const club of mappedClubs ?? []) {
    existingClubMap.set(club.id, club.api_football_id);
  }

  // For each player, fetch their appearances with club names
  const results = [];
  for (const player of players) {
    const { data: appearances } = await supabase
      .from("player_appearances")
      .select(`
        club_id,
        start_year,
        end_year,
        clubs (
          id,
          name
        )
      `)
      .eq("player_id", player.id)
      .order("start_year", { ascending: true, nullsFirst: true });

    const ourAppearances: OurAppearance[] = (appearances ?? []).map((app) => {
      const club = app.clubs as { id: string; name: string } | null;
      return {
        clubId: app.club_id,
        clubName: club?.name ?? "Unknown Club",
        startYear: app.start_year,
        endYear: app.end_year,
      };
    });

    results.push({
      playerQid: player.id,
      playerName: player.name,
      apiFootballId: player.api_football_id,
      ourAppearances,
    });
  }

  return { players: results, existingClubMap };
}

/**
 * Save discovered club API-Football ID mappings to the clubs table.
 */
async function saveClubMappings(
  mappings: ClubMapping[]
): Promise<{ saved: number; duplicates: string[] }> {
  const supabase = await createAdminClient();
  let saved = 0;
  const duplicates: string[] = [];

  for (const mapping of mappings) {
    // Check if another club already has this API ID (potential duplicate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("clubs")
      .select("id, name")
      .eq("api_football_id", mapping.apiFootballId)
      .maybeSingle() as { data: { id: string; name: string } | null };

    if (existing && existing.id !== mapping.clubQid) {
      duplicates.push(
        `${mapping.clubName} (${mapping.clubQid}) and ${existing.name} (${existing.id}) both map to API team ${mapping.apiFootballId}`
      );
      continue;
    }

    const { error } = await supabase
      .from("clubs")
      .update({ api_football_id: mapping.apiFootballId } as Record<string, unknown>)
      .eq("id", mapping.clubQid);

    if (error) {
      console.error(`Failed to save club mapping for ${mapping.clubQid}: ${error.message}`);
    } else {
      saved++;
    }
  }

  return { saved, duplicates };
}

/**
 * Run career validation: fetch teams from API-Football for mapped players
 * and compare against our player_appearances data.
 *
 * Side effect: discovers and saves club API-Football ID mappings.
 * The career comparison itself is report-only — no player data changes.
 */
export async function runCareerValidation(
  options: { limit?: number; dryRun?: boolean }
): Promise<ActionResult<CareerValidationResult & { clubMappingsSaved: number; clubDuplicates: string[] }>> {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return { success: false, error: "API_FOOTBALL_KEY not configured in environment" };
    }

    const { players, existingClubMap } = await getMappedPlayersWithAppearances(options.limit ?? 50);
    if (players.length === 0) {
      return {
        success: true,
        data: {
          validated: [],
          errors: [],
          clubMappingsDiscovered: [],
          clubMappingsSaved: 0,
          clubDuplicates: [],
          requestsUsed: 0,
          requestBudget: 7000,
        },
      };
    }

    const result = await runCareerValidationBatch(players, apiKey, {
      existingClubMap,
    });

    // Save discovered club mappings (unless dry run)
    let clubMappingsSaved = 0;
    let clubDuplicates: string[] = [];
    if (!options.dryRun && result.clubMappingsDiscovered.length > 0) {
      const saveResult = await saveClubMappings(result.clubMappingsDiscovered);
      clubMappingsSaved = saveResult.saved;
      clubDuplicates = saveResult.duplicates;
    }

    // Log run to agent_runs table
    try {
      const supabase = await createAdminClient();
      const totalDiscrepancies = result.validated.reduce(
        (sum, v) => sum + v.totalDiscrepancies, 0
      );
      await supabase.from("agent_runs").insert({
        run_date: new Date().toISOString().split("T")[0],
        agent_name: "career_validator",
        status: "success",
        puzzles_created: 0,
        logs: {
          validated_count: result.validated.length,
          error_count: result.errors.length,
          total_discrepancies: totalDiscrepancies,
          requests_used: result.requestsUsed,
          club_mappings_discovered: result.clubMappingsDiscovered.length,
          club_mappings_saved: clubMappingsSaved,
          club_duplicates: clubDuplicates,
          dry_run: options.dryRun ?? false,
          players_with_issues: result.validated
            .filter((v) => v.totalDiscrepancies > 0)
            .map((v) => ({
              qid: v.playerQid,
              name: v.playerName,
              discrepancies: v.totalDiscrepancies,
              missing_from_ours: v.comparison.missingFromOurs.length,
              missing_from_api: v.comparison.missingFromApi.length,
            })),
        },
      });
    } catch {
      // Non-fatal
    }

    return {
      success: true,
      data: { ...result, clubMappingsSaved, clubDuplicates },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Career validation failed",
    };
  }
}
