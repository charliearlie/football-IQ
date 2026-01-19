/**
 * Top Tens Scoring Tests
 *
 * Progressive tier scoring system:
 * - 1st-2nd correct: 1 point each
 * - 3rd-4th correct: 2 points each
 * - 5th-6th correct: 3 points each
 * - 7th-8th correct: 4 points each
 * - 9th correct: 5 points
 * - 10th correct: 8 points (Jackpot!)
 *
 * Score progression: 1 → 2 → 4 → 6 → 9 → 12 → 16 → 20 → 25 → 30
 */

import {
  calculateTopTensScore,
  formatTopTensScore,
  calculatePoints,
  getScoreProgression,
  getPointsForAnswer,
  TopTensScore,
  MAX_POINTS,
} from '../utils/scoring';

describe('calculatePoints', () => {
  it('returns correct progressive scores for each answer count', () => {
    // Score progression: 1 → 2 → 4 → 6 → 9 → 12 → 16 → 20 → 25 → 30
    expect(calculatePoints(0)).toBe(0);
    expect(calculatePoints(1)).toBe(1);
    expect(calculatePoints(2)).toBe(2);
    expect(calculatePoints(3)).toBe(4);
    expect(calculatePoints(4)).toBe(6);
    expect(calculatePoints(5)).toBe(9);
    expect(calculatePoints(6)).toBe(12);
    expect(calculatePoints(7)).toBe(16);
    expect(calculatePoints(8)).toBe(20);
    expect(calculatePoints(9)).toBe(25);
    expect(calculatePoints(10)).toBe(30);
  });

  it('caps at 30 points for more than 10 found', () => {
    expect(calculatePoints(11)).toBe(30);
    expect(calculatePoints(100)).toBe(30);
  });
});

describe('calculateTopTensScore', () => {
  describe('winning scenarios', () => {
    it('returns perfect score (30/30) when all found', () => {
      const score = calculateTopTensScore(10, 0, true);
      expect(score.points).toBe(30);
      expect(score.maxPoints).toBe(30);
      expect(score.foundCount).toBe(10);
      expect(score.won).toBe(true);
    });

    it('tracks wrong guess count in score', () => {
      const score = calculateTopTensScore(10, 5, true);
      expect(score.points).toBe(30);
      expect(score.wrongGuessCount).toBe(5);
      expect(score.won).toBe(true);
    });

    it('returns won=true when all 10 found', () => {
      const score = calculateTopTensScore(10, 15, true);
      expect(score.won).toBe(true);
      expect(score.foundCount).toBe(10);
    });
  });

  describe('partial/loss scenarios with progressive scoring', () => {
    it('returns 16 points when 7 found (1+1+2+2+3+3+4)', () => {
      const score = calculateTopTensScore(7, 3, false);
      expect(score.points).toBe(16);
      expect(score.maxPoints).toBe(30);
      expect(score.foundCount).toBe(7);
      expect(score.won).toBe(false);
    });

    it('returns 9 points when 5 found (1+1+2+2+3)', () => {
      const score = calculateTopTensScore(5, 2, false);
      expect(score.points).toBe(9);
    });

    it('returns 25 points when 9 found (missing jackpot)', () => {
      const score = calculateTopTensScore(9, 1, false);
      expect(score.points).toBe(25);
    });

    it('returns 0 points when no answers found', () => {
      const score = calculateTopTensScore(0, 5, false);
      expect(score.points).toBe(0);
      expect(score.won).toBe(false);
    });

    it('returns 1 point for single answer found', () => {
      const score = calculateTopTensScore(1, 0, false);
      expect(score.points).toBe(1);
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

    it('always has maxPoints as 30', () => {
      const score1 = calculateTopTensScore(0, 0, false);
      const score2 = calculateTopTensScore(10, 10, true);
      const score3 = calculateTopTensScore(5, 3, false);

      expect(score1.maxPoints).toBe(30);
      expect(score2.maxPoints).toBe(30);
      expect(score3.maxPoints).toBe(30);
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
      expect(score.points).toBe(4); // 1+1+2 = 4
      expect(score.wrongGuessCount).toBe(50);
    });
  });
});

describe('formatTopTensScore', () => {
  it('formats as "16/30" for 7 found', () => {
    const score: TopTensScore = {
      points: 16,
      maxPoints: 30,
      foundCount: 7,
      wrongGuessCount: 3,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('16/30');
  });

  it('formats as "30/30" for perfect score', () => {
    const score: TopTensScore = {
      points: 30,
      maxPoints: 30,
      foundCount: 10,
      wrongGuessCount: 2,
      won: true,
    };
    expect(formatTopTensScore(score)).toBe('30/30');
  });

  it('formats as "0/30" for zero score', () => {
    const score: TopTensScore = {
      points: 0,
      maxPoints: 30,
      foundCount: 0,
      wrongGuessCount: 5,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('0/30');
  });

  it('formats single digit points correctly', () => {
    const score: TopTensScore = {
      points: 1,
      maxPoints: 30,
      foundCount: 1,
      wrongGuessCount: 0,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('1/30');
  });
});

describe('getScoreProgression', () => {
  it('returns correct cumulative score array', () => {
    const progression = getScoreProgression();
    expect(progression).toEqual([1, 2, 4, 6, 9, 12, 16, 20, 25, 30]);
  });
});

describe('getPointsForAnswer', () => {
  it('returns correct points for each tier', () => {
    // Tier 1-2: 1 point each
    expect(getPointsForAnswer(1)).toBe(1);
    expect(getPointsForAnswer(2)).toBe(1);
    // Tier 3-4: 2 points each
    expect(getPointsForAnswer(3)).toBe(2);
    expect(getPointsForAnswer(4)).toBe(2);
    // Tier 5-6: 3 points each
    expect(getPointsForAnswer(5)).toBe(3);
    expect(getPointsForAnswer(6)).toBe(3);
    // Tier 7-8: 4 points each
    expect(getPointsForAnswer(7)).toBe(4);
    expect(getPointsForAnswer(8)).toBe(4);
    // 9th-10th: 5 points each
    expect(getPointsForAnswer(9)).toBe(5);
    expect(getPointsForAnswer(10)).toBe(5);
  });

  it('returns 0 for invalid answer numbers', () => {
    expect(getPointsForAnswer(0)).toBe(0);
    expect(getPointsForAnswer(-1)).toBe(0);
    expect(getPointsForAnswer(11)).toBe(0);
  });
});

describe('MAX_POINTS constant', () => {
  it('equals 30', () => {
    expect(MAX_POINTS).toBe(30);
  });
});
