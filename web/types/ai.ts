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
  error?: string;
}
