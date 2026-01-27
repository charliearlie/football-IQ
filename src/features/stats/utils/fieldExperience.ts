/**
 * Field Experience Utilities
 *
 * Calculates "Field Experience" metrics from completed puzzle attempts.
 * Provides per-mode counts and overall appearance totals for the
 * Scout Report screen.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { AttemptWithGameMode } from '@/lib/database';
import {
  FieldExperience,
  EMPTY_FIELD_EXPERIENCE,
} from '../types/fieldExperience.types';

/**
 * All valid game modes in the app.
 * Used for validation and initialization.
 */
export const ALL_GAME_MODES: GameMode[] = [
  'career_path',
  'career_path_pro',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'the_grid',
  'topical_quiz',
  'top_tens',
  'starting_xi',
];

/**
 * Check if a string is a valid GameMode.
 */
function isValidGameMode(mode: string): mode is GameMode {
  return ALL_GAME_MODES.includes(mode as GameMode);
}

/**
 * Get the dominant game mode (highest count) from byMode record.
 * Returns null if all counts are 0.
 * On tie, returns first alphabetically.
 */
export function getDominantMode(
  byMode: Record<GameMode, number>
): GameMode | null {
  let maxCount = 0;
  let dominantMode: GameMode | null = null;

  // Sort modes alphabetically for consistent tie-breaking
  const sortedModes = [...ALL_GAME_MODES].sort();

  for (const mode of sortedModes) {
    const count = byMode[mode];
    if (count > maxCount) {
      maxCount = count;
      dominantMode = mode;
    }
  }

  return dominantMode;
}

/**
 * Calculate Field Experience from completed attempts.
 *
 * Aggregates puzzle completion counts per game mode and calculates
 * total appearances across all modes.
 *
 * @param attempts - Array of completed attempts with game mode info
 * @returns Field Experience object with per-mode counts and totals
 */
export function calculateFieldExperience(
  attempts: AttemptWithGameMode[] | null | undefined
): FieldExperience {
  // Handle null/undefined gracefully
  if (!attempts || !Array.isArray(attempts)) {
    return { ...EMPTY_FIELD_EXPERIENCE };
  }

  // Initialize counts for all modes
  const byMode: Record<GameMode, number> = {
    career_path: 0,
    career_path_pro: 0,
    guess_the_transfer: 0,
    guess_the_goalscorers: 0,
    the_grid: 0,
    topical_quiz: 0,
    top_tens: 0,
    starting_xi: 0,
  };

  let totalAppearances = 0;

  // Count completed attempts per mode
  for (const attempt of attempts) {
    // Skip incomplete attempts
    if (!attempt.completed) {
      continue;
    }

    // Skip attempts without valid game_mode
    const gameMode = attempt.game_mode;
    if (!gameMode || !isValidGameMode(gameMode)) {
      continue;
    }

    byMode[gameMode]++;
    totalAppearances++;
  }

  // Calculate dominant mode
  const dominantMode = getDominantMode(byMode);

  return {
    byMode,
    totalAppearances,
    dominantMode,
  };
}

// Re-export types for convenience
export type { FieldExperience } from '../types/fieldExperience.types';
export { EMPTY_FIELD_EXPERIENCE } from '../types/fieldExperience.types';
