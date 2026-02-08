/**
 * Hybrid Club Search Engine.
 *
 * Waterfall strategy:
 * 1. Search local SQLite club_colors (instant, ~200 elite clubs)
 * 2. Check CLUB_NICKNAME_MAP for alias matches
 * 3. If < 3 results → debounced (300ms) Supabase clubs table fallback
 *
 * Returns UnifiedClub format with color data for shield rendering.
 */

import { searchClubColors, getClubColorById } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { normalizeSearchName } from '@/services/player/playerUtils';
import { findClubByNickname, NICKNAME_TO_CLUB_ID } from './clubNicknames';
import type { UnifiedClub, CachedClub } from './types';

/** Minimum local results before triggering Supabase fallback */
const MIN_LOCAL_RESULTS = 3;

/** Debounce delay for Supabase queries (ms) */
const DEBOUNCE_MS = 300;

/** Maximum results to return */
const MAX_RESULTS = 8;

/** Default colors for remote clubs without local color data */
const DEFAULT_PRIMARY = '#333333';
const DEFAULT_SECONDARY = '#FFFFFF';

/** Minimum query length */
const MIN_QUERY_LENGTH = 2;

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
 * Calculate relevance score for a club match.
 */
function calculateClubRelevance(
  query: string,
  clubName: string,
  matchType: 'name' | 'nickname'
): number {
  const normalizedQuery = normalizeSearchName(query);
  const normalizedName = normalizeSearchName(clubName);

  // Exact match
  if (normalizedName === normalizedQuery) {
    return 1.0;
  }

  // Nickname exact match gets high score
  if (matchType === 'nickname') {
    return 0.95;
  }

  // Name starts with query (prefix match)
  if (normalizedName.startsWith(normalizedQuery)) {
    return 0.9;
  }

  // Any word in the name starts with query
  const words = normalizedName.split(/\s+/);
  if (words.some((word) => word.startsWith(normalizedQuery))) {
    return 0.85;
  }

  // Contains query somewhere
  if (normalizedName.includes(normalizedQuery)) {
    const position = normalizedName.indexOf(normalizedQuery);
    return 0.7 - (position / normalizedName.length) * 0.1;
  }

  // Fallback
  return 0.5;
}

/**
 * Search for clubs matching a nickname.
 */
async function searchByNickname(query: string): Promise<UnifiedClub | null> {
  const normalizedQuery = normalizeSearchName(query);

  // Check each nickname for partial/prefix match
  for (const [nickname, clubId] of NICKNAME_TO_CLUB_ID.entries()) {
    if (nickname.startsWith(normalizedQuery) || nickname === normalizedQuery) {
      const club = await getClubColorById(clubId);
      if (club) {
        return {
          id: club.id,
          name: club.name,
          primary_color: club.primary_color,
          secondary_color: club.secondary_color,
          source: 'local',
          relevance_score: calculateClubRelevance(query, club.name, 'nickname'),
          match_type: 'nickname',
        };
      }
    }
  }

  // Direct lookup by exact nickname
  const clubId = findClubByNickname(query);
  if (clubId) {
    const club = await getClubColorById(clubId);
    if (club) {
      return {
        id: club.id,
        name: club.name,
        primary_color: club.primary_color,
        secondary_color: club.secondary_color,
        source: 'local',
        relevance_score: calculateClubRelevance(query, club.name, 'nickname'),
        match_type: 'nickname',
      };
    }
  }

  return null;
}

/**
 * Convert CachedClub to UnifiedClub with scoring.
 */
function toUnifiedClub(
  club: CachedClub,
  query: string,
  source: 'local' | 'remote'
): UnifiedClub {
  return {
    id: club.id,
    name: club.name,
    primary_color: club.primary_color,
    secondary_color: club.secondary_color,
    source,
    relevance_score: calculateClubRelevance(query, club.name, 'name'),
    match_type: 'name',
  };
}

/**
 * Hybrid search with local-first strategy.
 *
 * - Calls `onUpdate` immediately with local results from club_colors.
 * - Checks CLUB_NICKNAME_MAP for alias matches.
 * - If local results are sparse (<3), schedules a debounced Supabase query
 *   and calls `onUpdate` again with merged results.
 *
 * @param query - Search query (minimum 2 characters)
 * @param onUpdate - Callback invoked with updated results
 */
export async function searchClubsHybrid(
  query: string,
  onUpdate: (results: UnifiedClub[]) => void
): Promise<void> {
  if (!query || query.length < MIN_QUERY_LENGTH) {
    onUpdate([]);
    return;
  }

  // 1. Local search from club_colors table
  const localClubs = await searchClubColors(query);
  const localResults: UnifiedClub[] = localClubs.map((club) =>
    toUnifiedClub(club, query, 'local')
  );

  // 2. Nickname search
  const nicknameResult = await searchByNickname(query);

  // 3. Merge results, deduplicating by ID
  const seenIds = new Set<string>();
  const merged: UnifiedClub[] = [];

  // Add local results first
  for (const result of localResults) {
    if (!seenIds.has(result.id)) {
      seenIds.add(result.id);
      merged.push(result);
    }
  }

  // Add nickname result if not duplicate
  if (nicknameResult && !seenIds.has(nicknameResult.id)) {
    seenIds.add(nicknameResult.id);
    merged.push(nicknameResult);
  }

  // Sort by relevance and limit
  merged.sort((a, b) => b.relevance_score - a.relevance_score);
  const topResults = merged.slice(0, MAX_RESULTS);

  onUpdate(topResults);

  // 4. If sufficient local results, skip Supabase
  if (topResults.length >= MIN_LOCAL_RESULTS) {
    return;
  }

  // 5. Debounced Supabase search (fallback for obscure clubs)
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    try {
      const { data: remoteClubs, error } = await supabase
        .from('clubs')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('[ClubSearchEngine] Supabase search failed:', error);
        onUpdate(topResults);
        return;
      }

      if (!remoteClubs || remoteClubs.length === 0) {
        onUpdate(topResults);
        return;
      }

      // Convert and merge remote results (use default colors since Supabase clubs table has no color data)
      const remoteResults: UnifiedClub[] = remoteClubs.map((club) => ({
        id: club.id,
        name: club.name,
        primary_color: DEFAULT_PRIMARY,
        secondary_color: DEFAULT_SECONDARY,
        source: 'remote' as const,
        relevance_score: calculateClubRelevance(query, club.name, 'name'),
        match_type: 'name' as const,
      }));

      // Merge: local first, then remote (dedupe by ID)
      const allResults: UnifiedClub[] = [...topResults];
      for (const remote of remoteResults) {
        if (!seenIds.has(remote.id)) {
          seenIds.add(remote.id);
          allResults.push(remote);
        }
      }

      allResults.sort((a, b) => b.relevance_score - a.relevance_score);
      onUpdate(allResults.slice(0, MAX_RESULTS));
    } catch (error) {
      console.error('[ClubSearchEngine] Supabase search error:', error);
      onUpdate(topResults);
    }
  }, DEBOUNCE_MS);
}
