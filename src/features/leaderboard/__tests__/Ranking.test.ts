/**
 * Ranking Logic Tests
 *
 * TDD tests for leaderboard ranking calculations:
 * - Tie-breaking by completion time
 * - Dense ranking (1,1,2 not 1,1,3)
 * - Sticky bar visibility logic
 * - Score normalization per game mode
 */

import {
  applyDenseRanking,
  sortByScoreAndTime,
  shouldShowStickyBar,
  calculateDailyScore,
  normalizeModeScore,
} from '../utils/rankingUtils';
import { LeaderboardEntry, StickyMeConfig } from '../types/leaderboard.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

describe('Leaderboard Ranking', () => {
  describe('sortByScoreAndTime (tie-breaking)', () => {
    it('ranks users by score descending', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 200, lastCompletedAt: '2024-01-01T10:00:00Z' },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:30:00Z' },
        { userId: 'c', displayName: 'Charlie', avatarUrl: null, score: 250, lastCompletedAt: '2024-01-01T10:15:00Z' },
      ];

      const sorted = sortByScoreAndTime(entries);

      expect(sorted[0].userId).toBe('b'); // 300 points
      expect(sorted[1].userId).toBe('c'); // 250 points
      expect(sorted[2].userId).toBe('a'); // 200 points
    });

    it('ranks users with same score by earlier completion time first', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:30:00Z' },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:00:00Z' },
        { userId: 'c', displayName: 'Charlie', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:15:00Z' },
      ];

      const sorted = sortByScoreAndTime(entries);

      expect(sorted[0].userId).toBe('b'); // Completed first at 10:00
      expect(sorted[1].userId).toBe('c'); // Completed second at 10:15
      expect(sorted[2].userId).toBe('a'); // Completed last at 10:30
    });

    it('falls back to userId for deterministic ordering when all else equal', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'c', displayName: 'Charlie', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:00:00Z' },
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:00:00Z' },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:00:00Z' },
      ];

      const sorted = sortByScoreAndTime(entries);

      // Same score and time, should order by userId alphabetically
      expect(sorted[0].userId).toBe('a');
      expect(sorted[1].userId).toBe('b');
      expect(sorted[2].userId).toBe('c');
    });

    it('handles entries without completion time', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300 },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 300, lastCompletedAt: '2024-01-01T10:00:00Z' },
      ];

      const sorted = sortByScoreAndTime(entries);

      // Entry with completion time should come first
      expect(sorted[0].userId).toBe('b');
      expect(sorted[1].userId).toBe('a');
    });
  });

  describe('applyDenseRanking', () => {
    it('applies dense ranking (1, 1, 2 not 1, 1, 3)', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300 },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 300 },
        { userId: 'c', displayName: 'Charlie', avatarUrl: null, score: 200 },
      ];

      const ranked = applyDenseRanking(entries);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1); // Same score = same rank
      expect(ranked[2].rank).toBe(2); // Next rank is 2, not 3
    });

    it('handles multiple tie groups', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300 },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 300 },
        { userId: 'c', displayName: 'Charlie', avatarUrl: null, score: 200 },
        { userId: 'd', displayName: 'Diana', avatarUrl: null, score: 200 },
        { userId: 'e', displayName: 'Eve', avatarUrl: null, score: 100 },
      ];

      const ranked = applyDenseRanking(entries);

      expect(ranked.map((e) => e.rank)).toEqual([1, 1, 2, 2, 3]);
    });

    it('handles all unique scores', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300 },
        { userId: 'b', displayName: 'Bob', avatarUrl: null, score: 200 },
        { userId: 'c', displayName: 'Charlie', avatarUrl: null, score: 100 },
      ];

      const ranked = applyDenseRanking(entries);

      expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3]);
    });

    it('returns empty array for empty input', () => {
      const ranked = applyDenseRanking([]);
      expect(ranked).toEqual([]);
    });

    it('handles single entry', () => {
      const entries: Omit<LeaderboardEntry, 'rank'>[] = [
        { userId: 'a', displayName: 'Alice', avatarUrl: null, score: 300 },
      ];

      const ranked = applyDenseRanking(entries);

      expect(ranked[0].rank).toBe(1);
    });
  });

  describe('shouldShowStickyBar', () => {
    it('returns false when user is visible in list', () => {
      const entries = createMockEntries(20);
      // Put user at index 5 (within visible range 0-10)
      entries[5].userId = 'user-123';

      const result = shouldShowStickyBar({
        currentUserId: 'user-123',
        entries,
        visibleRange: { start: 0, end: 10 },
        userRank: { rank: 6, score: 250, totalUsers: 100 },
      });

      expect(result.shouldShowStickyBar).toBe(false);
      expect(result.isUserVisible).toBe(true);
    });

    it('shows sticky bar when user is below visible range', () => {
      const entries = createMockEntries(100);
      // Put user at index 50
      entries[50].userId = 'user-123';

      const result = shouldShowStickyBar({
        currentUserId: 'user-123',
        entries,
        visibleRange: { start: 0, end: 10 },
        userRank: { rank: 51, score: 150, totalUsers: 100 },
      });

      expect(result.shouldShowStickyBar).toBe(true);
      expect(result.isUserVisible).toBe(false);
      expect(result.userIndex).toBe(50);
    });

    it('shows sticky bar when user is above visible range (scrolled down)', () => {
      const entries = createMockEntries(100);
      // Put user at index 5
      entries[5].userId = 'user-123';

      const result = shouldShowStickyBar({
        currentUserId: 'user-123',
        entries,
        visibleRange: { start: 20, end: 30 },
        userRank: { rank: 6, score: 350, totalUsers: 100 },
      });

      expect(result.shouldShowStickyBar).toBe(true);
      expect(result.isUserVisible).toBe(false);
    });

    it('shows sticky bar when user not in top 100', () => {
      const entries = createMockEntries(100);
      // User is not in entries at all

      const result = shouldShowStickyBar({
        currentUserId: 'user-outside',
        entries,
        visibleRange: { start: 0, end: 10 },
        userRank: { rank: 150, score: 50, totalUsers: 200 },
      });

      expect(result.shouldShowStickyBar).toBe(true);
      expect(result.isUserVisible).toBe(false);
      expect(result.userIndex).toBe(-1);
    });

    it('returns false when user has no rank (no completed puzzles)', () => {
      const entries = createMockEntries(100);

      const result = shouldShowStickyBar({
        currentUserId: 'new-user',
        entries,
        visibleRange: { start: 0, end: 10 },
        userRank: null,
      });

      expect(result.shouldShowStickyBar).toBe(false);
    });
  });

  describe('normalizeModeScore', () => {
    it('normalizes career_path score correctly', () => {
      const result = normalizeModeScore('career_path', { points: 8, maxPoints: 10 });
      expect(result).toBe(80);
    });

    it('normalizes career_path with variable maxPoints', () => {
      const result = normalizeModeScore('career_path', { points: 7, maxPoints: 8 });
      expect(result).toBe(88); // 7/8 * 100 = 87.5 rounded to 88
    });

    it('normalizes guess_the_transfer score correctly', () => {
      const result = normalizeModeScore('guess_the_transfer', { points: 6 });
      expect(result).toBe(60);
    });

    it('normalizes guess_the_goalscorers percentage directly', () => {
      const result = normalizeModeScore('guess_the_goalscorers', { percentage: 75 });
      expect(result).toBe(75);
    });

    it('normalizes tic_tac_toe win to 100', () => {
      expect(normalizeModeScore('the_grid', { result: 'win' })).toBe(100);
    });

    it('normalizes tic_tac_toe draw to 50', () => {
      expect(normalizeModeScore('the_grid', { result: 'draw' })).toBe(50);
    });

    it('normalizes tic_tac_toe loss to 0', () => {
      expect(normalizeModeScore('the_grid', { result: 'loss' })).toBe(0);
    });

    it('normalizes topical_quiz score correctly', () => {
      const result = normalizeModeScore('topical_quiz', { points: 8 });
      expect(result).toBe(80);
    });

    it('returns 0 for missing metadata', () => {
      expect(normalizeModeScore('career_path', null)).toBe(0);
      expect(normalizeModeScore('career_path', undefined)).toBe(0);
    });

    it('returns 0 for invalid game mode', () => {
      expect(normalizeModeScore('unknown_mode' as GameMode, { points: 10 })).toBe(0);
    });
  });

  describe('calculateDailyScore', () => {
    it('sums normalized scores across all game modes (max 500)', () => {
      const attempts = [
        { gameMode: 'career_path' as GameMode, metadata: { points: 10, maxPoints: 10 } },
        { gameMode: 'guess_the_transfer' as GameMode, metadata: { points: 10 } },
        { gameMode: 'guess_the_goalscorers' as GameMode, metadata: { percentage: 100 } },
        { gameMode: 'the_grid' as GameMode, metadata: { result: 'win' } },
        { gameMode: 'topical_quiz' as GameMode, metadata: { points: 10 } },
      ];

      const result = calculateDailyScore(attempts);

      expect(result.totalScore).toBe(500); // 100 + 100 + 100 + 100 + 100
      expect(result.gamesPlayed).toBe(5);
    });

    it('calculates partial day score correctly', () => {
      const attempts = [
        { gameMode: 'career_path' as GameMode, metadata: { points: 8, maxPoints: 10 } },
        { gameMode: 'guess_the_transfer' as GameMode, metadata: { points: 6 } },
      ];

      const result = calculateDailyScore(attempts);

      expect(result.totalScore).toBe(140); // 80 + 60
      expect(result.gamesPlayed).toBe(2);
    });

    it('returns 0 for empty attempts', () => {
      const result = calculateDailyScore([]);

      expect(result.totalScore).toBe(0);
      expect(result.gamesPlayed).toBe(0);
    });

    it('includes breakdown by game mode', () => {
      const attempts = [
        { gameMode: 'career_path' as GameMode, metadata: { points: 8, maxPoints: 10 } },
        { gameMode: 'topical_quiz' as GameMode, metadata: { points: 6 } },
      ];

      const result = calculateDailyScore(attempts);

      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0]).toEqual({
        gameMode: 'career_path',
        normalizedScore: 80,
        completed: true,
      });
      expect(result.breakdown[1]).toEqual({
        gameMode: 'topical_quiz',
        normalizedScore: 60,
        completed: true,
      });
    });

    it('handles duplicate game mode attempts (takes first only)', () => {
      // User should only have one attempt per game mode per day
      // But if duplicates exist, take the first one
      const attempts = [
        { gameMode: 'career_path' as GameMode, metadata: { points: 10, maxPoints: 10 } },
        { gameMode: 'career_path' as GameMode, metadata: { points: 5, maxPoints: 10 } },
      ];

      const result = calculateDailyScore(attempts);

      expect(result.totalScore).toBe(100); // Only first attempt counts
      expect(result.gamesPlayed).toBe(1);
    });
  });
});

// Helper function to create mock entries
function createMockEntries(count: number): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    userId: `user-${i}`,
    displayName: `User ${i}`,
    avatarUrl: null,
    score: 500 - i * 5,
  }));
}
