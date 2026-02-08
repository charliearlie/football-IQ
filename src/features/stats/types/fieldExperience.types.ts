/**
 * Type definitions for Field Experience feature.
 *
 * Field Experience tracks the total number of completed puzzles
 * per game mode, providing "Overall Appearances" metrics for the
 * Scout Report screen.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Field Experience data structure containing per-mode counts
 * and aggregate statistics.
 */
export interface FieldExperience {
  /** Completed puzzle count for each game mode */
  byMode: Record<GameMode, number>;
  /** Total completed puzzles across all modes */
  totalAppearances: number;
  /** Game mode with the most completed puzzles, or null if none */
  dominantMode: GameMode | null;
}

/**
 * Empty Field Experience object for initial state.
 */
export const EMPTY_FIELD_EXPERIENCE: FieldExperience = {
  byMode: {
    career_path: 0,
    career_path_pro: 0,
    guess_the_transfer: 0,
    guess_the_goalscorers: 0,
    the_grid: 0,
    the_chain: 0,
    the_thread: 0,
    topical_quiz: 0,
    top_tens: 0,
    starting_xi: 0,
  },
  totalAppearances: 0,
  dominantMode: null,
};
