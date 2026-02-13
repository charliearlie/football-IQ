/**
 * Data Pipeline Tests
 *
 * TDD tests to verify the complete data flow from puzzle attempts
 * to calculated Global IQ and proficiency metrics.
 *
 * These tests validate that:
 * 1. normalizeScore correctly transforms game-specific scores to 0-100
 * 2. calculateProficiency aggregates attempts correctly
 * 3. calculateGlobalIQ uses weighted averaging properly
 *
 * IMPORTANT: Tests use the ACTUAL metadata fields saved by game hooks:
 * - career_path: won, totalSteps, revealedCount
 * - guess_the_transfer: won, hintsRevealed, guesses (array)
 * - guess_the_goalscorers: scorersFound, totalScorers
 * - tic_tac_toe: result ('win'|'draw'|'loss')
 * - topical_quiz: correctCount (0-5)
 */

import {
  normalizeScore,
  calculateProficiency,
  calculateGlobalIQ,
  isPerfectScore,
} from '../utils/iqCalculation';
import { GameProficiency } from '../types/stats.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Helper to create empty proficiencies for all modes except the tested one.
 */
function createEmptyProficiencies(
  excludeMode?: GameMode
): GameProficiency[] {
  const modes: { gameMode: GameMode; displayName: string }[] = [
    { gameMode: 'career_path', displayName: 'Deduction' },
    { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge' },
    { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall' },
    { gameMode: 'the_grid', displayName: 'Strategic Logic' },
    { gameMode: 'topical_quiz', displayName: 'Current Affairs' },
  ];

  return modes
    .filter((m) => m.gameMode !== excludeMode)
    .map((m) => ({
      gameMode: m.gameMode,
      displayName: m.displayName,
      percentage: 0,
      gamesPlayed: 0,
      perfectScores: 0,
    }));
}

/**
 * Helper to create a mock attempt with metadata.
 */
function createMockAttempt(metadata: Record<string, unknown>) {
  return {
    id: 'test-attempt-1',
    puzzle_id: 'test-puzzle-1',
    metadata,
    completed: true,
    synced: false,
    score: 10,
    score_display: '✅✅✅✅✅',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
}

describe('IQ Data Pipeline', () => {
  describe('normalizeScore', () => {
    describe('topical_quiz', () => {
      it('returns 100 for perfect score (5/5 correct)', () => {
        const metadata = { correctCount: 5 };
        expect(normalizeScore('topical_quiz', metadata)).toBe(100);
      });

      it('returns 60 for 3/5 correct', () => {
        const metadata = { correctCount: 3 };
        expect(normalizeScore('topical_quiz', metadata)).toBe(60);
      });

      it('returns 0 for 0 correct', () => {
        const metadata = { correctCount: 0 };
        expect(normalizeScore('topical_quiz', metadata)).toBe(0);
      });

      it('returns 0 for missing metadata', () => {
        expect(normalizeScore('topical_quiz', null)).toBe(0);
        expect(normalizeScore('topical_quiz', undefined)).toBe(0);
      });
    });

    describe('career_path', () => {
      it('returns 100 for perfect score (won on first clue)', () => {
        const metadata = { won: true, totalSteps: 5, revealedCount: 1 };
        // Score = 5 - (1 - 1) = 5 points out of 5 = 100%
        expect(normalizeScore('career_path', metadata)).toBe(100);
      });

      it('returns 80 for 4/5 points (one extra reveal)', () => {
        const metadata = { won: true, totalSteps: 5, revealedCount: 2 };
        // Score = 5 - (2 - 1) = 4 points out of 5 = 80%
        expect(normalizeScore('career_path', metadata)).toBe(80);
      });

      it('returns 0 when lost', () => {
        const metadata = { won: false, totalSteps: 5, revealedCount: 5 };
        expect(normalizeScore('career_path', metadata)).toBe(0);
      });

      it('returns 0 when totalSteps is 0', () => {
        const metadata = { won: true, totalSteps: 0, revealedCount: 0 };
        expect(normalizeScore('career_path', metadata)).toBe(0);
      });
    });

    describe('guess_the_transfer', () => {
      it('returns 100 for perfect score (no hints, no wrong guesses)', () => {
        const metadata = { won: true, hintsRevealed: 0, guesses: [] };
        // Score = 10 - (0 * 2) - 0 = 10 points = 100%
        expect(normalizeScore('guess_the_transfer', metadata)).toBe(100);
      });

      it('returns 60 for 6 points (2 hints)', () => {
        const metadata = { won: true, hintsRevealed: 2, guesses: [] };
        // Score = 10 - (2 * 2) - 0 = 6 points = 60%
        expect(normalizeScore('guess_the_transfer', metadata)).toBe(60);
      });

      it('returns 50 for 5 points (2 hints + 1 wrong guess)', () => {
        const metadata = { won: true, hintsRevealed: 2, guesses: ['wrong1'] };
        // Score = 10 - (2 * 2) - 1 = 5 points = 50%
        expect(normalizeScore('guess_the_transfer', metadata)).toBe(50);
      });

      it('returns minimum 10 for worst winning score', () => {
        const metadata = { won: true, hintsRevealed: 5, guesses: ['w1', 'w2', 'w3', 'w4', 'w5'] };
        // Score = max(1, 10 - 10 - 5) = 1 point = 10%
        expect(normalizeScore('guess_the_transfer', metadata)).toBe(10);
      });

      it('returns 0 when lost', () => {
        const metadata = { won: false, hintsRevealed: 3, guesses: ['wrong'] };
        expect(normalizeScore('guess_the_transfer', metadata)).toBe(0);
      });
    });

    describe('guess_the_goalscorers', () => {
      it('returns percentage based on scorers found', () => {
        const metadata = { scorersFound: 3, totalScorers: 4 };
        expect(normalizeScore('guess_the_goalscorers', metadata)).toBe(75);
      });

      it('returns 100 for finding all scorers', () => {
        const metadata = { scorersFound: 5, totalScorers: 5 };
        expect(normalizeScore('guess_the_goalscorers', metadata)).toBe(100);
      });

      it('returns 0 when totalScorers is 0', () => {
        const metadata = { scorersFound: 0, totalScorers: 0 };
        expect(normalizeScore('guess_the_goalscorers', metadata)).toBe(0);
      });
    });

    describe('the_grid', () => {
      it('returns 100 for 9 cells filled', () => {
        const metadata = { cellsFilled: 9 };
        expect(normalizeScore('the_grid', metadata)).toBe(100);
      });

      it('returns 56 for 5 cells filled', () => {
        const metadata = { cellsFilled: 5 };
        // 5/9 * 100 = 55.56 -> Math.round = 56
        expect(normalizeScore('the_grid', metadata)).toBe(56);
      });

      it('returns 0 for 0 cells filled', () => {
        const metadata = { cellsFilled: 0 };
        expect(normalizeScore('the_grid', metadata)).toBe(0);
      });

      it('returns 0 for invalid metadata', () => {
        const metadata = { result: 'invalid' };
        expect(normalizeScore('the_grid', metadata)).toBe(0);
      });
    });
  });

  describe('isPerfectScore', () => {
    it('detects perfect topical_quiz score (5/5 correct)', () => {
      const metadata = { correctCount: 5 };
      expect(isPerfectScore('topical_quiz', metadata)).toBe(true);
    });

    it('detects non-perfect topical_quiz score', () => {
      const metadata = { correctCount: 4 };
      expect(isPerfectScore('topical_quiz', metadata)).toBe(false);
    });

    it('detects perfect career_path score (won on first clue)', () => {
      const metadata = { won: true, totalSteps: 5, revealedCount: 1 };
      expect(isPerfectScore('career_path', metadata)).toBe(true);
    });

    it('detects non-perfect career_path score (extra reveals)', () => {
      const metadata = { won: true, totalSteps: 5, revealedCount: 2 };
      expect(isPerfectScore('career_path', metadata)).toBe(false);
    });

    it('detects perfect guess_the_transfer score (no hints, no wrong guesses)', () => {
      const metadata = { won: true, hintsRevealed: 0, guesses: [] };
      expect(isPerfectScore('guess_the_transfer', metadata)).toBe(true);
    });

    it('detects non-perfect guess_the_transfer score (used hints)', () => {
      const metadata = { won: true, hintsRevealed: 1, guesses: [] };
      expect(isPerfectScore('guess_the_transfer', metadata)).toBe(false);
    });

    it('detects perfect guess_the_goalscorers score', () => {
      const metadata = { scorersFound: 4, totalScorers: 4 };
      expect(isPerfectScore('guess_the_goalscorers', metadata)).toBe(true);
    });

    it('detects the_grid perfect score (9 cells filled)', () => {
      const metadata = { cellsFilled: 9 };
      expect(isPerfectScore('the_grid', metadata)).toBe(true);
    });

    it('detects the_grid non-perfect score', () => {
      const metadata = { cellsFilled: 7 };
      expect(isPerfectScore('the_grid', metadata)).toBe(false);
    });
  });

  describe('calculateProficiency', () => {
    it('calculates "Current Affairs" proficiency from topical_quiz attempts', () => {
      const mockAttempt = createMockAttempt({ correctCount: 5 });

      const proficiency = calculateProficiency('topical_quiz', [mockAttempt as any]);

      expect(proficiency.gameMode).toBe('topical_quiz');
      expect(proficiency.displayName).toBe('Current Affairs');
      expect(proficiency.percentage).toBe(100);
      expect(proficiency.gamesPlayed).toBe(1);
      expect(proficiency.perfectScores).toBe(1);
    });

    it('calculates average percentage from multiple attempts', () => {
      const attempts = [
        createMockAttempt({ correctCount: 5 }), // 100%
        createMockAttempt({ correctCount: 3 }), // 60%
        createMockAttempt({ correctCount: 4 }), // 80%
      ];

      const proficiency = calculateProficiency('topical_quiz', attempts as any[]);

      // Average: (100 + 60 + 80) / 3 = 80
      expect(proficiency.percentage).toBe(80);
      expect(proficiency.gamesPlayed).toBe(3);
      expect(proficiency.perfectScores).toBe(1); // Only first one is perfect
    });

    it('returns 0 percentage when no attempts', () => {
      const proficiency = calculateProficiency('topical_quiz', []);

      expect(proficiency.percentage).toBe(0);
      expect(proficiency.gamesPlayed).toBe(0);
      expect(proficiency.perfectScores).toBe(0);
    });

    it('calculates career_path proficiency correctly', () => {
      const attempts = [
        createMockAttempt({ won: true, totalSteps: 5, revealedCount: 1 }), // 100%
        createMockAttempt({ won: true, totalSteps: 5, revealedCount: 3 }), // 60%
      ];

      const proficiency = calculateProficiency('career_path', attempts as any[]);

      // Average: (100 + 60) / 2 = 80
      expect(proficiency.percentage).toBe(80);
      expect(proficiency.gamesPlayed).toBe(2);
      expect(proficiency.perfectScores).toBe(1);
    });
  });

  describe('calculateGlobalIQ', () => {
    it('calculates IQ from single game mode played', () => {
      const quizProficiency: GameProficiency = {
        gameMode: 'topical_quiz',
        displayName: 'Current Affairs',
        percentage: 100,
        gamesPlayed: 1,
        perfectScores: 1,
      };

      const allProficiencies = [
        quizProficiency,
        ...createEmptyProficiencies('topical_quiz'),
      ];

      const globalIQ = calculateGlobalIQ(allProficiencies);

      // Only topical_quiz played, so IQ should be 100
      expect(globalIQ).toBe(100);
    });

    it('redistributes weights when only some modes played', () => {
      // Play career_path (13% weight) and topical_quiz (9% weight)
      const proficiencies: GameProficiency[] = [
        {
          gameMode: 'career_path',
          displayName: 'Deduction',
          percentage: 80,
          gamesPlayed: 1,
          perfectScores: 0,
        },
        {
          gameMode: 'topical_quiz',
          displayName: 'Current Affairs',
          percentage: 60,
          gamesPlayed: 1,
          perfectScores: 0,
        },
        ...createEmptyProficiencies('career_path').filter(
          (p) => p.gameMode !== 'topical_quiz'
        ),
      ];

      const globalIQ = calculateGlobalIQ(proficiencies);

      // Weights: career_path=0.13, topical_quiz=0.09, total=0.22
      // Normalized: career_path=0.591, topical_quiz=0.409
      // IQ = 80 * 0.591 + 60 * 0.409 = 47.27 + 24.55 = 71.82 -> Math.round = 72
      expect(globalIQ).toBe(72);
    });

    it('returns 0 when no games played', () => {
      const emptyProficiencies = createEmptyProficiencies();
      const globalIQ = calculateGlobalIQ(emptyProficiencies);
      expect(globalIQ).toBe(0);
    });

    it('calculates weighted average when all modes played', () => {
      const proficiencies: GameProficiency[] = [
        { gameMode: 'career_path', displayName: 'Deduction', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
        { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
        { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
        { gameMode: 'the_grid', displayName: 'Strategic Logic', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
        { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
      ];

      const globalIQ = calculateGlobalIQ(proficiencies);

      // All 100%, so IQ = 100
      expect(globalIQ).toBe(100);
    });
  });

  describe('End-to-end data flow', () => {
    it('processes topical_quiz attempt through entire pipeline', () => {
      // Simulate what happens when a user completes a quiz with 4/5 correct
      const savedMetadata = { correctCount: 4 };

      // Step 1: normalizeScore is called when calculating proficiency
      const normalizedScore = normalizeScore('topical_quiz', savedMetadata);
      expect(normalizedScore).toBe(80);

      // Step 2: calculateProficiency aggregates the normalized scores
      const mockAttempt = createMockAttempt(savedMetadata);
      const proficiency = calculateProficiency('topical_quiz', [mockAttempt as any]);
      expect(proficiency.percentage).toBe(80);
      expect(proficiency.displayName).toBe('Current Affairs');

      // Step 3: calculateGlobalIQ computes weighted average
      const allProficiencies = [proficiency, ...createEmptyProficiencies('topical_quiz')];
      const globalIQ = calculateGlobalIQ(allProficiencies);
      expect(globalIQ).toBe(80); // Only mode played, so IQ = proficiency

      // Assert: IQ is > 0 (user's requirement)
      expect(globalIQ).toBeGreaterThan(0);
    });

    it('processes career_path attempt through entire pipeline', () => {
      // Simulate winning career path with 2 reveals on a 5-step puzzle
      const savedMetadata = { won: true, totalSteps: 5, revealedCount: 2 };

      const normalizedScore = normalizeScore('career_path', savedMetadata);
      // Score = 5 - (2 - 1) = 4 points out of 5 = 80%
      expect(normalizedScore).toBe(80);

      const mockAttempt = createMockAttempt(savedMetadata);
      const proficiency = calculateProficiency('career_path', [mockAttempt as any]);
      expect(proficiency.percentage).toBe(80);

      const allProficiencies = [proficiency, ...createEmptyProficiencies('career_path')];
      const globalIQ = calculateGlobalIQ(allProficiencies);
      expect(globalIQ).toBe(80);
    });

    it('processes guess_the_transfer attempt through entire pipeline', () => {
      // Simulate winning transfer guess with 1 hint and 2 wrong guesses
      const savedMetadata = { won: true, hintsRevealed: 1, guesses: ['wrong1', 'wrong2'] };

      const normalizedScore = normalizeScore('guess_the_transfer', savedMetadata);
      // Score = 10 - (1 * 2) - 2 = 6 points = 60%
      expect(normalizedScore).toBe(60);

      const mockAttempt = createMockAttempt(savedMetadata);
      const proficiency = calculateProficiency('guess_the_transfer', [mockAttempt as any]);
      expect(proficiency.percentage).toBe(60);

      const allProficiencies = [proficiency, ...createEmptyProficiencies('guess_the_transfer')];
      const globalIQ = calculateGlobalIQ(allProficiencies);
      expect(globalIQ).toBe(60);
    });
  });
});
