/**
 * IQ Calculation Tests
 *
 * Tests for the Global Football IQ score calculation system.
 * Uses weighted averaging across 5 game modes.
 *
 * Weights:
 * - Career Path: 25%
 * - Transfer Guess: 25%
 * - Goalscorer Recall: 20%
 * - Tic Tac Toe: 15%
 * - Topical Quiz: 15%
 */

import {
  normalizeScore,
  calculateProficiency,
  calculateGlobalIQ,
  calculateBadges,
  isPerfectScore,
} from '../utils/iqCalculation';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { GameProficiency } from '../types/stats.types';

describe('normalizeScore', () => {
  describe('career_path', () => {
    it('normalizes perfect score (10/10) to 100', () => {
      const metadata = { points: 10, maxPoints: 10, stepsRevealed: 1, won: true };
      expect(normalizeScore('career_path', metadata)).toBe(100);
    });

    it('normalizes partial score (8/10) to 80', () => {
      const metadata = { points: 8, maxPoints: 10, stepsRevealed: 3, won: true };
      expect(normalizeScore('career_path', metadata)).toBe(80);
    });

    it('normalizes 5/10 to 50', () => {
      const metadata = { points: 5, maxPoints: 10, stepsRevealed: 6, won: true };
      expect(normalizeScore('career_path', metadata)).toBe(50);
    });

    it('normalizes loss (0 points) to 0', () => {
      const metadata = { points: 0, maxPoints: 10, stepsRevealed: 10, won: false };
      expect(normalizeScore('career_path', metadata)).toBe(0);
    });

    it('handles variable maxPoints (8-step career)', () => {
      const metadata = { points: 6, maxPoints: 8, stepsRevealed: 3, won: true };
      expect(normalizeScore('career_path', metadata)).toBe(75); // 6/8 = 0.75
    });

    it('returns 0 for invalid metadata', () => {
      expect(normalizeScore('career_path', null)).toBe(0);
      expect(normalizeScore('career_path', {})).toBe(0);
      expect(normalizeScore('career_path', { points: 'invalid' })).toBe(0);
    });
  });

  describe('guess_the_transfer', () => {
    it('normalizes perfect score (10/10) to 100', () => {
      const metadata = { points: 10, maxPoints: 10, hintsRevealed: 0, incorrectGuesses: 0, won: true };
      expect(normalizeScore('guess_the_transfer', metadata)).toBe(100);
    });

    it('normalizes 6/10 to 60', () => {
      const metadata = { points: 6, maxPoints: 10, hintsRevealed: 2, incorrectGuesses: 0, won: true };
      expect(normalizeScore('guess_the_transfer', metadata)).toBe(60);
    });

    it('normalizes loss (0 points) to 0', () => {
      const metadata = { points: 0, maxPoints: 10, hintsRevealed: 3, incorrectGuesses: 5, won: false };
      expect(normalizeScore('guess_the_transfer', metadata)).toBe(0);
    });

    it('normalizes minimum winning score (1/10) to 10', () => {
      const metadata = { points: 1, maxPoints: 10, hintsRevealed: 3, incorrectGuesses: 4, won: true };
      expect(normalizeScore('guess_the_transfer', metadata)).toBe(10);
    });
  });

  describe('guess_the_goalscorers', () => {
    it('uses percentage directly (100%)', () => {
      const metadata = { percentage: 100, scorersFound: 5, totalScorers: 5, timeRemaining: 30, timeBonus: 60, allFound: true, won: true };
      expect(normalizeScore('guess_the_goalscorers', metadata)).toBe(100);
    });

    it('uses percentage directly (60%)', () => {
      const metadata = { percentage: 60, scorersFound: 3, totalScorers: 5, timeRemaining: 0, timeBonus: 0, allFound: false, won: false };
      expect(normalizeScore('guess_the_goalscorers', metadata)).toBe(60);
    });

    it('uses percentage directly (0%)', () => {
      const metadata = { percentage: 0, scorersFound: 0, totalScorers: 5, timeRemaining: 0, timeBonus: 0, allFound: false, won: false };
      expect(normalizeScore('guess_the_goalscorers', metadata)).toBe(0);
    });
  });

  describe('tic_tac_toe', () => {
    it('normalizes win to 100', () => {
      const metadata = { points: 10, maxPoints: 10, result: 'win', playerCells: 5, aiCells: 4 };
      expect(normalizeScore('tic_tac_toe', metadata)).toBe(100);
    });

    it('normalizes draw to 50', () => {
      const metadata = { points: 5, maxPoints: 10, result: 'draw', playerCells: 4, aiCells: 4 };
      expect(normalizeScore('tic_tac_toe', metadata)).toBe(50);
    });

    it('normalizes loss to 0', () => {
      const metadata = { points: 0, maxPoints: 10, result: 'loss', playerCells: 3, aiCells: 5 };
      expect(normalizeScore('tic_tac_toe', metadata)).toBe(0);
    });
  });

  describe('topical_quiz', () => {
    it('normalizes perfect score (10/10) to 100', () => {
      const metadata = { points: 10, maxPoints: 10, correctCount: 5, totalQuestions: 5, won: true };
      expect(normalizeScore('topical_quiz', metadata)).toBe(100);
    });

    it('normalizes 6/10 to 60', () => {
      const metadata = { points: 6, maxPoints: 10, correctCount: 3, totalQuestions: 5, won: true };
      expect(normalizeScore('topical_quiz', metadata)).toBe(60);
    });

    it('normalizes 0/10 to 0', () => {
      const metadata = { points: 0, maxPoints: 10, correctCount: 0, totalQuestions: 5, won: true };
      expect(normalizeScore('topical_quiz', metadata)).toBe(0);
    });
  });
});

describe('isPerfectScore', () => {
  it('returns true for perfect career_path (points === maxPoints)', () => {
    const metadata = { points: 10, maxPoints: 10, stepsRevealed: 1, won: true };
    expect(isPerfectScore('career_path', metadata)).toBe(true);
  });

  it('returns false for non-perfect career_path', () => {
    const metadata = { points: 8, maxPoints: 10, stepsRevealed: 3, won: true };
    expect(isPerfectScore('career_path', metadata)).toBe(false);
  });

  it('returns true for perfect transfer (10 points)', () => {
    const metadata = { points: 10, maxPoints: 10, hintsRevealed: 0, incorrectGuesses: 0, won: true };
    expect(isPerfectScore('guess_the_transfer', metadata)).toBe(true);
  });

  it('returns true for 100% goalscorer recall', () => {
    const metadata = { percentage: 100, scorersFound: 5, totalScorers: 5, timeRemaining: 30, won: true };
    expect(isPerfectScore('guess_the_goalscorers', metadata)).toBe(true);
  });

  it('returns true for tic_tac_toe win', () => {
    const metadata = { points: 10, maxPoints: 10, result: 'win', playerCells: 5, aiCells: 4 };
    expect(isPerfectScore('tic_tac_toe', metadata)).toBe(true);
  });

  it('returns false for tic_tac_toe draw', () => {
    const metadata = { points: 5, maxPoints: 10, result: 'draw', playerCells: 4, aiCells: 4 };
    expect(isPerfectScore('tic_tac_toe', metadata)).toBe(false);
  });

  it('returns true for perfect quiz (5/5)', () => {
    const metadata = { points: 10, maxPoints: 10, correctCount: 5, totalQuestions: 5, won: true };
    expect(isPerfectScore('topical_quiz', metadata)).toBe(true);
  });
});

describe('calculateProficiency', () => {
  it('returns 0% with empty attempts', () => {
    const result = calculateProficiency('career_path', []);
    expect(result.percentage).toBe(0);
    expect(result.gamesPlayed).toBe(0);
    expect(result.perfectScores).toBe(0);
  });

  it('calculates average percentage from multiple attempts', () => {
    const attempts = [
      { metadata: { points: 10, maxPoints: 10, stepsRevealed: 1, won: true } }, // 100%
      { metadata: { points: 5, maxPoints: 10, stepsRevealed: 6, won: true } },  // 50%
      { metadata: { points: 8, maxPoints: 10, stepsRevealed: 3, won: true } },  // 80%
    ];
    const result = calculateProficiency('career_path', attempts as any);
    // Average: (100 + 50 + 80) / 3 = 76.67 rounded to 77
    expect(result.percentage).toBe(77);
    expect(result.gamesPlayed).toBe(3);
  });

  it('counts perfect scores correctly', () => {
    const attempts = [
      { metadata: { points: 10, maxPoints: 10, stepsRevealed: 1, won: true } }, // Perfect
      { metadata: { points: 5, maxPoints: 10, stepsRevealed: 6, won: true } },  // Not perfect
      { metadata: { points: 10, maxPoints: 10, stepsRevealed: 1, won: true } }, // Perfect
    ];
    const result = calculateProficiency('career_path', attempts as any);
    expect(result.perfectScores).toBe(2);
  });

  it('sets correct displayName', () => {
    const result = calculateProficiency('career_path', []);
    expect(result.displayName).toBe('Deduction');
    expect(result.gameMode).toBe('career_path');
  });

  it('handles mixed tic_tac_toe results', () => {
    const attempts = [
      { metadata: { points: 10, result: 'win' } },  // 100%
      { metadata: { points: 5, result: 'draw' } },  // 50%
      { metadata: { points: 0, result: 'loss' } },  // 0%
    ];
    const result = calculateProficiency('tic_tac_toe', attempts as any);
    // Average: (100 + 50 + 0) / 3 = 50
    expect(result.percentage).toBe(50);
  });
});

describe('calculateGlobalIQ', () => {
  it('returns 0 when no games played in any mode', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'tic_tac_toe', displayName: 'Strategic Logic', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
    ];
    expect(calculateGlobalIQ(proficiencies)).toBe(0);
  });

  it('calculates weighted average correctly (all modes 100%)', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
      { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
      { gameMode: 'tic_tac_toe', displayName: 'Strategic Logic', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
      { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
    ];
    expect(calculateGlobalIQ(proficiencies)).toBe(100);
  });

  it('calculates weighted average with varied scores', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 80, gamesPlayed: 5, perfectScores: 2 },        // 80 * 0.25 = 20
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 60, gamesPlayed: 3, perfectScores: 0 }, // 60 * 0.25 = 15
      { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 70, gamesPlayed: 4, perfectScores: 1 },  // 70 * 0.20 = 14
      { gameMode: 'tic_tac_toe', displayName: 'Strategic Logic', percentage: 50, gamesPlayed: 2, perfectScores: 1 },         // 50 * 0.15 = 7.5
      { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 40, gamesPlayed: 1, perfectScores: 0 },        // 40 * 0.15 = 6
    ];
    // Total: 20 + 15 + 14 + 7.5 + 6 = 62.5 -> rounds to 63
    expect(calculateGlobalIQ(proficiencies)).toBe(63);
  });

  it('only uses modes that have been played', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'tic_tac_toe', displayName: 'Strategic Logic', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
    ];
    // Only career_path played (100%), weight = 0.25
    // Normalized: 100 * (0.25 / 0.25) = 100
    expect(calculateGlobalIQ(proficiencies)).toBe(100);
  });

  it('handles partial modes played with proper weight redistribution', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 80, gamesPlayed: 1, perfectScores: 0 },           // 0.25
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 60, gamesPlayed: 1, perfectScores: 0 }, // 0.25
      { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 0, gamesPlayed: 0, perfectScores: 0 },   // not played
      { gameMode: 'tic_tac_toe', displayName: 'Strategic Logic', percentage: 0, gamesPlayed: 0, perfectScores: 0 },          // not played
      { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 0, gamesPlayed: 0, perfectScores: 0 },         // not played
    ];
    // Weights for played: 0.25 + 0.25 = 0.50
    // Career: 80 * (0.25/0.50) = 40
    // Transfer: 60 * (0.25/0.50) = 30
    // Total: 70
    expect(calculateGlobalIQ(proficiencies)).toBe(70);
  });
});

describe('calculateBadges', () => {
  it('returns all badges unearned for new user', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'guess_the_goalscorers', displayName: 'Rapid Recall', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'tic_tac_toe', displayName: 'Strategic Logic', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
      { gameMode: 'topical_quiz', displayName: 'Current Affairs', percentage: 0, gamesPlayed: 0, perfectScores: 0 },
    ];
    const badges = calculateBadges(proficiencies, 0, 0);
    expect(badges.every((b) => b.earnedAt === null)).toBe(true);
  });

  it('awards 7-Day Streak badge for streak >= 7', () => {
    const proficiencies: GameProficiency[] = [];
    const badges = calculateBadges(proficiencies, 7, 0);
    const streakBadge = badges.find((b) => b.id === 'streak_7');
    expect(streakBadge?.earnedAt).not.toBeNull();
  });

  it('does not award 7-Day Streak badge for streak < 7', () => {
    const proficiencies: GameProficiency[] = [];
    const badges = calculateBadges(proficiencies, 6, 0);
    const streakBadge = badges.find((b) => b.id === 'streak_7');
    expect(streakBadge?.earnedAt).toBeNull();
  });

  it('awards Detective badge for perfect career_path score', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
    ];
    const badges = calculateBadges(proficiencies, 0, 1);
    const detectiveBadge = badges.find((b) => b.id === 'perfect_career');
    expect(detectiveBadge?.earnedAt).not.toBeNull();
  });

  it('awards Scout badge for perfect transfer score', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 100, gamesPlayed: 1, perfectScores: 1 },
    ];
    const badges = calculateBadges(proficiencies, 0, 1);
    const scoutBadge = badges.find((b) => b.id === 'perfect_transfer');
    expect(scoutBadge?.earnedAt).not.toBeNull();
  });

  it('awards games_10 badge for 10+ puzzles solved', () => {
    const proficiencies: GameProficiency[] = [];
    const badges = calculateBadges(proficiencies, 0, 10);
    const milestone10 = badges.find((b) => b.id === 'games_10');
    expect(milestone10?.earnedAt).not.toBeNull();
  });

  it('awards games_50 badge for 50+ puzzles solved', () => {
    const proficiencies: GameProficiency[] = [];
    const badges = calculateBadges(proficiencies, 0, 50);
    const milestone50 = badges.find((b) => b.id === 'games_50');
    expect(milestone50?.earnedAt).not.toBeNull();
    const milestone10 = badges.find((b) => b.id === 'games_10');
    expect(milestone10?.earnedAt).not.toBeNull(); // Also earned
  });

  it('awards multiple badges when criteria are met', () => {
    const proficiencies: GameProficiency[] = [
      { gameMode: 'career_path', displayName: 'Deduction', percentage: 100, gamesPlayed: 10, perfectScores: 5 },
      { gameMode: 'guess_the_transfer', displayName: 'Market Knowledge', percentage: 80, gamesPlayed: 5, perfectScores: 1 },
    ];
    const badges = calculateBadges(proficiencies, 7, 15);

    // Should earn: streak_7, perfect_career, perfect_transfer, games_10
    const earnedBadges = badges.filter((b) => b.earnedAt !== null);
    expect(earnedBadges.length).toBeGreaterThanOrEqual(4);
    expect(earnedBadges.map((b) => b.id)).toContain('streak_7');
    expect(earnedBadges.map((b) => b.id)).toContain('perfect_career');
    expect(earnedBadges.map((b) => b.id)).toContain('perfect_transfer');
    expect(earnedBadges.map((b) => b.id)).toContain('games_10');
  });
});
