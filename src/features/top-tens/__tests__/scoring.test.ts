/**
 * Top Tens Scoring Tests (TDD - Written First)
 *
 * Tests for score calculation and formatting.
 * These tests are written BEFORE implementation code.
 */

import {
  calculateTopTensScore,
  formatTopTensScore,
  TopTensScore,
} from '../utils/scoring';

describe('calculateTopTensScore', () => {
  describe('winning scenarios', () => {
    it('returns perfect score (10/10) when all found', () => {
      const score = calculateTopTensScore(10, 0, true);
      expect(score.points).toBe(10);
      expect(score.maxPoints).toBe(10);
      expect(score.foundCount).toBe(10);
      expect(score.won).toBe(true);
    });

    it('tracks wrong guess count in score', () => {
      const score = calculateTopTensScore(10, 5, true);
      expect(score.points).toBe(10);
      expect(score.wrongGuessCount).toBe(5);
      expect(score.won).toBe(true);
    });

    it('returns won=true when all 10 found', () => {
      const score = calculateTopTensScore(10, 15, true);
      expect(score.won).toBe(true);
      expect(score.foundCount).toBe(10);
    });
  });

  describe('partial/loss scenarios', () => {
    it('returns partial score when player gives up', () => {
      const score = calculateTopTensScore(7, 3, false);
      expect(score.points).toBe(7);
      expect(score.maxPoints).toBe(10);
      expect(score.foundCount).toBe(7);
      expect(score.won).toBe(false);
    });

    it('returns 0 points when no answers found and gave up', () => {
      const score = calculateTopTensScore(0, 5, false);
      expect(score.points).toBe(0);
      expect(score.won).toBe(false);
    });

    it('returns correct partial scores', () => {
      const score1 = calculateTopTensScore(1, 0, false);
      expect(score1.points).toBe(1);

      const score5 = calculateTopTensScore(5, 2, false);
      expect(score5.points).toBe(5);

      const score9 = calculateTopTensScore(9, 1, false);
      expect(score9.points).toBe(9);
    });
  });

  describe('score object completeness', () => {
    it('includes all required fields', () => {
      const score = calculateTopTensScore(6, 4, false);
      expect(score).toHaveProperty('points');
      expect(score).toHaveProperty('maxPoints');
      expect(score).toHaveProperty('foundCount');
      expect(score).toHaveProperty('wrongGuessCount');
      expect(score).toHaveProperty('won');
    });

    it('always has maxPoints as 10', () => {
      const score1 = calculateTopTensScore(0, 0, false);
      const score2 = calculateTopTensScore(10, 10, true);
      const score3 = calculateTopTensScore(5, 3, false);

      expect(score1.maxPoints).toBe(10);
      expect(score2.maxPoints).toBe(10);
      expect(score3.maxPoints).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('handles zero found count', () => {
      const score = calculateTopTensScore(0, 0, false);
      expect(score.points).toBe(0);
      expect(score.foundCount).toBe(0);
    });

    it('handles high wrong guess count', () => {
      const score = calculateTopTensScore(3, 50, false);
      expect(score.points).toBe(3);
      expect(score.wrongGuessCount).toBe(50);
    });
  });
});

describe('formatTopTensScore', () => {
  it('formats as "7/10" for partial score', () => {
    const score: TopTensScore = {
      points: 7,
      maxPoints: 10,
      foundCount: 7,
      wrongGuessCount: 3,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('7/10');
  });

  it('formats as "10/10" for perfect score', () => {
    const score: TopTensScore = {
      points: 10,
      maxPoints: 10,
      foundCount: 10,
      wrongGuessCount: 2,
      won: true,
    };
    expect(formatTopTensScore(score)).toBe('10/10');
  });

  it('formats as "0/10" for zero score', () => {
    const score: TopTensScore = {
      points: 0,
      maxPoints: 10,
      foundCount: 0,
      wrongGuessCount: 5,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('0/10');
  });

  it('formats single digit scores correctly', () => {
    const score: TopTensScore = {
      points: 1,
      maxPoints: 10,
      foundCount: 1,
      wrongGuessCount: 0,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('1/10');
  });
});
