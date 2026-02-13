/**
 * Field Experience Tests (TDD)
 *
 * Tests for the "Field Experience" feature which tracks completed puzzle
 * counts per game mode, providing an "Overall Appearances" metric.
 *
 * Following TDD: Tests written first, implementation follows.
 */

import {
  calculateFieldExperience,
  getDominantMode,
  FieldExperience,
  ALL_GAME_MODES,
} from '../utils/fieldExperience';
import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Helper to create mock attempts for testing.
 */
function createMockAttempt(
  gameMode: string,
  puzzleId: string = `puzzle-${Math.random()}`
): AttemptWithGameMode {
  return {
    id: `attempt-${Math.random()}`,
    puzzle_id: puzzleId,
    completed: true,
    score: 100,
    score_display: '100%',
    metadata: { points: 100 },
    started_at: '2026-01-01T10:00:00Z',
    completed_at: '2026-01-01T10:05:00Z',
    synced: true,
    puzzle_date: '2026-01-01',
    game_mode: gameMode,
  };
}

/**
 * Helper to create multiple attempts for a specific mode.
 */
function createMockAttemptsForMode(
  gameMode: GameMode,
  count: number
): AttemptWithGameMode[] {
  return Array.from({ length: count }, (_, i) =>
    createMockAttempt(gameMode, `puzzle-${gameMode}-${i}`)
  );
}

describe('calculateFieldExperience', () => {
  describe('per-mode counts', () => {
    it('returns 0 for all modes with empty attempts array', () => {
      const result = calculateFieldExperience([]);

      expect(result.totalAppearances).toBe(0);
      expect(result.dominantMode).toBeNull();

      // All modes should be 0
      for (const mode of ALL_GAME_MODES) {
        expect(result.byMode[mode]).toBe(0);
      }
    });

    it('counts completed attempts per game mode correctly', () => {
      const attempts: AttemptWithGameMode[] = [
        createMockAttempt('career_path'),
        createMockAttempt('career_path'),
        createMockAttempt('career_path'),
        createMockAttempt('guess_the_transfer'),
        createMockAttempt('guess_the_transfer'),
        createMockAttempt('the_grid'),
      ];

      const result = calculateFieldExperience(attempts);

      expect(result.byMode.career_path).toBe(3);
      expect(result.byMode.guess_the_transfer).toBe(2);
      expect(result.byMode.the_grid).toBe(1);
      expect(result.byMode.topical_quiz).toBe(0);
    });

    it('handles single attempt in one mode', () => {
      const attempts: AttemptWithGameMode[] = [
        createMockAttempt('starting_xi'),
      ];

      const result = calculateFieldExperience(attempts);

      expect(result.byMode.starting_xi).toBe(1);
      expect(result.totalAppearances).toBe(1);
      expect(result.dominantMode).toBe('starting_xi');
    });

    it('handles multiple attempts across all 8 modes', () => {
      const attempts: AttemptWithGameMode[] = [
        ...createMockAttemptsForMode('career_path', 5),
        ...createMockAttemptsForMode('career_path_pro', 3),
        ...createMockAttemptsForMode('guess_the_transfer', 7),
        ...createMockAttemptsForMode('guess_the_goalscorers', 2),
        ...createMockAttemptsForMode('the_grid', 10),
        ...createMockAttemptsForMode('topical_quiz', 4),
        ...createMockAttemptsForMode('top_tens', 6),
        ...createMockAttemptsForMode('starting_xi', 8),
      ];

      const result = calculateFieldExperience(attempts);

      expect(result.byMode.career_path).toBe(5);
      expect(result.byMode.career_path_pro).toBe(3);
      expect(result.byMode.guess_the_transfer).toBe(7);
      expect(result.byMode.guess_the_goalscorers).toBe(2);
      expect(result.byMode.the_grid).toBe(10);
      expect(result.byMode.topical_quiz).toBe(4);
      expect(result.byMode.top_tens).toBe(6);
      expect(result.byMode.starting_xi).toBe(8);
    });

    it('excludes incomplete attempts', () => {
      const incompleteAttempt: AttemptWithGameMode = {
        ...createMockAttempt('career_path'),
        completed: false,
      };

      const completeAttempt = createMockAttempt('career_path');

      const attempts = [incompleteAttempt, completeAttempt];
      const result = calculateFieldExperience(attempts);

      // Only the completed attempt should count
      expect(result.byMode.career_path).toBe(1);
      expect(result.totalAppearances).toBe(1);
    });
  });

  describe('total appearances', () => {
    it('returns 0 total with no attempts', () => {
      const result = calculateFieldExperience([]);
      expect(result.totalAppearances).toBe(0);
    });

    it('sums all completed attempts across all modes', () => {
      const attempts: AttemptWithGameMode[] = [
        ...createMockAttemptsForMode('career_path', 10),
        ...createMockAttemptsForMode('guess_the_transfer', 15),
        ...createMockAttemptsForMode('the_grid', 25),
      ];

      const result = calculateFieldExperience(attempts);
      expect(result.totalAppearances).toBe(50);
    });

    it('handles large numbers of attempts', () => {
      const attempts: AttemptWithGameMode[] = [
        ...createMockAttemptsForMode('career_path', 100),
        ...createMockAttemptsForMode('topical_quiz', 200),
      ];

      const result = calculateFieldExperience(attempts);
      expect(result.totalAppearances).toBe(300);
    });
  });

  describe('edge cases', () => {
    it('handles null/undefined attempts gracefully', () => {
      const resultNull = calculateFieldExperience(null as any);
      expect(resultNull.totalAppearances).toBe(0);

      const resultUndefined = calculateFieldExperience(undefined as any);
      expect(resultUndefined.totalAppearances).toBe(0);
    });

    it('handles attempts with unknown game_mode', () => {
      const attempts: AttemptWithGameMode[] = [
        createMockAttempt('career_path'),
        createMockAttempt('unknown_mode'),
        createMockAttempt('the_grid'),
      ];

      const result = calculateFieldExperience(attempts);

      // Should only count known modes
      expect(result.byMode.career_path).toBe(1);
      expect(result.byMode.the_grid).toBe(1);
      expect(result.totalAppearances).toBe(2);
    });

    it('handles attempts with missing game_mode field', () => {
      const attemptWithoutMode = {
        ...createMockAttempt('career_path'),
        game_mode: undefined as unknown as string,
      };

      const attempts: AttemptWithGameMode[] = [
        attemptWithoutMode,
        createMockAttempt('the_grid'),
      ];

      const result = calculateFieldExperience(attempts);

      // Should skip the attempt without game_mode
      expect(result.totalAppearances).toBe(1);
      expect(result.byMode.the_grid).toBe(1);
    });
  });

  describe('dominant mode calculation', () => {
    it('returns mode with highest count', () => {
      const attempts: AttemptWithGameMode[] = [
        ...createMockAttemptsForMode('career_path', 5),
        ...createMockAttemptsForMode('the_grid', 10),
        ...createMockAttemptsForMode('topical_quiz', 3),
      ];

      const result = calculateFieldExperience(attempts);
      expect(result.dominantMode).toBe('the_grid');
    });

    it('returns first mode alphabetically on tie', () => {
      const attempts: AttemptWithGameMode[] = [
        ...createMockAttemptsForMode('career_path', 5),
        ...createMockAttemptsForMode('the_grid', 5),
      ];

      const result = calculateFieldExperience(attempts);
      // career_path comes before the_grid alphabetically
      expect(result.dominantMode).toBe('career_path');
    });

    it('returns null when no games played', () => {
      const result = calculateFieldExperience([]);
      expect(result.dominantMode).toBeNull();
    });
  });
});

describe('getDominantMode', () => {
  it('returns mode with highest count from byMode record', () => {
    const byMode: Record<GameMode, number> = {
      career_path: 5,
      career_path_pro: 3,
      guess_the_transfer: 10,
      guess_the_goalscorers: 2,
      the_grid: 7,
      the_chain: 1,
      the_thread: 0,
      topical_quiz: 4,
      top_tens: 6,
      starting_xi: 8,
    };

    const result = getDominantMode(byMode);
    expect(result).toBe('guess_the_transfer');
  });

  it('returns null when all counts are 0', () => {
    const byMode: Record<GameMode, number> = {
      career_path: 0,
      career_path_pro: 0,
      guess_the_transfer: 0,
      guess_the_goalscorers: 0,
      the_grid: 0,
      the_chain: 0,
      the_thread: 0,
      topical_quiz: 0,
      top_tens: 0,
      starting_xi: 0,
    };

    const result = getDominantMode(byMode);
    expect(result).toBeNull();
  });

  it('returns first alphabetically on tie', () => {
    const byMode: Record<GameMode, number> = {
      career_path: 5,
      career_path_pro: 5,
      guess_the_transfer: 5,
      guess_the_goalscorers: 0,
      the_grid: 0,
      the_chain: 0,
      the_thread: 0,
      topical_quiz: 0,
      top_tens: 0,
      starting_xi: 0,
    };

    const result = getDominantMode(byMode);
    // career_path comes first alphabetically among the tied modes
    expect(result).toBe('career_path');
  });
});

describe('ALL_GAME_MODES constant', () => {
  it('contains exactly 10 game modes', () => {
    expect(ALL_GAME_MODES).toHaveLength(10);
  });

  it('includes all expected modes', () => {
    expect(ALL_GAME_MODES).toContain('career_path');
    expect(ALL_GAME_MODES).toContain('career_path_pro');
    expect(ALL_GAME_MODES).toContain('guess_the_transfer');
    expect(ALL_GAME_MODES).toContain('guess_the_goalscorers');
    expect(ALL_GAME_MODES).toContain('the_grid');
    expect(ALL_GAME_MODES).toContain('the_chain');
    expect(ALL_GAME_MODES).toContain('the_thread');
    expect(ALL_GAME_MODES).toContain('topical_quiz');
    expect(ALL_GAME_MODES).toContain('top_tens');
    expect(ALL_GAME_MODES).toContain('starting_xi');
  });
});

describe('FieldExperience interface', () => {
  it('has correct shape', () => {
    const fieldExperience: FieldExperience = {
      byMode: {
        career_path: 5,
        career_path_pro: 3,
        guess_the_transfer: 10,
        guess_the_goalscorers: 2,
        the_grid: 7,
        the_chain: 1,
        the_thread: 0,
        topical_quiz: 4,
        top_tens: 6,
        starting_xi: 8,
      },
      totalAppearances: 46,
      dominantMode: 'guess_the_transfer',
    };

    expect(fieldExperience.byMode).toBeDefined();
    expect(fieldExperience.totalAppearances).toBeDefined();
    expect(fieldExperience.dominantMode).toBeDefined();
  });
});
