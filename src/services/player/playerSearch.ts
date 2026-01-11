/**
 * Player Search Service.
 * Provides local-first search functionality for the player database.
 * Powers "The Grid" and "Goalscorer Recall" game modes.
 */
import { getDatabase } from '@/lib/database';
import { LocalPlayer, ParsedPlayer, PlayerSearchResult } from '@/types/database';
import {
  normalizeSearchName,
  calculateRelevance,
  clubsMatch,
} from './playerUtils';

/** Minimum characters required for search */
const MIN_SEARCH_LENGTH = 3;

/** Default number of search results to return */
const DEFAULT_SEARCH_LIMIT = 10;

/**
 * Search players by name using LIKE query on search_name.
 * Results are ranked by relevance to the query.
 *
 * @param query - Search query (minimum 3 characters)
 * @param limit - Maximum results to return (default: 10)
 * @returns Sorted array of search results with relevance scores
 *
 * @example
 * const results = await searchPlayers("messi");
 * // Returns Lionel Messi with high relevance score
 *
 * const results = await searchPlayers("ibra");
 * // Returns Zlatan Ibrahimović (search_name: "zlatan ibrahimovic")
 */
export async function searchPlayers(
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT
): Promise<PlayerSearchResult[]> {
  // Require minimum query length
  if (!query || query.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  const normalizedQuery = normalizeSearchName(query);
  const database = getDatabase();

  // Fetch more results than needed for better ranking after sorting
  const rows = await database.getAllAsync<LocalPlayer>(
    `SELECT * FROM player_database
     WHERE search_name LIKE $pattern
     ORDER BY search_name
     LIMIT $limit`,
    {
      $pattern: `%${normalizedQuery}%`,
      $limit: limit * 2, // Fetch extra for better ranking
    }
  );

  // Parse and rank results
  const results: PlayerSearchResult[] = rows.map((row) => ({
    player: parsePlayer(row),
    relevanceScore: calculateRelevance(normalizedQuery, row.search_name),
  }));

  // Sort by relevance (highest first) and limit results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Get a player by their database ID.
 *
 * @param id - Player database ID
 * @returns Parsed player or null if not found
 */
export async function getPlayerById(id: string): Promise<ParsedPlayer | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalPlayer>(
    'SELECT * FROM player_database WHERE id = $id',
    { $id: id }
  );
  return row ? parsePlayer(row) : null;
}

/**
 * Check if a player played for a specific club.
 * Uses case-insensitive matching with fuzzy tolerance for club name variations.
 *
 * @param playerId - Player database ID
 * @param clubName - Club name to check (e.g., "Real Madrid")
 * @returns true if player's clubs array contains a match
 *
 * @example
 * // Returns true if player-1's clubs include "Barcelona"
 * await didPlayerPlayFor("player-1", "Barcelona");
 *
 * // Also matches with fuzzy tolerance
 * await didPlayerPlayFor("player-1", "Real Madrid CF"); // matches "Real Madrid"
 */
export async function didPlayerPlayFor(
  playerId: string,
  clubName: string
): Promise<boolean> {
  const player = await getPlayerById(playerId);
  if (!player) return false;

  // Check each club in player's history
  return player.clubs.some((playerClub) => clubsMatch(playerClub, clubName));
}

/**
 * Check if a player has a specific nationality.
 *
 * @param playerId - Player database ID
 * @param nationalityCode - ISO 3166-1 alpha-2 country code (e.g., "BR")
 * @returns true if player's nationalities array contains the code
 *
 * @example
 * await hasNationality("player-1", "BR"); // true if Brazilian
 * await hasNationality("player-1", "br"); // also works (case-insensitive)
 */
export async function hasNationality(
  playerId: string,
  nationalityCode: string
): Promise<boolean> {
  const player = await getPlayerById(playerId);
  if (!player) return false;

  const upperCode = nationalityCode.toUpperCase();
  return player.nationalities.some(
    (code) => code.toUpperCase() === upperCode
  );
}

/**
 * Search for players who match given criteria.
 * Used for validating guesses in "The Grid" game mode.
 *
 * @param name - Player name to search for
 * @param requiredClub - Optional club the player must have played for
 * @param requiredNationality - Optional nationality the player must have
 * @returns Array of matching players
 */
export async function findPlayersMatchingCriteria(
  name: string,
  requiredClub?: string,
  requiredNationality?: string
): Promise<ParsedPlayer[]> {
  // First, search by name
  const results = await searchPlayers(name);

  // Filter by additional criteria
  return results
    .filter((result) => {
      const player = result.player;

      // Check club requirement
      if (requiredClub) {
        const hasClub = player.clubs.some((club) =>
          clubsMatch(club, requiredClub)
        );
        if (!hasClub) return false;
      }

      // Check nationality requirement
      if (requiredNationality) {
        const hasNat = player.nationalities.some(
          (code) => code.toUpperCase() === requiredNationality.toUpperCase()
        );
        if (!hasNat) return false;
      }

      return true;
    })
    .map((result) => result.player);
}

// ============ INTERNAL HELPERS ============

/**
 * Parse a player row from SQLite, converting JSON strings to arrays
 * and integers to booleans.
 */
function parsePlayer(row: LocalPlayer): ParsedPlayer {
  let clubs: string[] = [];
  let nationalities: string[] = [];

  try {
    clubs = JSON.parse(row.clubs);
  } catch (error) {
    console.error('Failed to parse player clubs:', row.id, error);
  }

  try {
    nationalities = JSON.parse(row.nationalities);
  } catch (error) {
    console.error('Failed to parse player nationalities:', row.id, error);
  }

  return {
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    searchName: row.search_name,
    clubs,
    nationalities,
    isActive: row.is_active === 1,
    lastSyncedAt: row.last_synced_at,
  };
}
