/**
 * Career Path type definitions for landing page
 */

/**
 * A single step in a player's career.
 */
export interface CareerStep {
  /** Type of career move */
  type: "club" | "loan";
  /** Club name or description */
  text: string;
  /** Year or year range (e.g., "2019-2023") */
  year: string;
  /** Number of appearances (optional) */
  apps?: number;
  /** Number of goals scored (optional) */
  goals?: number;
}

/**
 * The puzzle content structure for career_path game mode.
 */
export interface CareerPathContent {
  /** The correct player name */
  answer: string;
  /** Array of career steps (3-20 items) */
  career_steps: CareerStep[];
}
