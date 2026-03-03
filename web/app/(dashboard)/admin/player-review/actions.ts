"use server";

import { createAdminClient, ensureAdmin, ensureAdminWrite } from "@/lib/supabase/server";
import type { ActionResult } from "../actions";
import {
  resolveOnePlayer,
  type AmbiguousCandidate,
} from "@/lib/data-pipeline/map-external-ids";
import {
  resolvePlayerFromWikipedia,
  fetchPlayerCareer,
  type CareerEntry,
  type ResolvedPlayer,
} from "@/app/(dashboard)/player-scout/actions";

// ============================================================================
// TYPES
// ============================================================================

export interface FlaggedPlayer {
  id: string;
  name: string;
  birthYear: number | null;
  nationalityCode: string | null;
  mappingStatus: string;
  scoutRank: number | null;
}

export interface FlaggedPlayersResult {
  players: FlaggedPlayer[];
  totalCount: number;
  page: number;
  pageSize: number;
  counts: {
    all: number;
    flagged: number;
    notFound: number;
    noCareer: number;
  };
}

export interface CandidateSearchResult {
  candidates: AmbiguousCandidate[];
  confidence: "high" | "medium" | "none";
  reason: string;
}

export interface WikipediaResult {
  player: ResolvedPlayer | null;
  career: CareerEntry[];
  error?: string;
}

// ============================================================================
// GET FLAGGED PLAYERS
// ============================================================================

export async function getFlaggedPlayers(
  page: number,
  pageSize: number,
  filter?: "all" | "flagged" | "not_found" | "no_career"
): Promise<ActionResult<FlaggedPlayersResult>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    // ── Counts (always needed for filter bar) ─────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [flaggedRes, notFoundRes, noCareerRes] = await Promise.all([
      sb.from("players").select("id", { count: "exact", head: true })
        .eq("mapping_status", "flagged") as Promise<{ count: number | null }>,
      sb.from("players").select("id", { count: "exact", head: true })
        .eq("mapping_status", "not_found") as Promise<{ count: number | null }>,
      sb.rpc("count_no_career_players") as Promise<{ data: number | null; error: { message: string } | null }>,
    ]);

    const flagged = flaggedRes.count ?? 0;
    const notFound = notFoundRes.count ?? 0;
    const noCareer = noCareerRes.data ?? 0;

    const counts = { all: flagged + notFound, flagged, notFound, noCareer };

    // ── No Career filter (uses SQL function with NOT EXISTS) ──────────────
    if (filter === "no_career") {
      const offset = (page - 1) * pageSize;
      const { data: rows, error: rpcError } = await sb.rpc(
        "get_no_career_players",
        { p_limit: pageSize, p_offset: offset }
      ) as {
        data: Array<{
          id: string; name: string; birth_year: number | null;
          nationality_code: string | null; scout_rank: number | null;
        }> | null;
        error: { message: string } | null;
      };

      if (rpcError) {
        return { success: false, error: rpcError.message };
      }

      const players: FlaggedPlayer[] = (rows ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        birthYear: row.birth_year,
        nationalityCode: row.nationality_code,
        mappingStatus: "no_career",
        scoutRank: row.scout_rank,
      }));

      return {
        success: true,
        data: { players, totalCount: noCareer, page, pageSize, counts },
      };
    }

    // ── Standard filters (flagged / not_found / all) ──────────────────────
    let query = sb
      .from("players")
      .select("id, name, birth_year, nationality_code, mapping_status, scout_rank", {
        count: "exact",
      });

    if (filter === "flagged") {
      query = query.eq("mapping_status", "flagged");
    } else if (filter === "not_found") {
      query = query.eq("mapping_status", "not_found");
    } else {
      query = query.in("mapping_status", ["flagged", "not_found"]);
    }

    query = query.order("scout_rank", { ascending: false, nullsFirst: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query as {
      data: Array<{
        id: string;
        name: string;
        birth_year: number | null;
        nationality_code: string | null;
        mapping_status: string;
        scout_rank: number | null;
      }> | null;
      error: { message: string } | null;
      count: number | null;
    };

    if (error) {
      return { success: false, error: error.message };
    }

    const players: FlaggedPlayer[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      birthYear: row.birth_year,
      nationalityCode: row.nationality_code,
      mappingStatus: row.mapping_status,
      scoutRank: row.scout_rank,
    }));

    return {
      success: true,
      data: { players, totalCount: count ?? 0, page, pageSize, counts },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch flagged players",
    };
  }
}

// ============================================================================
// SEARCH API-FOOTBALL CANDIDATES
// ============================================================================

export async function searchApiFootballCandidates(
  playerQid: string
): Promise<ActionResult<CandidateSearchResult>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    // Load the player from DB
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, name, birth_year, nationality_code")
      .eq("id", playerQid)
      .single();

    if (playerError) {
      return { success: false, error: playerError.message };
    }

    if (!player) {
      return { success: false, error: `Player ${playerQid} not found` };
    }

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return { success: false, error: "API_FOOTBALL_KEY not configured in environment" };
    }

    const result = await resolveOnePlayer(player, apiKey);

    let candidates: AmbiguousCandidate[] = [];
    if (result.confidence === "high" && result.apiFootballId != null) {
      // High confidence: create a single-element candidates array
      candidates = [
        {
          apiFootballId: result.apiFootballId,
          name: result.playerName,
          birthYear: player.birth_year,
          nationality: player.nationality_code ?? "",
          photo: null,
        },
      ];
    } else if (result.ambiguousCandidates) {
      candidates = result.ambiguousCandidates;
    }

    return {
      success: true,
      data: {
        candidates,
        confidence: result.confidence,
        reason: result.reason,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to search API-Football candidates",
    };
  }
}

// ============================================================================
// RESOLVE FROM WIKIPEDIA
// ============================================================================

export async function resolveFromWikipedia(
  wikipediaUrl: string
): Promise<ActionResult<WikipediaResult>> {
  try {
    await ensureAdmin();

    const { player, error } = await resolvePlayerFromWikipedia(wikipediaUrl);

    let career: CareerEntry[] = [];
    if (player) {
      career = await fetchPlayerCareer(player.qid);
    }

    return {
      success: true,
      data: {
        player,
        career,
        error,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to resolve from Wikipedia",
    };
  }
}

// ============================================================================
// SEARCH WIKIPEDIA ARTICLES
// ============================================================================

export interface WikiSearchResult {
  title: string;
  snippet: string;
  pageUrl: string;
}

export async function searchWikipediaArticles(
  query: string
): Promise<ActionResult<WikiSearchResult[]>> {
  try {
    await ensureAdmin();

    if (query.length < 2) {
      return { success: true, data: [] };
    }

    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `${query} footballer`,
      srnamespace: "0",
      srlimit: "8",
      format: "json",
    });

    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?${params.toString()}`,
      { headers: { "User-Agent": "FootballIQ-Admin/1.0 (player-review)" } }
    );

    if (!res.ok) {
      return { success: false, error: `Wikipedia API returned ${res.status}` };
    }

    const json = await res.json() as {
      query?: {
        search: Array<{
          title: string;
          snippet: string;
          pageid: number;
        }>;
      };
    };

    const results: WikiSearchResult[] = (json.query?.search ?? []).map((r) => ({
      title: r.title,
      snippet: r.snippet.replace(/<[^>]*>/g, ""),
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    }));

    return { success: true, data: results };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to search Wikipedia",
    };
  }
}

// ============================================================================
// SEARCH CLUBS FOR CAREER EDITOR
// ============================================================================

export interface ClubOption {
  id: string;
  name: string;
  countryCode: string | null;
}

export async function searchClubsForCareer(
  query: string
): Promise<ActionResult<ClubOption[]>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    if (query.length < 2) {
      return { success: true, data: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clubs, error } = await (supabase as any)
      .from("clubs")
      .select("id, name, country_code")
      .ilike("search_name", `%${query}%`)
      .is("canonical_club_id", null)
      .limit(20) as {
      data: Array<{ id: string; name: string; country_code: string | null }> | null;
      error: { message: string } | null;
    };

    if (error) {
      return { success: false, error: error.message };
    }

    const results: ClubOption[] = (clubs ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      countryCode: c.country_code,
    }));

    return { success: true, data: results };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to search clubs",
    };
  }
}

// ============================================================================
// SAVE PLAYER CAREER
// ============================================================================

export async function savePlayerCareer(
  playerQid: string,
  entries: Array<{
    clubQid: string;
    clubName: string;
    clubCountryCode: string | null;
    startYear: number | null;
    endYear: number | null;
  }>
): Promise<ActionResult<{ saved: number }>> {
  try {
    await ensureAdminWrite();
    const supabase = await createAdminClient();

    // Upsert clubs so FK constraint is satisfied
    if (entries.length > 0) {
      const clubRowsAll = entries.map((e) => ({
        id: e.clubQid,
        name: e.clubName,
        search_name: e.clubName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim(),
        country_code: e.clubCountryCode,
      }));
      const clubRows = [...new Map(clubRowsAll.map((c) => [c.id, c])).values()];

      const { error: clubError } = await supabase
        .from("clubs")
        .upsert(clubRows, { onConflict: "id" });

      if (clubError) {
        return { success: false, error: `Failed to upsert clubs: ${clubError.message}` };
      }
    }

    // Delete existing appearances for this player
    const { error: deleteError } = await supabase
      .from("player_appearances")
      .delete()
      .eq("player_id", playerQid);

    if (deleteError) {
      return { success: false, error: `Failed to clear existing appearances: ${deleteError.message}` };
    }

    // Insert new entries
    if (entries.length > 0) {
      const rows = entries.map((e) => ({
        player_id: playerQid,
        club_id: e.clubQid,
        start_year: e.startYear,
        end_year: e.endYear,
      }));

      const { error: insertError } = await supabase
        .from("player_appearances")
        .insert(rows);

      if (insertError) {
        return { success: false, error: `Failed to save career: ${insertError.message}` };
      }
    }

    // Clear mapping_status to remove from review queue
    const { error: updateError } = await supabase
      .from("players")
      .update({ mapping_status: null } as Record<string, unknown>)
      .eq("id", playerQid);

    if (updateError) {
      return { success: false, error: `Failed to update player status: ${updateError.message}` };
    }

    // Bump elite index version
    const { error: bumpError } = await supabase.rpc("bump_elite_index_version");
    if (bumpError) {
      console.error("[savePlayerCareer] version bump failed:", bumpError.message);
    }

    return { success: true, data: { saved: entries.length } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save player career",
    };
  }
}

// ============================================================================
// SKIP PLAYER
// ============================================================================

export async function skipPlayer(
  playerQid: string
): Promise<ActionResult> {
  try {
    await ensureAdminWrite();
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("players")
      .update({ mapping_status: "reviewed_skip" } as Record<string, unknown>)
      .eq("id", playerQid);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to skip player",
    };
  }
}
