"use server";

import { createAdminClient, ensureAdminWrite } from "@/lib/supabase/server";
import { normalizeClubName } from "@/lib/data-pipeline/map-external-ids";

// ============================================================================
// TYPES
// ============================================================================

export interface ValidatorPlayer {
  id: string;
  name: string;
  nationality_code: string | null;
  scout_rank: number;
  birth_year: number | null;
  position_category: string | null;
  verified_at: string | null;
  club_name: string | null;
  club_id: string | null;
  league: string | null;
  appearance_id: number | null;
  start_year: number | null;
  // Mismatch info (if any)
  mismatch_id: number | null;
  mismatch_api_club: string | null;
  // Wikipedia summary for quick verification
  wiki_extract: string | null;
}

export interface ValidationStats {
  total: number;
  verified: number;
  unverified: number;
  expired: number;
  mismatches: number;
}

export interface ClubSearchResult {
  id: string;
  name: string;
  league: string | null;
  country_code: string | null;
}

export interface PlayerSearchResult {
  id: string;
  name: string;
  nationality_code: string | null;
  scout_rank: number;
  birth_year: number | null;
  position_category: string | null;
}

export interface WikiBatchResult {
  processed: number;
  autoVerified: number;
  mismatched: number;
  noExtract: number;
  errors: number;
}

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// GET NEXT PLAYER TO VALIDATE
// ============================================================================

export async function getNextPlayerToValidate(
  skipPlayerIds: string[] = [],
): Promise<ActionResult<ValidatorPlayer>> {
  const supabase = await createAdminClient();

  // Build exclusion filter
  const skipFilter = skipPlayerIds.length > 0 ? skipPlayerIds : ["__none__"];

  // Priority 1: Players with unresolved mismatches
  const { data: mismatchPlayer } = await supabase
    .from("club_mismatches")
    .select("player_id, id, api_club_name")
    .is("resolved_at", null)
    .not("player_id", "in", `(${skipFilter.join(",")})`)
    .order("detected_at", { ascending: true })
    .limit(1)
    .single();

  if (mismatchPlayer?.player_id) {
    const player = await fetchPlayerDetails(
      supabase,
      mismatchPlayer.player_id,
    );
    if (player) {
      return {
        success: true,
        data: {
          ...player,
          mismatch_id: mismatchPlayer.id,
          mismatch_api_club: mismatchPlayer.api_club_name,
        },
      };
    }
  }

  // Priority 2 & 3: Unverified then expired, by scout_rank DESC
  return await getNextPlayerFallback(supabase, skipFilter);
}

async function getNextPlayerFallback(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  skipFilter: string[],
): Promise<ActionResult<ValidatorPlayer>> {
  const threeMonthsAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Try unverified first (highest scout_rank, born after 1985 to skip retired)
  const { data: unverified } = await supabase
    .from("players")
    .select("id")
    .is("verified_at", null)
    .gte("scout_rank", 10)
    .gte("birth_year", 1985)
    .not("id", "in", `(${skipFilter.join(",")})`)
    .order("scout_rank", { ascending: false })
    .limit(1)
    .single();

  if (unverified) {
    const player = await fetchPlayerDetails(supabase, unverified.id);
    if (player) {
      return {
        success: true,
        data: { ...player, mismatch_id: null, mismatch_api_club: null },
      };
    }
  }

  // Try expired
  const { data: expired } = await supabase
    .from("players")
    .select("id")
    .lt("verified_at", threeMonthsAgo)
    .gte("scout_rank", 10)
    .gte("birth_year", 1985)
    .not("id", "in", `(${skipFilter.join(",")})`)
    .order("scout_rank", { ascending: false })
    .limit(1)
    .single();

  if (expired) {
    const player = await fetchPlayerDetails(supabase, expired.id);
    if (player) {
      return {
        success: true,
        data: { ...player, mismatch_id: null, mismatch_api_club: null },
      };
    }
  }

  return { success: false, error: "No more players to validate" };
}

async function fetchPlayerDetails(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  playerId: string,
): Promise<Omit<ValidatorPlayer, "mismatch_id" | "mismatch_api_club"> | null> {
  const { data: player } = await supabase
    .from("players")
    .select(
      "id, name, nationality_code, scout_rank, birth_year, position_category, verified_at",
    )
    .eq("id", playerId)
    .single();

  if (!player) return null;

  // Get current club and Wikipedia summary in parallel
  const [appearanceResult, wikiExtract] = await Promise.all([
    supabase
      .from("player_appearances")
      .select("id, club_id, start_year, clubs(name, league)")
      .eq("player_id", playerId)
      .is("end_year", null)
      .order("start_year", { ascending: false })
      .limit(1)
      .single(),
    fetchWikipediaExtract(playerId),
  ]);

  const appearance = appearanceResult.data;
  const club = appearance?.clubs as { name: string; league: string | null } | null;

  return {
    id: player.id,
    name: player.name,
    nationality_code: player.nationality_code,
    scout_rank: player.scout_rank,
    birth_year: player.birth_year,
    position_category: player.position_category,
    verified_at: player.verified_at,
    club_name: club?.name ?? null,
    club_id: appearance?.club_id ?? null,
    league: club?.league ?? null,
    appearance_id: appearance?.id ?? null,
    start_year: appearance?.start_year ?? null,
    wiki_extract: wikiExtract,
  };
}

/**
 * Fetch the Wikipedia summary for a player via their Wikidata QID.
 * Uses Wikidata sitelinks → Wikipedia REST API (free, no key).
 * Returns the first ~2 sentences which usually mention current club.
 */
async function fetchWikipediaExtract(qid: string): Promise<string | null> {
  try {
    // Step 1: Get English Wikipedia title from Wikidata
    const wdUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=enwiki&format=json`;
    const wdRes = await fetch(wdUrl, {
      headers: { "User-Agent": "FootballIQ-Validator/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!wdRes.ok) return null;
    const wdJson = await wdRes.json();
    const title = wdJson.entities?.[qid]?.sitelinks?.enwiki?.title;
    if (!title) return null;

    // Step 2: Get Wikipedia summary
    const wpUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const wpRes = await fetch(wpUrl, {
      headers: { "User-Agent": "FootballIQ-Validator/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!wpRes.ok) return null;
    const wpJson = await wpRes.json();
    return wpJson.extract ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// VALIDATE PLAYER
// ============================================================================

export async function confirmPlayer(
  playerId: string,
  mismatchId: number | null,
): Promise<ActionResult> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();

  // Get current club info for the verified snapshot
  const { data: appearance } = await supabase
    .from("player_appearances")
    .select("clubs(name, league)")
    .eq("player_id", playerId)
    .is("end_year", null)
    .order("start_year", { ascending: false })
    .limit(1)
    .single();

  const club = appearance?.clubs as { name: string; league: string | null } | null;

  const { error } = await supabase
    .from("players")
    .update({
      verified_at: new Date().toISOString(),
      verified_club: club?.name ?? null,
      verified_league: club?.league ?? null,
    })
    .eq("id", playerId);

  if (error) return { success: false, error: error.message };

  // Resolve mismatch if present
  if (mismatchId) {
    await supabase
      .from("club_mismatches")
      .update({ resolved_at: new Date().toISOString(), resolved_action: "confirmed" })
      .eq("id", mismatchId);
  }

  return { success: true };
}

export async function fixPlayerClub(
  playerId: string,
  newClubId: string,
  newClubName: string,
  newLeague: string | null,
  mismatchId: number | null,
): Promise<ActionResult> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();

  // Close all open appearances for this player
  const { error: closeError } = await supabase
    .from("player_appearances")
    .update({ end_year: new Date().getFullYear() })
    .eq("player_id", playerId)
    .is("end_year", null);

  if (closeError) return { success: false, error: closeError.message };

  // Create new appearance
  const { error: insertError } = await supabase
    .from("player_appearances")
    .insert({
      player_id: playerId,
      club_id: newClubId,
      start_year: new Date().getFullYear(),
    });

  if (insertError) return { success: false, error: insertError.message };

  // Update club league if provided
  if (newLeague) {
    await supabase
      .from("clubs")
      .update({ league: newLeague })
      .eq("id", newClubId);
  }

  // Mark player as verified
  const { error: verifyError } = await supabase
    .from("players")
    .update({
      verified_at: new Date().toISOString(),
      verified_club: newClubName,
      verified_league: newLeague,
    })
    .eq("id", playerId);

  if (verifyError) return { success: false, error: verifyError.message };

  // Resolve mismatch if present
  if (mismatchId) {
    await supabase
      .from("club_mismatches")
      .update({ resolved_at: new Date().toISOString(), resolved_action: "fixed" })
      .eq("id", mismatchId);
  }

  return { success: true };
}

/**
 * Mark player as having no current club (retired/free agent).
 * Closes all open appearances and marks as verified.
 */
export async function markNoClub(
  playerId: string,
  mismatchId: number | null,
): Promise<ActionResult> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();

  // Close all open appearances
  await supabase
    .from("player_appearances")
    .update({ end_year: new Date().getFullYear() })
    .eq("player_id", playerId)
    .is("end_year", null);

  // Mark verified with no club
  const { error } = await supabase
    .from("players")
    .update({
      verified_at: new Date().toISOString(),
      verified_club: null,
      verified_league: null,
    })
    .eq("id", playerId);

  if (error) return { success: false, error: error.message };

  if (mismatchId) {
    await supabase
      .from("club_mismatches")
      .update({ resolved_at: new Date().toISOString(), resolved_action: "no_club" })
      .eq("id", mismatchId);
  }

  return { success: true };
}

/**
 * Delete a player and all related data.
 */
export async function deletePlayer(
  playerId: string,
): Promise<ActionResult> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();

  // Delete in dependency order
  await supabase.from("club_mismatches").delete().eq("player_id", playerId);
  await supabase.from("player_achievements").delete().eq("player_id", playerId);
  await supabase.from("player_appearances").delete().eq("player_id", playerId);
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fixPlayerNationality(
  playerId: string,
  nationalityCode: string,
): Promise<ActionResult> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("players")
    .update({ nationality_code: nationalityCode })
    .eq("id", playerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================================
// SEARCH CLUBS
// ============================================================================

export async function searchClubs(
  query: string,
): Promise<ClubSearchResult[]> {
  if (query.length < 2) return [];

  const supabase = await createAdminClient();
  const sanitized = query
    .toLowerCase()
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  const { data } = await supabase
    .from("clubs")
    .select("id, name, league, country_code")
    .ilike("search_name", `%${sanitized}%`)
    .order("name")
    .limit(15);

  return data ?? [];
}

// ============================================================================
// VALIDATION STATS
// ============================================================================

export async function getValidationStats(): Promise<ActionResult<ValidationStats>> {
  const supabase = await createAdminClient();
  const threeMonthsAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { count: total } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("scout_rank", 10)
    .gte("birth_year", 1985);

  const { count: verified } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("scout_rank", 10)
    .gte("birth_year", 1985)
    .gte("verified_at", threeMonthsAgo);

  const { count: unverified } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("scout_rank", 10)
    .gte("birth_year", 1985)
    .is("verified_at", null);

  const { count: mismatches } = await supabase
    .from("club_mismatches")
    .select("*", { count: "exact", head: true })
    .is("resolved_at", null);

  const totalNum = total ?? 0;
  const verifiedNum = verified ?? 0;
  const unverifiedNum = unverified ?? 0;
  const mismatchNum = mismatches ?? 0;

  return {
    success: true,
    data: {
      total: totalNum,
      verified: verifiedNum,
      unverified: unverifiedNum,
      expired: totalNum - verifiedNum - unverifiedNum,
      mismatches: mismatchNum,
    },
  };
}

// ============================================================================
// PLAYER SEARCH
// ============================================================================

export async function searchPlayersForValidation(
  query: string,
): Promise<PlayerSearchResult[]> {
  if (query.length < 2) return [];

  const supabase = await createAdminClient();
  const sanitized = query
    .toLowerCase()
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  const { data } = await supabase
    .from("players")
    .select("id, name, nationality_code, scout_rank, birth_year, position_category")
    .ilike("search_name", `%${sanitized}%`)
    .order("scout_rank", { ascending: false })
    .limit(15);

  return data ?? [];
}

export async function getPlayerForValidation(
  playerId: string,
): Promise<ActionResult<ValidatorPlayer>> {
  const supabase = await createAdminClient();

  const player = await fetchPlayerDetails(supabase, playerId);
  if (!player) return { success: false, error: "Player not found" };

  // Check for open mismatch
  const { data: mismatch } = await supabase
    .from("club_mismatches")
    .select("id, api_club_name")
    .eq("player_id", playerId)
    .is("resolved_at", null)
    .limit(1)
    .single();

  return {
    success: true,
    data: {
      ...player,
      mismatch_id: mismatch?.id ?? null,
      mismatch_api_club: mismatch?.api_club_name ?? null,
    },
  };
}

// ============================================================================
// BATCH VERIFICATION
// ============================================================================

const CLUB_EXTRACT_REGEX =
  /(?:plays?|playing)\s+(?:as\s+.*?\s+)?for\s+(.+?)(?:\s+in\s+|\s+of\s+the\s+|\.\s|,\s|\s+and\s+the\s+)/i;

function normalizeForMatch(name: string): string {
  return normalizeClubName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clubNamesMatch(a: string, b: string): boolean {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export async function runWikipediaBatchVerification(options: {
  batchSize?: number;
  minScoutRank?: number;
}): Promise<ActionResult<WikiBatchResult>> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();
  const batchSize = options.batchSize ?? 50;
  const minRank = options.minScoutRank ?? 10;

  // Get unverified players
  const { data: players, error: fetchErr } = await supabase
    .from("players")
    .select("id, name")
    .is("verified_at", null)
    .gte("scout_rank", minRank)
    .gte("birth_year", 1985)
    .order("scout_rank", { ascending: false })
    .limit(batchSize);

  if (fetchErr || !players) {
    return { success: false, error: fetchErr?.message ?? "No players found" };
  }

  const result: WikiBatchResult = {
    processed: players.length,
    autoVerified: 0,
    mismatched: 0,
    noExtract: 0,
    errors: 0,
  };

  // Process in small parallel batches of 5
  for (let i = 0; i < players.length; i += 5) {
    const batch = players.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map((p) => verifyOnePlayer(supabase, p.id, p.name)),
    );

    for (const r of results) {
      if (r.status === "rejected") {
        result.errors++;
      } else {
        switch (r.value) {
          case "verified":
            result.autoVerified++;
            break;
          case "mismatched":
            result.mismatched++;
            break;
          case "no_extract":
            result.noExtract++;
            break;
          case "error":
            result.errors++;
            break;
        }
      }
    }

    // Rate limit between batches
    if (i + 5 < players.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { success: true, data: result };
}

async function verifyOnePlayer(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  playerId: string,
  playerName: string,
): Promise<"verified" | "mismatched" | "no_extract" | "error"> {
  try {
    // Get current club
    const { data: appearance } = await supabase
      .from("player_appearances")
      .select("clubs(name, league)")
      .eq("player_id", playerId)
      .is("end_year", null)
      .order("start_year", { ascending: false })
      .limit(1)
      .single();

    const club = appearance?.clubs as { name: string; league: string | null } | null;
    if (!club?.name) return "no_extract";

    // Get Wikipedia extract
    const extract = await fetchWikipediaExtract(playerId);
    if (!extract) return "no_extract";

    // Parse club from extract
    const match = extract.match(CLUB_EXTRACT_REGEX);
    if (!match?.[1]) return "no_extract";

    const extractedClub = match[1].trim();

    // Compare
    if (clubNamesMatch(extractedClub, club.name)) {
      // Auto-verify
      await supabase
        .from("players")
        .update({
          verified_at: new Date().toISOString(),
          verified_club: club.name,
          verified_league: club.league,
        })
        .eq("id", playerId);
      return "verified";
    }

    return "mismatched";
  } catch {
    return "error";
  }
}

export async function bulkTrustWikidata(
  maxScoutRank: number,
): Promise<ActionResult<{ verified: number }>> {
  await ensureAdminWrite();
  const supabase = await createAdminClient();

  // Get unverified players below threshold with current clubs
  const { data: players, error: fetchErr } = await supabase
    .from("players")
    .select("id")
    .is("verified_at", null)
    .lt("scout_rank", maxScoutRank)
    .gte("birth_year", 1985);

  if (fetchErr || !players) {
    return { success: false, error: fetchErr?.message ?? "No players found" };
  }

  let verified = 0;

  // Process in batches of 100
  for (let i = 0; i < players.length; i += 100) {
    const batch = players.slice(i, i + 100);
    const ids = batch.map((p) => p.id);

    // Get current clubs for these players
    const { data: appearances } = await supabase
      .from("player_appearances")
      .select("player_id, clubs(name, league)")
      .in("player_id", ids)
      .is("end_year", null);

    const clubMap = new Map<string, { name: string; league: string | null }>();
    for (const a of appearances ?? []) {
      const club = a.clubs as { name: string; league: string | null } | null;
      if (club) clubMap.set(a.player_id, club);
    }

    // Update each player
    for (const id of ids) {
      const club = clubMap.get(id);
      const { error } = await supabase
        .from("players")
        .update({
          verified_at: new Date().toISOString(),
          verified_club: club?.name ?? null,
          verified_league: club?.league ?? null,
        })
        .eq("id", id);

      if (!error) verified++;
    }
  }

  return { success: true, data: { verified } };
}
