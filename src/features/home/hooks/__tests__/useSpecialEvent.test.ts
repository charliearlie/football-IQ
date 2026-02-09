import { renderHook } from '@testing-library/react-native';
import { useSpecialEvent } from '../useSpecialEvent';

const mockPuzzles: any[] = [];

jest.mock('@/features/puzzles', () => ({
  usePuzzleContext: () => ({
    puzzles: mockPuzzles,
  }),
}));

jest.mock('@/lib/time', () => ({
  getAuthorizedDateUnsafe: () => '2026-02-15',
}));

describe('useSpecialEvent', () => {
  beforeEach(() => {
    mockPuzzles.length = 0;
  });

  it('returns null when no special puzzles exist today', () => {
    mockPuzzles.push({
      id: 'regular-1',
      game_mode: 'career_path',
      puzzle_date: '2026-02-15',
      is_special: false,
    });

    const { result } = renderHook(() => useSpecialEvent());
    expect(result.current).toBeNull();
  });

  it('returns null when special puzzle is on a different date', () => {
    mockPuzzles.push({
      id: 'special-wrong-day',
      game_mode: 'career_path',
      puzzle_date: '2026-02-14',
      is_special: true,
      event_title: 'DERBY DAY',
    });

    const { result } = renderHook(() => useSpecialEvent());
    expect(result.current).toBeNull();
  });

  it('returns the special event when one exists today', () => {
    mockPuzzles.push({
      id: 'special-1',
      game_mode: 'career_path',
      puzzle_date: '2026-02-15',
      is_special: true,
      event_title: 'DERBY DAY SPECIAL',
      event_subtitle: 'Double XP - Ends Tonight',
      event_tag: 'LIMITED TIME',
      event_theme: 'gold',
    });

    const { result } = renderHook(() => useSpecialEvent());
    expect(result.current).not.toBeNull();
    expect(result.current?.id).toBe('special-1');
    expect(result.current?.title).toBe('DERBY DAY SPECIAL');
    expect(result.current?.subtitle).toBe('Double XP - Ends Tonight');
    expect(result.current?.tag).toBe('LIMITED TIME');
    expect(result.current?.theme).toBe('gold');
    expect(result.current?.gameMode).toBe('career_path');
    expect(result.current?.route).toBe('/career-path/special-1');
    expect(result.current?.isActive).toBe(true);
  });

  it('uses default title when event_title is missing', () => {
    mockPuzzles.push({
      id: 'special-no-title',
      game_mode: 'the_grid',
      puzzle_date: '2026-02-15',
      is_special: true,
      event_title: null,
      event_subtitle: null,
      event_tag: null,
      event_theme: null,
    });

    const { result } = renderHook(() => useSpecialEvent());
    expect(result.current?.title).toBe('SPECIAL GRID');
    expect(result.current?.subtitle).toBe('');
    expect(result.current?.tag).toBe('LIMITED TIME');
    expect(result.current?.theme).toBe('gold');
  });

  it('uses red theme when specified', () => {
    mockPuzzles.push({
      id: 'special-red',
      game_mode: 'career_path',
      puzzle_date: '2026-02-15',
      is_special: true,
      event_title: 'CUP FINAL',
      event_theme: 'red',
    });

    const { result } = renderHook(() => useSpecialEvent());
    expect(result.current?.theme).toBe('red');
  });

  it('ignores non-special puzzles and finds the special one', () => {
    mockPuzzles.push(
      {
        id: 'regular-1',
        game_mode: 'career_path',
        puzzle_date: '2026-02-15',
        is_special: false,
      },
      {
        id: 'special-today',
        game_mode: 'the_chain',
        puzzle_date: '2026-02-15',
        is_special: true,
        event_title: 'CHAIN CHALLENGE',
        event_tag: 'WEEKEND SPECIAL',
        event_theme: 'blue',
      }
    );

    const { result } = renderHook(() => useSpecialEvent());
    expect(result.current?.id).toBe('special-today');
    expect(result.current?.gameMode).toBe('the_chain');
    expect(result.current?.route).toBe('/the-chain/special-today');
  });
});
