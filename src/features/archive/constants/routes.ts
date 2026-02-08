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
  career_path_pro: 'career-path-pro',
  guess_the_transfer: 'transfer-guess',
  guess_the_goalscorers: 'goalscorer-recall',
  the_grid: 'the-grid',
  the_chain: 'the-chain',
  the_thread: 'the-thread',
  topical_quiz: 'topical-quiz',
  top_tens: 'top-tens',
  starting_xi: 'starting-xi',
};
