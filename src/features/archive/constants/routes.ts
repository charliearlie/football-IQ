/**
 * Route map for game mode navigation.
 *
 * Maps GameMode types to their corresponding route paths.
 * Used by archive screen and gated navigation hook.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Route map for each game mode.
 */
export const GAME_MODE_ROUTES: Record<GameMode, string> = {
  career_path: 'career-path',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  tic_tac_toe: 'tic-tac-toe',
  the_grid: 'the-grid',
  topical_quiz: 'topical-quiz',
  top_tens: 'top-tens',
  starting_xi: 'starting-xi',
};
