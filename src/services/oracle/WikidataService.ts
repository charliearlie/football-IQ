/**
 * Oracle service for accessing the Wikidata player graph via Supabase.
 *
 * This service wraps Supabase RPC calls — it does NOT query Wikidata directly.
 * Players are pre-populated by the admin tool (tools/player-scout.html),
 * then accessed via Supabase RPC functions.
 */

import { supabase } from '@/lib/supabase';
import { OraclePlayer } from './types';

/**
 * Search players via Supabase Oracle (remote search).
 * Used as fallback when local SQLite cache has no/few results.
 *
 * @param query - Search query (minimum 3 characters)
 * @param limit - Maximum results (default: 10)
 * @returns Array of matching players (empty on error)
 */
export async function searchPlayersOracle(
  query: string,
  limit: number = 10
): Promise<OraclePlayer[]> {
  if (!query || query.length < 3) return [];

  const { data, error } = await supabase.rpc('search_players_oracle', {
    query_text: query,
    match_limit: limit,
  });

  if (error) {
    console.error('[WikidataService] Search failed:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Validate if a player played for a specific club.
 * Both identified by Wikidata QID.
 *
 * @param playerQid - Player Wikidata QID (e.g., "Q11571")
 * @param clubQid - Club Wikidata QID (e.g., "Q8682")
 * @returns true if relationship exists, false otherwise
 */
export async function validatePlayerClub(
  playerQid: string,
  clubQid: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_player_club', {
    player_qid: playerQid,
    club_qid: clubQid,
  });

  if (error) {
    console.error('[WikidataService] Validation failed:', error.message);
    return false;
  }

  return data === true;
}

/**
 * Validate if a player played for a club identified by name.
 * Looks up club QID by name, then validates the relationship.
 *
 * @param playerQid - Player Wikidata QID (e.g., "Q17333")
 * @param clubName - Club name (e.g., "Arsenal", "Real Madrid")
 * @returns true if relationship exists, false otherwise
 */
export async function validatePlayerClubByName(
  playerQid: string,
  clubName: string
): Promise<boolean> {
  // First, find the club QID by name
  const { data: clubData, error: clubError } = await supabase
    .from('clubs')
    .select('id')
    .ilike('name', `%${clubName}%`)
    .limit(1)
    .single();

  if (clubError || !clubData?.id) {
    console.warn(`[WikidataService] Club not found: "${clubName}"`);
    return false;
  }

  // Now validate the player-club relationship
  return validatePlayerClub(playerQid, clubData.id);
}
