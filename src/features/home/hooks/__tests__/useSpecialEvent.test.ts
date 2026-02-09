/**
 * Tests for useSpecialEvent logic.
 *
 * Tests the core filtering logic as pure functions
 * to avoid heavy React Native test infrastructure.
 *
 * Completion hiding is handled by useDailyPuzzles.isSpecialCompleted
 * and tested in useDailyPuzzles.test.ts.
 */

interface MockPuzzle {
  id: string;
  game_mode: string;
  puzzle_date: string;
  is_special: boolean;
  event_title?: string | null;
  event_subtitle?: string | null;
  event_tag?: string | null;
  event_theme?: string | null;
}

const ROUTE_MAP: Record<string, string> = {
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

const DEFAULT_TITLES: Record<string, string> = {
  career_path: 'SPECIAL CAREER PATH',
  the_grid: 'SPECIAL GRID',
  the_chain: 'SPECIAL CHAIN',
  top_tens: 'SPECIAL TOP TENS',
};

/**
 * Mirrors the logic in useSpecialEvent's useMemo.
 */
function resolveSpecialEvent(puzzles: MockPuzzle[], today: string) {
  const specialPuzzle = puzzles.find(
    (p) => p.puzzle_date === today && p.is_special
  );

  if (!specialPuzzle) return null;

  const gameMode = specialPuzzle.game_mode;
  const route = ROUTE_MAP[gameMode];

  return {
    id: specialPuzzle.id,
    gameMode,
    isActive: true,
    title: specialPuzzle.event_title || DEFAULT_TITLES[gameMode] || 'SPECIAL',
    subtitle: specialPuzzle.event_subtitle || '',
    tag: specialPuzzle.event_tag || 'LIMITED TIME',
    route: `/${route}/${specialPuzzle.id}`,
    theme: specialPuzzle.event_theme || 'gold',
  };
}

const TODAY = '2026-02-15';

describe('useSpecialEvent logic', () => {
  it('returns null when no special puzzles exist today', () => {
    const result = resolveSpecialEvent(
      [{ id: 'regular-1', game_mode: 'career_path', puzzle_date: TODAY, is_special: false }],
      TODAY
    );
    expect(result).toBeNull();
  });

  it('returns null when special puzzle is on a different date', () => {
    const result = resolveSpecialEvent(
      [{ id: 'special-1', game_mode: 'career_path', puzzle_date: '2026-02-14', is_special: true, event_title: 'DERBY DAY' }],
      TODAY
    );
    expect(result).toBeNull();
  });

  it('returns the special event when one exists today', () => {
    const result = resolveSpecialEvent(
      [{
        id: 'special-1',
        game_mode: 'career_path',
        puzzle_date: TODAY,
        is_special: true,
        event_title: 'DERBY DAY SPECIAL',
        event_subtitle: 'Double XP - Ends Tonight',
        event_tag: 'LIMITED TIME',
        event_theme: 'gold',
      }],
      TODAY
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe('special-1');
    expect(result?.title).toBe('DERBY DAY SPECIAL');
    expect(result?.subtitle).toBe('Double XP - Ends Tonight');
    expect(result?.tag).toBe('LIMITED TIME');
    expect(result?.theme).toBe('gold');
    expect(result?.gameMode).toBe('career_path');
    expect(result?.route).toBe('/career-path/special-1');
    expect(result?.isActive).toBe(true);
  });

  it('uses default title when event_title is missing', () => {
    const result = resolveSpecialEvent(
      [{ id: 'special-no-title', game_mode: 'the_grid', puzzle_date: TODAY, is_special: true, event_title: null, event_subtitle: null, event_tag: null, event_theme: null }],
      TODAY
    );
    expect(result?.title).toBe('SPECIAL GRID');
    expect(result?.subtitle).toBe('');
    expect(result?.tag).toBe('LIMITED TIME');
    expect(result?.theme).toBe('gold');
  });

  it('uses red theme when specified', () => {
    const result = resolveSpecialEvent(
      [{ id: 'special-red', game_mode: 'career_path', puzzle_date: TODAY, is_special: true, event_title: 'CUP FINAL', event_theme: 'red' }],
      TODAY
    );
    expect(result?.theme).toBe('red');
  });

  it('ignores non-special puzzles and finds the special one', () => {
    const result = resolveSpecialEvent(
      [
        { id: 'regular-1', game_mode: 'career_path', puzzle_date: TODAY, is_special: false },
        { id: 'special-today', game_mode: 'the_chain', puzzle_date: TODAY, is_special: true, event_title: 'CHAIN CHALLENGE', event_tag: 'WEEKEND SPECIAL', event_theme: 'blue' },
      ],
      TODAY
    );
    expect(result?.id).toBe('special-today');
    expect(result?.gameMode).toBe('the_chain');
    expect(result?.route).toBe('/the-chain/special-today');
  });
});
