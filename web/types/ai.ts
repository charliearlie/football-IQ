/**
 * AI Scout Types
 *
 * Type definitions for the AI Scout feature that extracts career data
 * from Wikipedia using OpenAI.
 */

export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * A career step extracted by the AI scout, with confidence scoring.
 */
export interface ScoutedCareerStep {
  /** Type of career move */
  type: "club" | "loan";
  /** Club name */
  text: string;
  /** Year or year range (e.g., "2011-2015") */
  year: string;
  /** Number of appearances (null if not found in source) */
  apps: number | null;
  /** Number of goals scored (null if not found in source) */
  goals: number | null;
  /** AI-generated trivia insight for major clubs (null for minor stints) */
  trivia: string | null;
  /** Confidence level for this data point */
  confidence: ConfidenceLevel;
}

/**
 * The data returned from a successful scout operation.
 */
export interface CareerScoutData {
  /** Player name (for the answer field) */
  answer: string;
  /** Array of career steps in chronological order */
  career_steps: ScoutedCareerStep[];
}

/**
 * Result of a career scout operation.
 */
export interface CareerScoutResult {
  success: boolean;
  data?: CareerScoutData;
  error?: string;
}

/**
 * Result of fetching Wikipedia wikitext.
 */
export interface WikitextResult {
  success: boolean;
  wikitext?: string;
  pageTitle?: string;
  /** MediaWiki revision ID for the fetched content */
  revisionId?: string;
  /** ISO timestamp of when Wikipedia was last edited */
  revisionTimestamp?: string;
  error?: string;
}

/**
 * Metadata stored in puzzle content for AI-generated puzzles.
 * Uses underscore prefix convention to distinguish from game content.
 */
export interface ContentMetadata {
  /** ISO timestamp when AI Scout extracted the data */
  scouted_at?: string;
  /** MediaWiki revision ID for provenance tracking */
  wikipedia_revision_id?: string;
  /** ISO timestamp of when the Wikipedia article was last edited */
  wikipedia_revision_date?: string;
  /** Origin of the puzzle content */
  generated_by?: "manual" | "ai_oracle" | "ai_scout";
  /** Wikipedia URL used for scouting (for reference) */
  wikipedia_url?: string;
}

/**
 * Theme options for Oracle player suggestions.
 */
export type OracleTheme =
  | "default"
  | "premier_league_legends"
  | "world_cup_icons"
  | "streets_wont_forget"
  | "journeymen"
  | "90s_2000s_nostalgia"
  | "rising_stars"
  | "custom";

/**
 * Oracle-suggested player for filling schedule gaps.
 */
export interface OracleSuggestion {
  /** Player name as it should appear in the answer field */
  name: string;
  /** Wikipedia URL for scouting (e.g., "https://en.wikipedia.org/wiki/Andrea_Pirlo") */
  wikipediaUrl: string;
  /** Brief reason why this player is suggested */
  reason: string;
  /** Suggested difficulty based on player profile */
  suggestedDifficulty: "easy" | "medium" | "hard";
}

/**
 * Options for the Oracle suggestion engine.
 */
export interface OracleOptions {
  /** Game mode to suggest players for */
  gameMode: "career_path" | "career_path_pro";
  /** Number of suggestions to generate */
  count: number;
  /** Days to look back for deduplication (default: 30) */
  excludeRecentDays?: number;
  /** Theme to focus suggestions on */
  theme?: OracleTheme;
  /** Custom prompt when theme is "custom" */
  customPrompt?: string;
}

/**
 * Result of an Oracle suggestion operation.
 */
export interface OracleResult {
  success: boolean;
  suggestions?: OracleSuggestion[];
  /** Names filtered out due to recent use */
  filteredOut?: string[];
  error?: string;
}

/**
 * Progress update during batch oracle operations.
 */
export interface OracleProgress {
  current: number;
  total: number;
  currentPlayer?: string;
  status: "suggesting" | "scouting" | "saving" | "complete" | "error";
  message?: string;
}
