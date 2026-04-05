"use server";

import { createAdminClient, ensureAdminWrite } from "@/lib/supabase/server";

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

  // Try unverified first (highest scout_rank)
  const { data: unverified } = await supabase
    .from("players")
    .select("id")
    .is("verified_at", null)
    .gte("scout_rank", 10)
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

  // Get current club (most recent open appearance)
  const { data: appearance } = await supabase
    .from("player_appearances")
    .select("id, club_id, start_year, clubs(name, league)")
    .eq("player_id", playerId)
    .is("end_year", null)
    .order("start_year", { ascending: false })
    .limit(1)
    .single();

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
  };
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
    .gte("scout_rank", 10);

  const { count: verified } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("scout_rank", 10)
    .gte("verified_at", threeMonthsAgo);

  const { count: unverified } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .gte("scout_rank", 10)
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
