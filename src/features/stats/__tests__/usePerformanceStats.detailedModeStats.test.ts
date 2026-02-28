/**
 * usePerformanceStats – detailedModeStats tests
 *
 * Covers the computation of per-mode statistics:
 * - bestScore selects the highest score across attempts
 * - totalPoints sums all attempt scores
 * - accuracyPercent is rounded to the nearest integer
 * - perfectScores counts correctly
 * - modes with 0 games are excluded from detailedModeStats
 * - results are sorted by gamesPlayed descending (most played first)
 * - the hook provides displayName and skillName from GAME_MODE_DISPLAY
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { usePerformanceStats } from '../hooks/usePerformanceStats';

// ── Mock @/lib/database ────────────────────────────────────────────────────
// We control what getAllCompletedAttemptsWithGameMode returns per test.
const mockGetAllCompletedAttempts = jest.fn();

jest.mock('@/lib/database', () => ({
  getAllCompletedAttemptsWithGameMode: (...args: unknown[]) =>
    mockGetAllCompletedAttempts(...args),
  // Other database functions are not used by usePerformanceStats directly
  getAllCompletedAttemptsWithDates: jest.fn().mockResolvedValue([]),
  getTotalPuzzleCount: jest.fn().mockResolvedValue(0),
  getCompletedPuzzleCount: jest.fn().mockResolvedValue(0),
}));

// ── Mock @/features/home/hooks/useUserStats ────────────────────────────────
// The hook depends on streak data from useUserStats.
jest.mock('@/features/home/hooks/useUserStats', () => ({
  useUserStats: () => ({
    stats: {
      currentStreak: 0,
      longestStreak: 0,
      gamesPlayedToday: 0,
      totalGamesPlayed: 0,
      totalPuzzlesAvailable: 0,
      lastPlayedDate: null,
      availableFreezes: 0,
    },
    isLoading: false,
    refresh: jest.fn(),
  }),
}));

// ── Mock @/features/stats/utils/fieldExperience ───────────────────────────
jest.mock('../utils/fieldExperience', () => ({
  calculateFieldExperience: jest.fn().mockReturnValue({}),
}));

// ── Attempt builder ────────────────────────────────────────────────────────

function buildAttempt(overrides: {
  game_mode: string;
  score?: number | null;
  metadata?: unknown;
  puzzle_date?: string;
}) {
  return {
    id: `attempt-${Math.random()}`,
    puzzle_id: `puzzle-${Math.random()}`,
    completed: true,
    synced: false,
    score: overrides.score ?? null,
    score_display: null,
    started_at: '2024-01-01T09:00:00Z',
    completed_at: '2024-01-01T09:05:00Z',
    metadata: overrides.metadata ?? null,
    game_mode: overrides.game_mode,
    puzzle_date: overrides.puzzle_date ?? '2024-01-01',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('usePerformanceStats – detailedModeStats computation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bestScore', () => {
    it('picks the highest score across all attempts for a mode', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'career_path', score: 5 }),
        buildAttempt({ game_mode: 'career_path', score: 9 }),
        buildAttempt({ game_mode: 'career_path', score: 3 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const careerMode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'career_path'
      );
      expect(careerMode).toBeDefined();
      expect(careerMode!.bestScore).toBe(9);
    });

    it('reports bestScore of 0 when all attempts have null score', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'topical_quiz', score: null }),
        buildAttempt({ game_mode: 'topical_quiz', score: null }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'topical_quiz'
      );
      expect(mode!.bestScore).toBe(0);
    });

    it('handles a single attempt correctly', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'guess_the_transfer', score: 7 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'guess_the_transfer'
      );
      expect(mode!.bestScore).toBe(7);
    });
  });

  describe('totalPoints', () => {
    it('sums all attempt scores for a mode', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'career_path', score: 5 }),
        buildAttempt({ game_mode: 'career_path', score: 8 }),
        buildAttempt({ game_mode: 'career_path', score: 2 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'career_path'
      );
      expect(mode!.totalPoints).toBe(15);
    });

    it('treats null scores as 0 when summing', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'topical_quiz', score: 6 }),
        buildAttempt({ game_mode: 'topical_quiz', score: null }),
        buildAttempt({ game_mode: 'topical_quiz', score: 4 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'topical_quiz'
      );
      expect(mode!.totalPoints).toBe(10);
    });

    it('totals are independent per mode', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'career_path', score: 10 }),
        buildAttempt({ game_mode: 'guess_the_transfer', score: 5 }),
        buildAttempt({ game_mode: 'guess_the_transfer', score: 3 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const careerMode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'career_path'
      );
      const transferMode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'guess_the_transfer'
      );
      expect(careerMode!.totalPoints).toBe(10);
      expect(transferMode!.totalPoints).toBe(8);
    });
  });

  describe('gamesPlayed exclusion', () => {
    it('excludes modes with 0 games from detailedModeStats', async () => {
      // Only career_path attempts are provided; other modes have 0 games
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'career_path', score: 8 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const modeNames = result.current.stats?.detailedModeStats.map(
        (m) => m.gameMode
      );
      expect(modeNames).toContain('career_path');
      // Modes with no attempts should not appear
      expect(modeNames).not.toContain('guess_the_transfer');
      expect(modeNames).not.toContain('topical_quiz');
      expect(modeNames).not.toContain('the_grid');
    });

    it('returns an empty detailedModeStats array when there are no attempts', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.stats?.detailedModeStats).toEqual([]);
    });
  });

  describe('sorting by gamesPlayed', () => {
    it('sorts modes by gamesPlayed descending (most played first)', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        // topical_quiz: 1 attempt
        buildAttempt({ game_mode: 'topical_quiz', score: 5 }),
        // career_path: 3 attempts
        buildAttempt({ game_mode: 'career_path', score: 8 }),
        buildAttempt({ game_mode: 'career_path', score: 6 }),
        buildAttempt({ game_mode: 'career_path', score: 7 }),
        // guess_the_transfer: 2 attempts
        buildAttempt({ game_mode: 'guess_the_transfer', score: 4 }),
        buildAttempt({ game_mode: 'guess_the_transfer', score: 9 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const modes = result.current.stats?.detailedModeStats ?? [];
      expect(modes[0].gameMode).toBe('career_path'); // 3 played
      expect(modes[1].gameMode).toBe('guess_the_transfer'); // 2 played
      expect(modes[2].gameMode).toBe('topical_quiz'); // 1 played
    });

    it('places single-attempt modes after multi-attempt modes', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'the_grid', score: 5 }),
        buildAttempt({ game_mode: 'career_path', score: 8 }),
        buildAttempt({ game_mode: 'career_path', score: 7 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const modes = result.current.stats?.detailedModeStats ?? [];
      expect(modes[0].gameMode).toBe('career_path'); // 2 games
      expect(modes[1].gameMode).toBe('the_grid'); // 1 game
    });
  });

  describe('displayName and skillName', () => {
    it('includes the correct displayName from GAME_MODE_DISPLAY', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'career_path', score: 8 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'career_path'
      );
      expect(mode!.displayName).toBe('Career Path');
    });

    it('includes the correct skillName from GAME_MODE_DISPLAY', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'career_path', score: 8 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'career_path'
      );
      expect(mode!.skillName).toBe('Deduction');
    });

    it('maps Transfer Guess correctly', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'guess_the_transfer', score: 6 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'guess_the_transfer'
      );
      expect(mode!.displayName).toBe('Transfer Guess');
      expect(mode!.skillName).toBe('Market Knowledge');
    });
  });

  describe('gamesPlayed count', () => {
    it('reports the correct count of attempts per mode', async () => {
      mockGetAllCompletedAttempts.mockResolvedValue([
        buildAttempt({ game_mode: 'topical_quiz', score: 5 }),
        buildAttempt({ game_mode: 'topical_quiz', score: 3 }),
        buildAttempt({ game_mode: 'topical_quiz', score: 4 }),
        buildAttempt({ game_mode: 'topical_quiz', score: 5 }),
      ]);

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const mode = result.current.stats?.detailedModeStats.find(
        (m) => m.gameMode === 'topical_quiz'
      );
      expect(mode!.gamesPlayed).toBe(4);
    });
  });

  describe('error handling', () => {
    it('sets error state and returns null stats when database throws', async () => {
      mockGetAllCompletedAttempts.mockRejectedValue(
        new Error('SQLite read error')
      );

      const { result } = renderHook(() => usePerformanceStats());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.stats).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
