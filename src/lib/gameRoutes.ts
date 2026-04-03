/**
 * Shared game route map used across the app.
 *
 * Centralises the mapping from GameMode to route slug so
 * navigation helpers and hooks always use the same source of truth.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Maps each GameMode to its URL route slug.
 */
export const GAME_MODE_ROUTE_MAP: Record<GameMode, string> = {
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
  connections: 'connections',
  timeline: 'timeline',
  who_am_i: 'who-am-i',
  balldle: 'balldle',
  higher_lower: 'higher-lower',
};

/**
 * Returns the full route path for a given game mode and puzzle ID.
 *
 * @param gameMode - The game mode to navigate to
 * @param puzzleId - The puzzle ID to navigate to
 * @returns A route string like "/career-path/abc123"
 */
export function getGameRoute(gameMode: GameMode, puzzleId: string): string {
  const routeSlug = GAME_MODE_ROUTE_MAP[gameMode];
  return `/${routeSlug}/${puzzleId}`;
}
