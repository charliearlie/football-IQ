/**
 * Hybrid Player Search Engine.
 *
 * Waterfall strategy:
 * 1. Search local SQLite player_search_cache (instant, ~4,900 pre-seeded Elite Index)
 * 2. If < 3 results → debounced (300ms) Supabase Oracle search
 * 3. Cache Oracle results to SQLite for future searches
 *
 * Returns UnifiedPlayer format (zero-spoiler: no clubs shown).
 */

import { searchPlayerCache } from '@/lib/database';
import { searchPlayersOracle } from '../oracle/WikidataService';
import { getDatabase } from '@/lib/database';
import { UnifiedPlayer } from '../oracle/types';

/** Minimum local results before triggering Oracle fallback */
const MIN_LOCAL_RESULTS = 3;

/** Debounce delay for Oracle queries (ms) */
const DEBOUNCE_MS = 300;

/** Maximum results to return */
const MAX_RESULTS = 10;

/** Minimum query length */
const MIN_QUERY_LENGTH = 3;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Reset internal state for testing.
 * @internal
 */
export function _resetForTesting(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/**
 * Calculate relevance score for local results.
 * Combines text matching quality with scout_rank (popularity) as tiebreaker.
 */
function calculateLocalRelevance(
  query: string,
  name: string,
  scoutRank: number
): number {
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // scout_rank bonus: small fraction to break ties (max ~0.2 for top players)
  const rankBonus = Math.min(scoutRank / 1000, 0.2);

  const nameParts = normalizedName.split(' ');
  const surname = nameParts[nameParts.length - 1];

  // Tier 1: Surname starts with query (users most often search by surname)
  if (surname.startsWith(normalizedQuery)) {
    return 1.0 + rankBonus;
  }

  // Tier 2: Full name / first name starts with query
  if (normalizedName.startsWith(normalizedQuery)) {
    return 0.9 + rankBonus;
  }

  // Tier 3: Any other word starts with query (middle names etc.)
  if (nameParts.some((part) => part.startsWith(normalizedQuery))) {
    return 0.85 + rankBonus;
  }

  // Tier 4: Contains anywhere
  if (normalizedName.includes(normalizedQuery)) {
    return 0.7 + rankBonus;
  }

  return 0.5 + rankBonus;
}

/**
 * Hybrid search with local-first strategy.
 *
 * - Calls `onUpdate` immediately with local results from the Elite Index.
 * - If local results are sparse (<3), schedules a debounced Oracle query
 *   and calls `onUpdate` again with merged results.
 *
 * @param query - Search query (minimum 3 characters)
 * @param onUpdate - Callback invoked with updated results
 */
export async function searchPlayersHybrid(
  query: string,
  onUpdate: (results: UnifiedPlayer[]) => void
): Promise<void> {
  if (!query || query.length < MIN_QUERY_LENGTH) {
    onUpdate([]);
    return;
  }

  // 1. Immediate local search from Elite Index (player_search_cache)
  const localResults = await searchPlayerCache(query);
  const unified: UnifiedPlayer[] = localResults.map((r) => ({
    id: r.id,
    name: r.name,
    nationality_code: r.nationality_code,
    birth_year: r.birth_year,
    position_category: r.position_category,
    source: 'local' as const,
    relevance_score: calculateLocalRelevance(query, r.name, r.scout_rank),
  }));

  // Sort by relevance (SQL already sorts by scout_rank, but re-sort by text relevance)
  unified.sort((a, b) => b.relevance_score - a.relevance_score);
  const topLocal = unified.slice(0, MAX_RESULTS);

  onUpdate(topLocal);

  // 2. If sufficient local results, skip Oracle
  if (topLocal.length >= MIN_LOCAL_RESULTS) {
    return;
  }

  // 3. Debounced Oracle search (fallback for niche players)
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    try {
      const oracleResults = await searchPlayersOracle(query);
      const oracleUnified: UnifiedPlayer[] = oracleResults.map((p) => ({
        id: p.id,
        name: p.name,
        nationality_code: p.nationality_code,
        birth_year: p.birth_year,
        position_category: p.position_category,
        source: 'oracle' as const,
        relevance_score: p.relevance_score,
      }));

      // Merge: local first, then Oracle (dedupe by lowercase name)
      const localNames = new Set(
        topLocal.map((p) => p.name.toLowerCase())
      );
      const uniqueOracle = oracleUnified.filter(
        (p) => !localNames.has(p.name.toLowerCase())
      );

      const merged = [...topLocal, ...uniqueOracle]
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, MAX_RESULTS);

      onUpdate(merged);

      // Cache Oracle results to SQLite for future searches
      await cacheOracleResults(oracleResults);
    } catch (error) {
      console.error('[HybridSearchEngine] Oracle search failed:', error);
      // Re-invoke callback so consumers can finalize loading state
      onUpdate(topLocal);
    }
  }, DEBOUNCE_MS);
}

/**
 * Cache Oracle results to local SQLite player_search_cache.
 */
async function cacheOracleResults(
  players: Array<{
    id: string;
    name: string;
    scout_rank: number;
    birth_year: number | null;
    position_category: string | null;
    nationality_code: string | null;
  }>
): Promise<void> {
  if (players.length === 0) return;

  try {
    const db = getDatabase();
    for (const player of players) {
      const searchName = player.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

      await db.runAsync(
        `INSERT OR REPLACE INTO player_search_cache
         (id, name, search_name, scout_rank, birth_year, position_category, nationality_code, synced_at)
         VALUES ($id, $name, $search_name, $scout_rank, $birth_year, $position, $nationality, $synced_at)`,
        {
          $id: player.id,
          $name: player.name,
          $search_name: searchName,
          $scout_rank: player.scout_rank,
          $birth_year: player.birth_year,
          $position: player.position_category,
          $nationality: player.nationality_code,
          $synced_at: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    console.error('[HybridSearchEngine] Failed to cache results:', error);
  }
}
