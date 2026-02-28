/**
 * Leaderboard Service Tests
 *
 * Tests for leaderboard service functions:
 * - transformAlltimeEntry enriches with tier name and color
 * - transformYearlyEntry maps fields correctly
 * - getLeaderboardWithUserRank routes all 3 types to the correct RPC
 * - getUserRank maps 'global' type to 'alltime' for the RPC
 * - Error handling for RPC failures
 */

// ── Module-level mock for supabase ────────────────────────────────────────
// Declare the mock fn before the jest.mock() factory so it can be referenced
// in both the factory and the tests.
const mockRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import {
  getGlobalIQLeaderboard,
  getYearlyLeaderboard,
  getDailyLeaderboard,
  getUserRank,
  getLeaderboardWithUserRank,
} from '../services/leaderboardService';

describe('leaderboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getGlobalIQLeaderboard (all-time) ────────────────────────────────────

  describe('getGlobalIQLeaderboard', () => {
    it('calls get_alltime_leaderboard RPC with default limit 100', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await getGlobalIQLeaderboard();

      expect(mockRpc).toHaveBeenCalledWith('get_alltime_leaderboard', {
        limit_count: 100,
      });
    });

    it('passes custom limit to the RPC', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await getGlobalIQLeaderboard({ limit: 25 });

      expect(mockRpc).toHaveBeenCalledWith('get_alltime_leaderboard', {
        limit_count: 25,
      });
    });

    it('enriches entries with tier name and tier color', async () => {
      const row = {
        rank: 1,
        user_id: 'user-abc',
        display_name: 'Top Player',
        avatar_url: null,
        total_iq: 500, // Chief Scout tier (tier 5)
        total_games: 50,
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const entries = await getGlobalIQLeaderboard();

      expect(entries).toHaveLength(1);
      const entry = entries[0];
      expect(entry.tierName).toBeDefined();
      expect(entry.tierName).not.toBe('');
      expect(entry.tierColor).toBeDefined();
      expect(entry.tierColor).toMatch(/^#/); // Should be a hex color
    });

    it('maps row fields to LeaderboardEntry shape', async () => {
      const row = {
        rank: 3,
        user_id: 'user-xyz',
        display_name: 'Charlie',
        avatar_url: 'https://example.com/avatar.jpg',
        total_iq: 1500,
        total_games: 120,
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const entries = await getGlobalIQLeaderboard();
      const entry = entries[0];

      expect(entry.rank).toBe(3);
      expect(entry.userId).toBe('user-xyz');
      expect(entry.displayName).toBe('Charlie');
      expect(entry.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(entry.score).toBe(1500);
      expect(entry.gamesPlayed).toBe(120);
    });

    it('assigns correct tier name for Intern tier (0–24 IQ)', async () => {
      const row = {
        rank: 1,
        user_id: 'user-1',
        display_name: 'Newbie',
        avatar_url: null,
        total_iq: 0,
        total_games: 1,
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const [entry] = await getGlobalIQLeaderboard();

      expect(entry.tierName).toBe('Intern');
    });

    it('assigns correct tier name for The Gaffer tier (20000+ IQ)', async () => {
      const row = {
        rank: 1,
        user_id: 'user-1',
        display_name: 'Legend',
        avatar_url: null,
        total_iq: 25000,
        total_games: 999,
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const [entry] = await getGlobalIQLeaderboard();

      expect(entry.tierName).toBe('The Gaffer');
    });

    it('returns empty array when RPC returns no rows', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const entries = await getGlobalIQLeaderboard();

      expect(entries).toEqual([]);
    });

    it('throws an error when the RPC returns an error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      await expect(getGlobalIQLeaderboard()).rejects.toThrow(
        'Failed to fetch alltime leaderboard'
      );
    });
  });

  // ── getYearlyLeaderboard ─────────────────────────────────────────────────

  describe('getYearlyLeaderboard', () => {
    it('calls get_yearly_leaderboard RPC with current year and default limit', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      const currentYear = new Date().getFullYear();

      await getYearlyLeaderboard();

      expect(mockRpc).toHaveBeenCalledWith('get_yearly_leaderboard', {
        for_year: currentYear,
        limit_count: 100,
      });
    });

    it('passes custom year and limit to the RPC', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await getYearlyLeaderboard({ year: 2024, limit: 50 });

      expect(mockRpc).toHaveBeenCalledWith('get_yearly_leaderboard', {
        for_year: 2024,
        limit_count: 50,
      });
    });

    it('maps row fields to LeaderboardEntry shape', async () => {
      const row = {
        rank: 2,
        user_id: 'user-year',
        display_name: 'Year King',
        avatar_url: null,
        yearly_score: 3200,
        games_played: 80,
        last_completed_at: '2024-06-15T12:00:00Z',
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const [entry] = await getYearlyLeaderboard();

      expect(entry.rank).toBe(2);
      expect(entry.userId).toBe('user-year');
      expect(entry.displayName).toBe('Year King');
      expect(entry.avatarUrl).toBeNull();
      expect(entry.score).toBe(3200);
      expect(entry.gamesPlayed).toBe(80);
      expect(entry.lastCompletedAt).toBe('2024-06-15T12:00:00Z');
    });

    it('does not set tierName or tierColor on yearly entries', async () => {
      const row = {
        rank: 1,
        user_id: 'user-1',
        display_name: 'Alice',
        avatar_url: null,
        yearly_score: 1000,
        games_played: 30,
        last_completed_at: '2024-12-31T00:00:00Z',
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const [entry] = await getYearlyLeaderboard();

      expect(entry.tierName).toBeUndefined();
      expect(entry.tierColor).toBeUndefined();
    });

    it('throws an error when the RPC returns an error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'yearly RPC failed' },
      });

      await expect(getYearlyLeaderboard()).rejects.toThrow(
        'Failed to fetch yearly leaderboard'
      );
    });
  });

  // ── getDailyLeaderboard ──────────────────────────────────────────────────

  describe('getDailyLeaderboard', () => {
    it('calls get_daily_leaderboard RPC with today and default limit', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      const today = new Date().toISOString().split('T')[0];

      await getDailyLeaderboard();

      expect(mockRpc).toHaveBeenCalledWith('get_daily_leaderboard', {
        for_date: today,
        limit_count: 100,
      });
    });

    it('passes explicit date to the RPC', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await getDailyLeaderboard({ date: '2024-01-15' });

      expect(mockRpc).toHaveBeenCalledWith('get_daily_leaderboard', {
        for_date: '2024-01-15',
        limit_count: 100,
      });
    });

    it('maps daily_score to score field', async () => {
      const row = {
        rank: 1,
        user_id: 'user-daily',
        display_name: 'Daily Champ',
        avatar_url: null,
        daily_score: 420,
        games_played: 5,
        last_completed_at: '2024-01-15T09:00:00Z',
      };
      mockRpc.mockResolvedValue({ data: [row], error: null });

      const [entry] = await getDailyLeaderboard();

      expect(entry.score).toBe(420);
      expect(entry.gamesPlayed).toBe(5);
    });

    it('throws an error when the RPC returns an error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'daily RPC failed' },
      });

      await expect(getDailyLeaderboard()).rejects.toThrow(
        'Failed to fetch daily leaderboard'
      );
    });
  });

  // ── getUserRank ──────────────────────────────────────────────────────────

  describe('getUserRank', () => {
    it('maps leaderboard type global to alltime for the RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [{ rank: 5, score: 300, total_users: 1000 }],
        error: null,
      });

      await getUserRank('user-abc', 'global');

      const call = mockRpc.mock.calls[0];
      expect(call[0]).toBe('get_user_rank');
      expect(call[1].leaderboard_type).toBe('alltime');
    });

    it('passes daily type directly to the RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [{ rank: 10, score: 150, total_users: 500 }],
        error: null,
      });

      await getUserRank('user-abc', 'daily');

      const call = mockRpc.mock.calls[0];
      expect(call[1].leaderboard_type).toBe('daily');
    });

    it('passes yearly type directly to the RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [{ rank: 3, score: 2000, total_users: 200 }],
        error: null,
      });

      await getUserRank('user-abc', 'yearly');

      const call = mockRpc.mock.calls[0];
      expect(call[1].leaderboard_type).toBe('yearly');
    });

    it('returns UserRank object with correct fields', async () => {
      mockRpc.mockResolvedValue({
        data: [{ rank: 42, score: 880, total_users: 3500 }],
        error: null,
      });

      const result = await getUserRank('user-abc', 'daily');

      expect(result).toEqual({ rank: 42, score: 880, totalUsers: 3500 });
    });

    it('returns null when user has no completed puzzles (empty array)', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await getUserRank('user-new', 'daily');

      expect(result).toBeNull();
    });

    it('returns null when data is null', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await getUserRank('user-new', 'daily');

      expect(result).toBeNull();
    });

    it('passes target_user_id to the RPC', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await getUserRank('my-user-id', 'daily');

      expect(mockRpc).toHaveBeenCalledWith(
        'get_user_rank',
        expect.objectContaining({ target_user_id: 'my-user-id' })
      );
    });

    it('throws an error when the RPC returns an error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'rank RPC failed' },
      });

      await expect(getUserRank('user-abc', 'daily')).rejects.toThrow(
        'Failed to fetch user rank'
      );
    });
  });

  // ── getLeaderboardWithUserRank ────────────────────────────────────────────

  describe('getLeaderboardWithUserRank', () => {
    it('calls getDailyLeaderboard RPC for daily type', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: [], error: null }) // entries
        .mockResolvedValueOnce({ data: [], error: null }); // user rank

      await getLeaderboardWithUserRank('user-1', 'daily');

      expect(mockRpc).toHaveBeenCalledWith(
        'get_daily_leaderboard',
        expect.any(Object)
      );
    });

    it('calls getYearlyLeaderboard RPC for yearly type', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      await getLeaderboardWithUserRank('user-1', 'yearly');

      expect(mockRpc).toHaveBeenCalledWith(
        'get_yearly_leaderboard',
        expect.any(Object)
      );
    });

    it('calls getGlobalIQLeaderboard RPC for global type', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      await getLeaderboardWithUserRank('user-1', 'global');

      expect(mockRpc).toHaveBeenCalledWith(
        'get_alltime_leaderboard',
        expect.any(Object)
      );
    });

    it('returns entries and userRank in the result', async () => {
      const entryRow = {
        rank: 1,
        user_id: 'user-1',
        display_name: 'Alice',
        avatar_url: null,
        daily_score: 480,
        games_played: 5,
        last_completed_at: '2024-01-15T10:00:00Z',
      };
      const rankRow = { rank: 1, score: 480, total_users: 250 };

      mockRpc
        .mockResolvedValueOnce({ data: [entryRow], error: null })
        .mockResolvedValueOnce({ data: [rankRow], error: null });

      const { entries, userRank } = await getLeaderboardWithUserRank('user-1', 'daily');

      expect(entries).toHaveLength(1);
      expect(entries[0].displayName).toBe('Alice');
      expect(userRank).toEqual({ rank: 1, score: 480, totalUsers: 250 });
    });

    it('returns null userRank when user has no rank data', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const { entries, userRank } = await getLeaderboardWithUserRank('user-new', 'daily');

      expect(entries).toEqual([]);
      expect(userRank).toBeNull();
    });

    it('makes both RPC calls in parallel (both are called)', async () => {
      mockRpc
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      await getLeaderboardWithUserRank('user-1', 'daily');

      // Both the leaderboard fetch and the rank fetch must have been called
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
  });
});
