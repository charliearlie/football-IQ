import { useMemo } from 'react';
import { usePuzzleContext } from '@/features/puzzles';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { SpecialEvent } from '../config/events';

/**
 * Route map for each game mode (matches the one in index.tsx).
 */
const ROUTE_MAP: Record<GameMode, string> = {
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

/**
 * Default titles per game mode, used as fallback if event_title is missing.
 */
const DEFAULT_TITLES: Record<GameMode, string> = {
  career_path: 'SPECIAL CAREER PATH',
  career_path_pro: 'SPECIAL CAREER PATH PRO',
  guess_the_transfer: 'SPECIAL TRANSFER GUESS',
  guess_the_goalscorers: 'SPECIAL GOALSCORER RECALL',
  the_grid: 'SPECIAL GRID',
  the_chain: 'SPECIAL CHAIN',
  the_thread: 'SPECIAL THREAD',
  topical_quiz: 'SPECIAL QUIZ',
  top_tens: 'SPECIAL TOP TENS',
  starting_xi: 'SPECIAL STARTING XI',
};

/**
 * Hook to get the currently active special event puzzle.
 *
 * Searches today's synced puzzles for one with is_special=true
 * and constructs a SpecialEvent from its metadata.
 *
 * @returns The active SpecialEvent or null if none exist today.
 */
export function useSpecialEvent(): SpecialEvent | null {
  const { puzzles } = usePuzzleContext();

  return useMemo(() => {
    const today = getAuthorizedDateUnsafe();

    // Find today's special puzzle
    const specialPuzzle = puzzles.find(
      (p) => p.puzzle_date === today && p.is_special
    );

    if (!specialPuzzle) return null;

    const gameMode = specialPuzzle.game_mode as GameMode;
    const route = ROUTE_MAP[gameMode];

    return {
      id: specialPuzzle.id,
      gameMode,
      isActive: true,
      title: specialPuzzle.event_title || DEFAULT_TITLES[gameMode],
      subtitle: specialPuzzle.event_subtitle || '',
      tag: specialPuzzle.event_tag || 'LIMITED TIME',
      route: `/${route}/${specialPuzzle.id}` as any,
      theme: (specialPuzzle.event_theme as 'blue' | 'red' | 'gold') || 'gold',
    };
  }, [puzzles]);
}
