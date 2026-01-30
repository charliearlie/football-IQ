/**
 * Types for the Oracle search system.
 * Wikidata-backed player graph with zero-spoiler autocomplete.
 */

/**
 * Player entity from Supabase Oracle (Wikidata-backed).
 * Contains only zero-spoiler metadata — no club info.
 */
export interface OraclePlayer {
  /** Primary key — Wikidata QID (e.g., "Q11571") */
  id: string;
  /** Display name (e.g., "Cristiano Ronaldo") */
  name: string;
  /** Popularity proxy from Wikidata sitelinks count */
  scout_rank: number;
  /** Birth year only (zero-spoiler) */
  birth_year: number | null;
  /** Simplified: "Forward" | "Midfielder" | "Defender" | "Goalkeeper" */
  position_category: string | null;
  /** ISO 3166-1 alpha-2 (e.g., "PT") */
  nationality_code: string | null;
  /** Search relevance score (0-1) */
  relevance_score: number;
}

/**
 * Unified player result from hybrid search (local + Oracle).
 * Used by PlayerAutocomplete UI component.
 */
export interface UnifiedPlayer {
  /** Wikidata QID or local database ID */
  id: string;
  /** Display name */
  name: string;
  /** ISO 3166-1 alpha-2 (e.g., "FR") */
  nationality_code: string | null;
  /** Birth year (zero-spoiler) */
  birth_year: number | null;
  /** "Forward" | "Midfielder" | "Defender" | "Goalkeeper" */
  position_category: string | null;
  /** Where this result came from */
  source: 'local' | 'oracle';
  /** Search relevance (0-1) */
  relevance_score: number;
}

/** Position categories used in the Oracle system */
export type PositionCategory = 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper';

/**
 * Raw SPARQL result binding from Wikidata Query Service.
 */
export interface SPARQLBinding {
  [key: string]: {
    type: 'uri' | 'literal';
    value: string;
    datatype?: string;
    'xml:lang'?: string;
  };
}

/**
 * SPARQL query response from Wikidata.
 */
export interface SPARQLResponse {
  results: {
    bindings: SPARQLBinding[];
  };
}

/**
 * Player data as resolved from Wikidata SPARQL (admin tool output).
 */
export interface WikidataPlayerData {
  qid: string;
  name: string;
  birth_year: number | null;
  nationality_code: string | null;
  position_category: PositionCategory | null;
  sitelinks: number;
}

/**
 * Club career entry from Wikidata SPARQL.
 */
export interface WikidataCareerEntry {
  club_qid: string;
  club_name: string;
  club_country_code: string | null;
  start_year: number | null;
  end_year: number | null;
}
