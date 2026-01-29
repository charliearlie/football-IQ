/**
 * Hybrid Player Search Engine.
 *
 * Waterfall strategy:
 * 1. Search local SQLite player_search_cache (instant)
 * 2. If < 5 results → debounced (300ms) Supabase Oracle search
 * 3. Cache Oracle results to SQLite for future searches
 *
 * Returns UnifiedPlayer format (zero-spoiler: no clubs shown).
 */

import { searchPlayers } from './playerSearch';
import { searchPlayersOracle } from '../oracle/WikidataService';
import { getDatabase } from '@/lib/database';
import { UnifiedPlayer } from '../oracle/types';

/** Minimum local results before triggering Oracle fallback */
const MIN_LOCAL_RESULTS = 5;

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
 * Hybrid search with local-first strategy.
 *
 * - Calls `onUpdate` immediately with local results.
 * - If local results are sparse, schedules a debounced Oracle query
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

  // 1. Immediate local search
  const localResults = await searchPlayers(query);
  const unified: UnifiedPlayer[] = localResults.map((r) => ({
    id: r.player.id,
    name: r.player.name,
    nationality_code: r.player.nationalities[0] ?? null,
    birth_year: null, // Legacy player_database doesn't store birth_year
    position_category: null, // Legacy player_database doesn't store position
    source: 'local' as const,
    relevance_score: r.relevanceScore,
  }));

  onUpdate(unified);

  // 2. If sufficient local results, skip Oracle
  if (unified.length >= MIN_LOCAL_RESULTS) {
    return;
  }

  // 3. Debounced Oracle search (fallback)
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
        unified.map((p) => p.name.toLowerCase())
      );
      const uniqueOracle = oracleUnified.filter(
        (p) => !localNames.has(p.name.toLowerCase())
      );

      const merged = [...unified, ...uniqueOracle]
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, MAX_RESULTS);

      onUpdate(merged);

      // Cache Oracle results to SQLite
      await cacheOracleResults(oracleResults);
    } catch (error) {
      console.error('[HybridSearchEngine] Oracle search failed:', error);
      // Don't re-call onUpdate — keep showing local results
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
