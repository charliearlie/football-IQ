"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, ensureAdmin, ensureAdminWrite } from "@/lib/supabase/server";
import type { ActionResult } from "../actions";

// ============================================================================
// TYPES
// ============================================================================

export interface ClubInfo {
  id: string;
  name: string;
  playerCount: number;
  apiFootballId: number | null;
  canonicalClubId: string | null;
}

export interface DuplicateGroup {
  normalizedName: string;
  countryCode: string | null;
  clubs: ClubInfo[];
}

export interface DuplicateGroupsResult {
  groups: DuplicateGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface MergeResult {
  mergedCount: number;
  appearancesReassigned: number;
}

export interface BulkMergeResult {
  totalGroupsMerged: number;
  totalClubsMerged: number;
  totalAppearancesReassigned: number;
  errors: string[];
}

export interface ClubSearchResult {
  id: string;
  name: string;
  searchName: string;
  countryCode: string | null;
  playerCount: number;
  apiFootballId: number | null;
  canonicalClubId: string | null;
}

export interface DataQualityStats {
  totalClubs: number;
  totalPlayers: number;
  totalAppearances: number;
  clubsByPlayerCount: {
    zero: number;
    one: number;
    twoToFive: number;
    sixToTwenty: number;
    twentyOneToFifty: number;
    fiftyPlus: number;
  };
  playersMissingNationality: number;
  playersMissingPosition: number;
  playersMissingBirthYear: number;
  clubsWithCanonical: number;
  clubsWithoutCanonical: number;
  remainingDuplicateGroups: number;
}

// ============================================================================
// HELPERS
// ============================================================================

// Row shape for club queries that include columns not yet in generated types
interface ClubRow {
  id: string;
  name: string;
  search_name: string;
  country_code: string | null;
  api_football_id: number | null;
  canonical_club_id: string | null;
}

/**
 * Normalize a club search_name for duplicate detection.
 * Strips common club-type abbreviations (FC, F.C., AFC, SC, etc.) from
 * anywhere in the name, collapses whitespace, and lowercases.
 */
function normalizeClubName(searchName: string): string {
  return searchName
    .replace(/\b(f\.?c\.?|a\.?f\.?c\.?|s\.?c\.?|c\.?f\.?|s\.?s\.?c\.?|r\.?c\.?d?\.?|u\.?s\.?|a\.?c\.?|c\.?d\.?|u\.?d\.?|s\.?d\.?|b\.?s\.?c\.?|b\.?v\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[. ]+|[. ]+$/g, "")
    .toLowerCase();
}

// ============================================================================
// GET DUPLICATE GROUPS
// ============================================================================

export async function getDuplicateGroups(
  page: number,
  pageSize: number
): Promise<ActionResult<DuplicateGroupsResult>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    // Use RPC function that does grouping + counting in SQL (avoids JS client row limits)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (supabase.rpc as any)(
      "get_duplicate_club_groups"
    );

    if (error) {
      return { success: false, error: (error as { message: string }).message };
    }

    const allGroups: DuplicateGroup[] = (
      rows as Array<{
        normalized_name: string;
        country_code: string | null;
        clubs: ClubInfo[];
      }>
    ).map((row) => ({
      normalizedName: row.normalized_name,
      countryCode: row.country_code,
      clubs: row.clubs,
    }));

    // Paginate
    const totalCount = allGroups.length;
    const start = (page - 1) * pageSize;
    const paginatedGroups = allGroups.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        groups: paginatedGroups,
        totalCount,
        page,
        pageSize,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch duplicate groups",
    };
  }
}

// ============================================================================
// MERGE CLUB GROUP
// ============================================================================

export async function mergeClubGroup(
  canonicalId: string,
  duplicateIds: string[],
  displayName?: string
): Promise<ActionResult<MergeResult>> {
  try {
    await ensureAdminWrite();
    const supabase = await createAdminClient();

    let totalAppearancesReassigned = 0;

    for (const duplicateId of duplicateIds) {
      // Reassign player_appearances from duplicate to canonical
      const { data: updated, error: updateError } = await supabase
        .from("player_appearances")
        .update({ club_id: canonicalId })
        .eq("club_id", duplicateId)
        .select("player_id");

      if (updateError) {
        return {
          success: false,
          error: `Failed to reassign appearances for ${duplicateId}: ${updateError.message}`,
        };
      }

      totalAppearancesReassigned += updated?.length ?? 0;

      // Mark duplicate club with canonical_club_id
      const { error: mergeError } = await supabase
        .from("clubs")
        .update({ canonical_club_id: canonicalId } as Record<string, unknown>)
        .eq("id", duplicateId);

      if (mergeError) {
        return {
          success: false,
          error: `Failed to set canonical for ${duplicateId}: ${mergeError.message}`,
        };
      }
    }

    // Set display_name on canonical club if provided
    if (displayName) {
      const { error: nameError } = await supabase
        .from("clubs")
        .update({ display_name: displayName } as Record<string, unknown>)
        .eq("id", canonicalId);

      if (nameError) {
        return {
          success: false,
          error: `Failed to set display name: ${nameError.message}`,
        };
      }
    }

    // Bump elite index version so mobile clients pick up changes
    const { error: bumpError } = await supabase.rpc("bump_elite_index_version");
    if (bumpError) {
      console.error("[mergeClubGroup] version bump failed:", bumpError.message);
    }

    // Log to agent_runs
    try {
      await supabase.from("agent_runs").insert({
        run_date: new Date().toISOString().split("T")[0],
        agent_name: "club_merger",
        status: "success",
        puzzles_created: 0,
        logs: {
          canonical_id: canonicalId,
          duplicate_ids: duplicateIds,
          appearances_reassigned: totalAppearancesReassigned,
          display_name: displayName ?? null,
        },
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/admin/club-merge");

    return {
      success: true,
      data: {
        mergedCount: duplicateIds.length,
        appearancesReassigned: totalAppearancesReassigned,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to merge club group",
    };
  }
}

// ============================================================================
// BULK MERGE GROUPS
// ============================================================================

export async function bulkMergeGroups(
  groups: Array<{ canonicalId: string; duplicateIds: string[]; displayName?: string }>
): Promise<ActionResult<BulkMergeResult>> {
  try {
    await ensureAdminWrite();

    let totalGroupsMerged = 0;
    let totalClubsMerged = 0;
    let totalAppearancesReassigned = 0;
    const errors: string[] = [];

    for (const group of groups) {
      const result = await mergeClubGroup(
        group.canonicalId,
        group.duplicateIds,
        group.displayName
      );

      if (result.success && result.data) {
        totalGroupsMerged++;
        totalClubsMerged += result.data.mergedCount;
        totalAppearancesReassigned += result.data.appearancesReassigned;
      } else {
        errors.push(
          `Group ${group.canonicalId}: ${result.error ?? "Unknown error"}`
        );
      }
    }

    return {
      success: true,
      data: {
        totalGroupsMerged,
        totalClubsMerged,
        totalAppearancesReassigned,
        errors,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to bulk merge groups",
    };
  }
}

// ============================================================================
// SEARCH CLUBS
// ============================================================================

export async function searchClubs(
  query: string
): Promise<ActionResult<ClubSearchResult[]>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clubs, error: clubsError } = await (supabase as any)
      .from("clubs")
      .select("id, name, search_name, country_code, api_football_id, canonical_club_id")
      .ilike("search_name", `%${query}%`)
      .limit(50) as { data: ClubRow[] | null; error: { message: string } | null };

    if (clubsError) {
      return { success: false, error: clubsError.message };
    }

    // Get player counts for matched clubs
    const clubIds = (clubs ?? []).map((c) => c.id);
    if (clubIds.length === 0) {
      return { success: true, data: [] };
    }

    // Max 50 clubs * ~400 appearances each = ~20k rows; raise limit from default 1000
    const { data: appearances, error: appError } = await supabase
      .from("player_appearances")
      .select("club_id")
      .in("club_id", clubIds)
      .limit(25000);

    if (appError) {
      return { success: false, error: appError.message };
    }

    const playerCountMap = new Map<string, number>();
    for (const app of appearances ?? []) {
      playerCountMap.set(app.club_id, (playerCountMap.get(app.club_id) ?? 0) + 1);
    }

    const results: ClubSearchResult[] = (clubs ?? [])
      .map((c) => ({
        id: c.id,
        name: c.name,
        searchName: c.search_name,
        countryCode: c.country_code,
        playerCount: playerCountMap.get(c.id) ?? 0,
        apiFootballId: c.api_football_id,
        canonicalClubId: c.canonical_club_id,
      }))
      .sort((a, b) => b.playerCount - a.playerCount);

    return { success: true, data: results };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to search clubs",
    };
  }
}

// ============================================================================
// DATA QUALITY STATS
// ============================================================================

export async function getDataQualityStats(): Promise<
  ActionResult<DataQualityStats>
> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    // Total counts
    const [clubsRes, playersRes, appearancesRes] = await Promise.all([
      supabase.from("clubs").select("id", { count: "exact", head: true }),
      supabase.from("players").select("id", { count: "exact", head: true }),
      supabase
        .from("player_appearances")
        .select("player_id", { count: "exact", head: true }),
    ]);

    const totalClubs = clubsRes.count ?? 0;
    const totalPlayers = playersRes.count ?? 0;
    const totalAppearances = appearancesRes.count ?? 0;

    // Club distribution via RPC (avoids fetching all 62k appearances in JS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: distRows } = await (supabase.rpc as any)("get_club_player_distribution");
    const distMap = new Map<string, number>();
    for (const row of (distRows as Array<{ bucket: string; club_count: number }>) ?? []) {
      distMap.set(row.bucket, Number(row.club_count));
    }

    // Players missing data + canonical counts (all use count-only queries)
    const [missingNat, missingPos, missingBirth, withCanonical, withoutCanonical] =
      await Promise.all([
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .is("nationality_code", null),
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .is("position_category", null),
        supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .is("birth_year", null),
        supabase
          .from("clubs")
          .select("id", { count: "exact", head: true })
          .not("canonical_club_id", "is", null),
        supabase
          .from("clubs")
          .select("id", { count: "exact", head: true })
          .is("canonical_club_id", null),
      ]);

    // Remaining duplicate groups via the RPC we already have
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dupRows } = await (supabase.rpc as any)("get_duplicate_club_groups");
    const remainingDuplicateGroups = (dupRows as unknown[])?.length ?? 0;

    return {
      success: true,
      data: {
        totalClubs,
        totalPlayers,
        totalAppearances,
        clubsByPlayerCount: {
          zero: distMap.get("zero") ?? 0,
          one: distMap.get("one") ?? 0,
          twoToFive: distMap.get("twoToFive") ?? 0,
          sixToTwenty: distMap.get("sixToTwenty") ?? 0,
          twentyOneToFifty: distMap.get("twentyOneToFifty") ?? 0,
          fiftyPlus: distMap.get("fiftyPlus") ?? 0,
        },
        playersMissingNationality: missingNat.count ?? 0,
        playersMissingPosition: missingPos.count ?? 0,
        playersMissingBirthYear: missingBirth.count ?? 0,
        clubsWithCanonical: withCanonical.count ?? 0,
        clubsWithoutCanonical: withoutCanonical.count ?? 0,
        remainingDuplicateGroups,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to fetch data quality stats",
    };
  }
}
