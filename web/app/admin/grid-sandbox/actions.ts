"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { syncPlayerAchievements } from "@/app/(dashboard)/player-scout/actions";
import { checkGridCell } from "./_lib/gridValidation";
import {
  TROPHY_TO_STATS_KEY,
  GRID_TROPHY_POOL,
  GRID_STAT_POOL,
  STAT_PATTERN,
  STAT_NAME_TO_KEY,
} from "./_lib/achievementMapping";
import {
  COUNTRY_NAME_TO_CODE,
  CODE_TO_COUNTRY_NAME,
} from "./_lib/types";
import type {
  GridCategory,
  GeneratedGrid,
  CellSolvability,
  RarityPlayer,
  AutocompletePlayer,
  CellValidationResult,
  PoolDebugInfo,
} from "./_lib/types";

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Type alias for Supabase query builder used by fetchAllRows
type PostgrestQueryBuilder<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
};

// ============================================================================
// ACTION 1: Search Players (Zero-Spoiler)
// ============================================================================

export async function searchPlayers(
  query: string
): Promise<ActionResult<AutocompletePlayer[]>> {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("players")
      .select(
        "id, name, scout_rank, nationality_code, position_category, birth_year"
      )
      .ilike("search_name", `%${query.toLowerCase()}%`)
      .order("scout_rank", { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    const results: AutocompletePlayer[] = (data ?? []).map((p) => ({
      qid: p.id,
      name: p.name,
      scoutRank: p.scout_rank ?? 0,
      nationalityCode: p.nationality_code,
      positionCategory: p.position_category,
      birthYear: p.birth_year,
    }));

    return { success: true, data: results };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// ACTION 2: Validate Cell (Relational Triangle)
// ============================================================================

export async function validateCell(
  playerQid: string,
  criteriaA: GridCategory,
  criteriaB: GridCategory
): Promise<
  ActionResult<CellValidationResult & { statsCache?: Record<string, number> }>
> {
  try {
    const supabase = await createAdminClient();

    const result = await checkGridCell(
      supabase,
      playerQid,
      criteriaA,
      criteriaB
    );

    // Also fetch stats_cache for debugging
    // Note: stats_cache not in generated types yet, cast through unknown
    const { data: player } = (await supabase
      .from("players")
      .select("stats_cache")
      .eq("id", playerQid)
      .single()) as { data: { stats_cache: Record<string, number> | null } | null };

    return {
      success: true,
      data: {
        ...result,
        statsCache: (player?.stats_cache as Record<string, number>) ?? undefined,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// ACTION 3: Get Valid Players for Cell (with Rarity Scoring)
// ============================================================================

export async function getValidPlayersForCell(
  criteriaA: GridCategory,
  criteriaB: GridCategory
): Promise<ActionResult<RarityPlayer[]>> {
  try {
    const supabase = await createAdminClient();

    // Start with a base query depending on the category types
    // Strategy: find the most restrictive criterion first, then filter
    const candidates = await findCandidates(supabase, criteriaA, criteriaB);

    if (!candidates.length) {
      return { success: true, data: [] };
    }

    // Compute rarity scores
    const maxRank = Math.max(...candidates.map((p) => p.scoutRank), 1);
    const withRarity: RarityPlayer[] = candidates.map((p) => ({
      ...p,
      rarityScore: Math.round(100 - (p.scoutRank / maxRank) * 100),
    }));

    // Sort by rarity descending (most obscure first)
    withRarity.sort((a, b) => b.rarityScore - a.rarityScore);

    return { success: true, data: withRarity };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Find all players matching both criteria. */
async function findCandidates(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  criteriaA: GridCategory,
  criteriaB: GridCategory
): Promise<Omit<RarityPlayer, "rarityScore">[]> {
  const setA = await getPlayerIdsForCriterion(supabase, criteriaA);
  const setB = await getPlayerIdsForCriterion(supabase, criteriaB);

  if (!setA?.length || !setB?.length) return [];

  // Use Set for fast intersection
  const smaller = setA.length <= setB.length ? setA : setB;
  const larger = new Set(setA.length <= setB.length ? setB : setA);
  const intersection = smaller.filter((id) => larger.has(id));
  if (!intersection.length) return [];

  // Fetch player details — limit to 100 for the rarity leaderboard
  const batch = intersection.slice(0, 100);
  const { data: players } = await supabase
    .from("players")
    .select(
      "id, name, scout_rank, nationality_code, position_category, birth_year"
    )
    .in("id", batch);

  return (players ?? []).map((p) => ({
    qid: p.id,
    name: p.name,
    scoutRank: p.scout_rank ?? 0,
    nationalityCode: p.nationality_code,
    positionCategory: p.position_category,
    birthYear: p.birth_year,
  }));
}

/**
 * Count how many players match both criteria (fast solvability check).
 * Returns count without fetching full player details.
 */
async function countCandidates(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  criteriaA: GridCategory,
  criteriaB: GridCategory
): Promise<number> {
  const setA = await getPlayerIdsForCriterion(supabase, criteriaA);
  const setB = await getPlayerIdsForCriterion(supabase, criteriaB);

  if (!setA?.length || !setB?.length) return 0;

  const smaller = setA.length <= setB.length ? setA : setB;
  const larger = new Set(setA.length <= setB.length ? setB : setA);
  return smaller.filter((id) => larger.has(id)).length;
}

/**
 * Load all player stats_cache into a Map.
 * Returns a fresh Map each time - callers should cache within their request scope if needed.
 */
async function loadStatsCacheMap(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<Map<string, Record<string, number>>> {
  // Note: stats_cache not in generated types yet, cast through unknown
  const { data } = (await supabase
    .from("players")
    .select("id, stats_cache")
    .not("stats_cache", "is", null)
    .limit(10000)) as { data: Array<{ id: string; stats_cache: Record<string, number> | null }> | null };

  const map = new Map<string, Record<string, number>>();
  for (const p of data ?? []) {
    const cache = p.stats_cache;
    if (cache && typeof cache === "object" && Object.keys(cache).length > 0) {
      map.set(p.id, cache);
    }
  }
  return map;
}

/** Get all player QIDs matching a single criterion. */
async function getPlayerIdsForCriterion(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  criterion: GridCategory
): Promise<string[]> {
  switch (criterion.type) {
    case "club": {
      // Use partial match so "FC Barcelona" matches "Futbol Club Barcelona"
      const { data: clubs } = await supabase
        .from("clubs")
        .select("id")
        .ilike("name", `%${criterion.value}%`)
        .limit(1);

      if (!clubs?.length) return [];

      const clubId = clubs[0].id;
      const appearances = await fetchAllRows<{ player_id: string }>(
        () => supabase.from("player_appearances").select("player_id").eq("club_id", clubId) as PostgrestQueryBuilder<{ player_id: string }>
      );

      return appearances.map((a) => a.player_id);
    }

    case "nation": {
      const code = COUNTRY_NAME_TO_CODE[criterion.value];
      if (!code) return [];

      const players = await fetchAllRows<{ id: string }>(
        () => supabase.from("players").select("id").eq("nationality_code", code) as PostgrestQueryBuilder<{ id: string }>
      );

      return players.map((p) => p.id);
    }

    case "trophy": {
      const key = TROPHY_TO_STATS_KEY[criterion.value];
      if (!key) return [];

      // Use in-memory stats_cache map for reliable JSONB filtering
      const cacheMap = await loadStatsCacheMap(supabase);
      const results: string[] = [];
      for (const [id, cache] of cacheMap) {
        if ((cache[key] ?? 0) > 0) results.push(id);
      }
      return results;
    }

    case "stat": {
      const match = STAT_PATTERN.exec(criterion.value);
      if (!match) return [];

      const threshold = parseInt(match[1], 10);
      const statName = match[2].toLowerCase().trim();
      const key = STAT_NAME_TO_KEY[statName];
      if (!key) return [];

      const cacheMap = await loadStatsCacheMap(supabase);
      const results: string[] = [];
      for (const [id, cache] of cacheMap) {
        if ((cache[key] ?? 0) >= threshold) results.push(id);
      }
      return results;
    }

    default:
      return [];
  }
}

// ============================================================================
// ACTION 4: Generate Grid
// ============================================================================

export type GridMode = "mixed" | "clubs-nations";

export async function generateGrid(
  mode: GridMode = "mixed"
): Promise<
  ActionResult<{
    grid: GeneratedGrid;
    solvability: CellSolvability[];
    debug: PoolDebugInfo;
  }>
> {
  try {
    const supabase = await createAdminClient();

    // Step 1: Build category pools
    const clubPool = await buildClubPool(supabase);
    const nationPool = await buildNationPool(supabase);
    const trophyPool =
      mode === "clubs-nations" ? [] : await buildTrophyPool(supabase);
    const statPool = mode === "clubs-nations" ? [] : [...GRID_STAT_POOL];

    const debug: PoolDebugInfo = {
      clubs: clubPool.length,
      nations: nationPool.length,
      trophies: trophyPool.length,
      stats: statPool.length,
      attempts: 0,
    };

    if (clubPool.length < 2 && nationPool.length < 2) {
      return {
        success: false,
        error: `Not enough data to generate grid. Pools: ${clubPool.length} clubs, ${nationPool.length} nations, ${trophyPool.length} trophies`,
      };
    }

    // Step 2: Try to generate a valid grid (up to 20 attempts)
    for (let attempt = 0; attempt < 20; attempt++) {
      debug.attempts = attempt + 1;
      const categories = pickCategories(
        clubPool,
        nationPool,
        trophyPool,
        statPool
      );
      if (!categories) continue;

      const { xAxis, yAxis } = categories;

      // Step 3: Verify solvability using fast count check
      const solvability: CellSolvability[] = [];
      let allSolvable = true;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const cellIndex = row * 3 + col;
          const rowCat = yAxis[row];
          const colCat = xAxis[col];

          const count = await countCandidates(supabase, rowCat, colCat);

          solvability.push({
            cellIndex,
            row: rowCat,
            col: colCat,
            playerCount: count,
          });

          if (count === 0) {
            allSolvable = false;
            break;
          }
        }
        if (!allSolvable) break;
      }

      if (allSolvable) {
        const grid: GeneratedGrid = {
          xAxis: xAxis as [GridCategory, GridCategory, GridCategory],
          yAxis: yAxis as [GridCategory, GridCategory, GridCategory],
          cellCounts: solvability.map((s) => s.playerCount),
        };
        return { success: true, data: { grid, solvability, debug } };
      }
    }

    return {
      success: false,
      error: `Could not generate a solvable grid after ${debug.attempts} attempts. Pools: ${debug.clubs} clubs, ${debug.nations} nations, ${debug.trophies} trophies`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Paginate through all rows of a Supabase table query.
 * PostgREST silently caps results at its `max_rows` config (often 1000),
 * regardless of the `.limit()` value. This helper re-creates the query
 * for each page via a factory function to avoid stale builder state.
 */
async function fetchAllRows<T>(
  queryFactory: () => { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }> },
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await queryFactory().range(offset, offset + pageSize - 1);
    if (error || !data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/** Build a pool of clubs with sufficient player data. */
async function buildClubPool(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<GridCategory[]> {
  // Paginate through all clubs (IDs are strings — Wikidata QIDs)
  const clubs = await fetchAllRows<{ id: string; name: string }>(
    () => supabase.from("clubs").select("id, name") as PostgrestQueryBuilder<{ id: string; name: string }>
  );

  if (!clubs.length) return [];

  // Paginate through all appearances
  const appearances = await fetchAllRows<{ club_id: string; player_id: string }>(
    () => supabase.from("player_appearances").select("club_id, player_id") as PostgrestQueryBuilder<{ club_id: string; player_id: string }>
  );

  if (!appearances.length) {
    return clubs.slice(0, 40).map((c) => ({
      type: "club" as const,
      value: c.name,
    }));
  }

  // Count distinct players per club (use Set for dedup)
  const clubPlayers: Record<string, Set<string>> = {};
  for (const a of appearances) {
    if (!clubPlayers[a.club_id]) clubPlayers[a.club_id] = new Set();
    clubPlayers[a.club_id].add(a.player_id);
  }

  // Build name lookup
  const clubNameById: Record<string, string> = {};
  for (const c of clubs) {
    clubNameById[c.id] = c.name;
  }

  // Sort by player count descending, pick top 40 with 5+ distinct players
  return Object.entries(clubPlayers)
    .map(([id, players]) => ({ id, count: players.size }))
    .filter(({ count }) => count >= 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
    .filter(({ id }) => clubNameById[id])
    .map(({ id }) => ({
      type: "club" as const,
      value: clubNameById[id],
    }));
}

/** Build a pool of nations with players. */
async function buildNationPool(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<GridCategory[]> {
  // Paginate through all players to count by nationality
  const players = await fetchAllRows<{ nationality_code: string | null }>(
    () => supabase.from("players").select("nationality_code").not("nationality_code", "is", null) as PostgrestQueryBuilder<{ nationality_code: string | null }>
  );

  if (!players.length) return [];

  const counts: Record<string, number> = {};
  for (const p of players) {
    const code = p.nationality_code;
    if (code) counts[code] = (counts[code] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([code]) => ({
      type: "nation" as const,
      value: CODE_TO_COUNTRY_NAME[code] ?? code,
    }))
    .filter((c) => {
      return COUNTRY_NAME_TO_CODE[c.value] !== undefined;
    });
}

/** Build a pool of trophies that have at least 1 player. */
async function buildTrophyPool(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<GridCategory[]> {
  const cacheMap = await loadStatsCacheMap(supabase);

  if (!cacheMap.size) return [];

  // Collect which stats_cache keys exist across all players
  const availableKeys = new Set<string>();
  for (const cache of cacheMap.values()) {
    for (const [key, val] of Object.entries(cache)) {
      if (typeof val === "number" && val > 0) availableKeys.add(key);
    }
  }

  return GRID_TROPHY_POOL.filter((name) => {
    const key = TROPHY_TO_STATS_KEY[name];
    return key && availableKeys.has(key);
  }).map((name) => ({
    type: "trophy" as const,
    value: name,
  }));
}

/**
 * Pick 6 categories (3 per axis).
 *
 * Strategy: guarantee at least 4 clubs/nations (high overlap),
 * mix in at most 2 trophy/stat categories.
 */
function pickCategories(
  clubs: GridCategory[],
  nations: GridCategory[],
  trophies: GridCategory[],
  stats: string[]
): { xAxis: GridCategory[]; yAxis: GridCategory[] } | null {
  // Shuffle helper
  const shuffle = <T>(arr: T[]): T[] =>
    [...arr].sort(() => Math.random() - 0.5);

  const shuffledClubs = shuffle(clubs);
  const shuffledNations = shuffle(nations);
  const shuffledTrophies = shuffle(trophies);
  const shuffledStats = shuffle(stats).map(
    (s) => ({ type: "stat" as const, value: s })
  );

  // High-overlap pool: clubs + nations
  const highOverlap = shuffle([...shuffledClubs, ...shuffledNations]);

  // Low-overlap pool: trophies + stats
  const lowOverlap = shuffle([
    ...shuffledTrophies,
    ...shuffledStats,
  ]);

  // Pick 4-5 from high-overlap, 1-2 from low-overlap
  const lowCount = lowOverlap.length > 0 ? (Math.random() > 0.5 ? 2 : 1) : 0;
  const highCount = 6 - lowCount;

  const picked: GridCategory[] = [];
  const usedValues = new Set<string>();

  // Pick from high-overlap pool
  for (const cat of highOverlap) {
    if (picked.length >= highCount) break;
    if (usedValues.has(cat.value)) continue;
    picked.push(cat);
    usedValues.add(cat.value);
  }

  // Pick from low-overlap pool
  for (const cat of lowOverlap) {
    if (picked.length >= 6) break;
    if (usedValues.has(cat.value)) continue;
    picked.push(cat);
    usedValues.add(cat.value);
  }

  // Backfill with high-overlap if we didn't get enough low-overlap
  for (const cat of highOverlap) {
    if (picked.length >= 6) break;
    if (usedValues.has(cat.value)) continue;
    picked.push(cat);
    usedValues.add(cat.value);
  }

  if (picked.length < 6) return null;

  // Ensure at least 2 different types
  const types = new Set(picked.map((c) => c.type));
  if (types.size < 2) return null;

  // Shuffle the final 6 before splitting into axes
  const final6 = shuffle(picked);
  return {
    xAxis: final6.slice(0, 3),
    yAxis: final6.slice(3, 6),
  };
}

// ============================================================================
// ACTION 5: Force Sync Achievements
// ============================================================================

export interface BatchSyncProgress {
  total: number;
  completed: number;
  succeeded: number;
  failed: number;
  current: string | null;
  results: { qid: string; name: string; count: number; error?: string }[];
}

/**
 * Batch sync achievements for top players by scout_rank.
 * Processes players sequentially to avoid hammering Wikidata SPARQL endpoint.
 * Returns the full result set after completion.
 */
export async function batchSyncAchievements(
  batchSize: number = 50,
  offset: number = 0
): Promise<
  ActionResult<{
    total: number;
    succeeded: number;
    failed: number;
    results: { qid: string; name: string; count: number; error?: string }[];
  }>
> {
  try {
    const supabase = await createAdminClient();

    // Fetch top players by scout_rank that haven't been synced yet (empty or null stats_cache)
    type PlayerWithStats = { id: string; name: string; stats_cache: Record<string, number> | null };
    const { data: players, error: fetchErr } = (await supabase
      .from("players")
      .select("id, name, stats_cache")
      .order("scout_rank", { ascending: false })
      .range(offset, offset + batchSize - 1)) as { data: PlayerWithStats[] | null; error: { message: string } | null };

    if (fetchErr) {
      return { success: false, error: `Failed to fetch players: ${fetchErr.message}` };
    }

    if (!players || players.length === 0) {
      return {
        success: true,
        data: { total: 0, succeeded: 0, failed: 0, results: [] },
      };
    }

    // Filter to players with empty/null stats_cache
    const unsyncedPlayers = players.filter((p) => {
      const cache = p.stats_cache;
      return !cache || Object.keys(cache).length === 0;
    });

    const results: { qid: string; name: string; count: number; error?: string }[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const player of unsyncedPlayers) {
      const qid = player.id as string;
      const name = player.name as string;

      try {
        const syncResult = await syncPlayerAchievements(qid);
        if (syncResult.success) {
          succeeded++;
          results.push({ qid, name, count: syncResult.count });
        } else {
          failed++;
          results.push({ qid, name, count: 0, error: syncResult.error });
        }
      } catch (err) {
        failed++;
        results.push({
          qid,
          name,
          count: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      success: true,
      data: {
        total: unsyncedPlayers.length,
        succeeded,
        failed,
        results,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function forceSyncAchievements(
  playerQid: string
): Promise<ActionResult<{ count: number; statsCache?: Record<string, number> }>> {
  try {
    const result = await syncPlayerAchievements(playerQid);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Fetch the updated stats_cache
    // Note: stats_cache not in generated types yet, cast through unknown
    const supabase = await createAdminClient();
    const { data: player } = (await supabase
      .from("players")
      .select("stats_cache")
      .eq("id", playerQid)
      .single()) as { data: { stats_cache: Record<string, number> | null } | null };

    return {
      success: true,
      data: {
        count: result.count,
        statsCache: player?.stats_cache ?? undefined,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// ACTION 6: Validate Manual Grid
// ============================================================================

/**
 * Given 6 user-typed categories (3 x-axis, 3 y-axis), validate every cell
 * has at least 1 valid player. Returns per-cell player counts.
 */
export async function validateManualGrid(
  xAxis: [GridCategory, GridCategory, GridCategory],
  yAxis: [GridCategory, GridCategory, GridCategory]
): Promise<
  ActionResult<{
    grid: GeneratedGrid;
    solvability: CellSolvability[];
  }>
> {
  try {
    const supabase = await createAdminClient();
    const solvability: CellSolvability[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cellIndex = row * 3 + col;
        const rowCat = yAxis[row];
        const colCat = xAxis[col];
        const count = await countCandidates(supabase, rowCat, colCat);
        solvability.push({ cellIndex, row: rowCat, col: colCat, playerCount: count });
      }
    }

    const grid: GeneratedGrid = {
      xAxis,
      yAxis,
      cellCounts: solvability.map((s) => s.playerCount),
    };

    return { success: true, data: { grid, solvability } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// ACTION 7: Suggest clubs (autocomplete for manual entry)
// ============================================================================

export async function suggestClubs(
  query: string
): Promise<ActionResult<string[]>> {
  if (!query || query.length < 2) return { success: true, data: [] };

  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("clubs")
      .select("name")
      .ilike("name", `%${query}%`)
      .limit(8);

    return { success: true, data: (data ?? []).map((c: { name: string }) => c.name) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ============================================================================
// ACTION 8: Prune Orphan Clubs
// ============================================================================

/**
 * Delete all clubs with zero player_appearances rows.
 * Returns the list of deleted club names for confirmation.
 */
export async function pruneOrphanClubs(): Promise<
  ActionResult<{ deleted: string[]; remaining: number }>
> {
  try {
    const supabase = await createAdminClient();

    // Find orphan clubs (no appearances)
    const allClubs = await fetchAllRows<{ id: string; name: string }>(
      () => supabase.from("clubs").select("id, name") as PostgrestQueryBuilder<{ id: string; name: string }>
    );

    const appearances = await fetchAllRows<{ club_id: string }>(
      () =>
        supabase
          .from("player_appearances")
          .select("club_id") as PostgrestQueryBuilder<{ club_id: string }>
    );

    const usedClubIds = new Set(appearances.map((a) => a.club_id));
    const orphans = allClubs.filter((c) => !usedClubIds.has(c.id));

    if (orphans.length === 0) {
      return {
        success: true,
        data: { deleted: [], remaining: allClubs.length },
      };
    }

    // Delete orphan clubs
    const orphanIds = orphans.map((c) => c.id);
    const { error } = await supabase
      .from("clubs")
      .delete()
      .in("id", orphanIds);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        deleted: orphans.map((c) => c.name),
        remaining: allClubs.length - orphans.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// ACTION 9: Get Grid Schedule (next 7 days)
// ============================================================================

export interface ScheduleDay {
  date: string; // yyyy-MM-dd
  hasGrid: boolean;
  title?: string;
}

/**
 * Fetch which of the next N days already have a the_grid puzzle scheduled.
 */
export async function getGridSchedule(
  startDate: string,
  days: number = 7
): Promise<ActionResult<ScheduleDay[]>> {
  try {
    const supabase = await createAdminClient();
    const start = new Date(startDate);
    const dates: string[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const endDate = dates[dates.length - 1];

    const { data, error } = await supabase
      .from("daily_puzzles")
      .select("puzzle_date, content")
      .eq("game_mode", "the_grid")
      .gte("puzzle_date", startDate)
      .lte("puzzle_date", endDate);

    if (error) {
      return { success: false, error: error.message };
    }

    const scheduledDates = new Map<string, string | undefined>();
    for (const row of data ?? []) {
      if (!row.puzzle_date) continue;
      const content = row.content as { title?: string } | null;
      scheduledDates.set(
        row.puzzle_date,
        content?.title
      );
    }

    const schedule: ScheduleDay[] = dates.map((date) => ({
      date,
      hasGrid: scheduledDates.has(date),
      title: scheduledDates.get(date),
    }));

    return { success: true, data: schedule };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// ACTION 10: Publish Grid to daily_puzzles
// ============================================================================

/**
 * Publish the current sandbox grid to daily_puzzles.
 */
export async function publishGrid(
  grid: GeneratedGrid,
  publishDate: string,
  title?: string,
  description?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createAdminClient();

    const content = JSON.parse(JSON.stringify({
      xAxis: grid.xAxis,
      yAxis: grid.yAxis,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    }));

    const { data, error } = await supabase
      .from("daily_puzzles")
      .insert({
        game_mode: "the_grid",
        puzzle_date: publishDate,
        content,
        status: "live",
        source: "manual",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: `A grid is already scheduled for ${publishDate}. Choose a different date.`,
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
