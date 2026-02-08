/**
 * Club search types.
 *
 * Defines interfaces for local cache and unified search results.
 */

/**
 * Club entity from local cache (club_colors table).
 */
export interface CachedClub {
  /** Wikidata QID (e.g., "Q9617") */
  id: string;
  /** Full name (e.g., "Arsenal F.C.") */
  name: string;
  /** Hex color (e.g., "#EF0107") */
  primary_color: string;
  /** Hex color (e.g., "#FFFFFF") */
  secondary_color: string;
}

/**
 * Unified club result from hybrid search.
 * Used by ClubAutocomplete UI component.
 */
export interface UnifiedClub {
  /** Wikidata QID */
  id: string;
  /** Display name */
  name: string;
  /** Hex primary color */
  primary_color: string;
  /** Hex secondary color */
  secondary_color: string;
  /** Where this result came from */
  source: 'local' | 'remote';
  /** Search relevance (0-1.2, with tiebreaker bonus) */
  relevance_score: number;
  /** How this club was matched */
  match_type: 'name' | 'nickname';
}
