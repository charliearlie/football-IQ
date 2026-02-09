/**
 * Tests for the special-event filtering logic used in useDailyPuzzles.
 *
 * The actual hook pulls in SQLite, navigation, auth etc.
 * Instead of rendering the full hook, we test the pure filtering
 * logic directly — same predicate used at line ~111 of useDailyPuzzles.ts.
 */

interface MinimalPuzzle {
  id: string;
  game_mode: string;
  puzzle_date: string;
  is_special: boolean | number;
}

/** Same filter predicate as useDailyPuzzles.loadCards() */
function filterDailyPuzzles(puzzles: MinimalPuzzle[], today: string) {
  return puzzles.filter((p) => p.puzzle_date === today && !p.is_special);
}

describe('useDailyPuzzles — filtering logic', () => {
  const today = '2026-02-15';

  it('excludes special event puzzles from the daily feed', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'regular-cp', game_mode: 'career_path', puzzle_date: today, is_special: false },
      { id: 'special-cp', game_mode: 'career_path', puzzle_date: today, is_special: true },
      { id: 'regular-grid', game_mode: 'the_grid', puzzle_date: today, is_special: false },
    ];

    const result = filterDailyPuzzles(puzzles, today);
    const ids = result.map((p) => p.id);

    expect(ids).toContain('regular-cp');
    expect(ids).toContain('regular-grid');
    expect(ids).not.toContain('special-cp');
  });

  it('returns empty when only special puzzles exist', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'special-only', game_mode: 'career_path', puzzle_date: today, is_special: true },
    ];

    expect(filterDailyPuzzles(puzzles, today)).toHaveLength(0);
  });

  it('excludes puzzles from other dates', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'yesterday', game_mode: 'career_path', puzzle_date: '2026-02-14', is_special: false },
      { id: 'today', game_mode: 'career_path', puzzle_date: today, is_special: false },
    ];

    const result = filterDailyPuzzles(puzzles, today);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('today');
  });

  it('handles numeric is_special from SQLite (0/1)', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'regular', game_mode: 'career_path', puzzle_date: today, is_special: 0 },
      { id: 'special', game_mode: 'career_path', puzzle_date: today, is_special: 1 },
    ];

    const result = filterDailyPuzzles(puzzles, today);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('regular');
  });

  it('returns all regular puzzles when no specials exist', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'cp', game_mode: 'career_path', puzzle_date: today, is_special: false },
      { id: 'grid', game_mode: 'the_grid', puzzle_date: today, is_special: false },
      { id: 'chain', game_mode: 'the_chain', puzzle_date: today, is_special: false },
    ];

    expect(filterDailyPuzzles(puzzles, today)).toHaveLength(3);
  });
});

/**
 * Tests for isSpecialCompleted logic used in useDailyPuzzles.
 * Mirrors the check at the end of loadCards().
 */
describe('useDailyPuzzles — special completion logic', () => {
  const today = '2026-02-15';

  interface MockAttempt {
    completed: boolean;
  }

  /** Same logic as useDailyPuzzles.loadCards() special completion check */
  function resolveIsSpecialCompleted(
    puzzles: MinimalPuzzle[],
    todayDate: string,
    attempt: MockAttempt | null
  ): boolean {
    const specialPuzzle = puzzles.find((p) => p.puzzle_date === todayDate && p.is_special);
    if (!specialPuzzle) return false;
    return attempt?.completed === true;
  }

  it('returns false when no special puzzle exists', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'regular', game_mode: 'career_path', puzzle_date: today, is_special: false },
    ];
    expect(resolveIsSpecialCompleted(puzzles, today, null)).toBe(false);
  });

  it('returns false when special puzzle has no attempt', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'special', game_mode: 'career_path', puzzle_date: today, is_special: true },
    ];
    expect(resolveIsSpecialCompleted(puzzles, today, null)).toBe(false);
  });

  it('returns false when special puzzle is in progress', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'special', game_mode: 'career_path', puzzle_date: today, is_special: true },
    ];
    expect(resolveIsSpecialCompleted(puzzles, today, { completed: false })).toBe(false);
  });

  it('returns true when special puzzle is completed', () => {
    const puzzles: MinimalPuzzle[] = [
      { id: 'special', game_mode: 'career_path', puzzle_date: today, is_special: true },
    ];
    expect(resolveIsSpecialCompleted(puzzles, today, { completed: true })).toBe(true);
  });
});
