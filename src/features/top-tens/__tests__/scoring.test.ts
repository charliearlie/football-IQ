/**
 * Top Tens Scoring Tests
 *
 * Flat tier scoring system:
 * - 1-2 answers: 1 IQ point
 * - 3-4 answers: 2 IQ points
 * - 5-6 answers: 3 IQ points
 * - 7-8 answers: 4 IQ points
 * - 9 answers: 5 IQ points
 * - 10 answers: 8 IQ points (Jackpot!)
 *
 * Score progression: 1 → 1 → 2 → 2 → 3 → 3 → 4 → 4 → 5 → 8
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
  it('returns correct flat tier scores for each answer count', () => {
    // Score progression: 1 → 1 → 2 → 2 → 3 → 3 → 4 → 4 → 5 → 8
    expect(calculatePoints(0)).toBe(0);
    expect(calculatePoints(1)).toBe(1);
    expect(calculatePoints(2)).toBe(1);
    expect(calculatePoints(3)).toBe(2);
    expect(calculatePoints(4)).toBe(2);
    expect(calculatePoints(5)).toBe(3);
    expect(calculatePoints(6)).toBe(3);
    expect(calculatePoints(7)).toBe(4);
    expect(calculatePoints(8)).toBe(4);
    expect(calculatePoints(9)).toBe(5);
    expect(calculatePoints(10)).toBe(8);
  });

  it('caps at 8 points for more than 10 found', () => {
    expect(calculatePoints(11)).toBe(8);
    expect(calculatePoints(100)).toBe(8);
  });
});

describe('calculateTopTensScore', () => {
  describe('winning scenarios', () => {
    it('returns perfect score (8/8) when all found', () => {
      const score = calculateTopTensScore(10, 0, true);
      expect(score.points).toBe(8);
      expect(score.maxPoints).toBe(8);
      expect(score.foundCount).toBe(10);
      expect(score.won).toBe(true);
    });

    it('tracks wrong guess count in score', () => {
      const score = calculateTopTensScore(10, 5, true);
      expect(score.points).toBe(8);
      expect(score.wrongGuessCount).toBe(5);
      expect(score.won).toBe(true);
    });

    it('returns won=true when all 10 found', () => {
      const score = calculateTopTensScore(10, 15, true);
      expect(score.won).toBe(true);
      expect(score.foundCount).toBe(10);
    });
  });

  describe('partial/loss scenarios with flat tier scoring', () => {
    it('returns 4 points when 7 found (tier 4)', () => {
      const score = calculateTopTensScore(7, 3, false);
      expect(score.points).toBe(4);
      expect(score.maxPoints).toBe(8);
      expect(score.foundCount).toBe(7);
      expect(score.won).toBe(false);
    });

    it('returns 3 points when 5 found (tier 3)', () => {
      const score = calculateTopTensScore(5, 2, false);
      expect(score.points).toBe(3);
    });

    it('returns 5 points when 9 found (missing jackpot)', () => {
      const score = calculateTopTensScore(9, 1, false);
      expect(score.points).toBe(5);
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

    it('always has maxPoints as 8', () => {
      const score1 = calculateTopTensScore(0, 0, false);
      const score2 = calculateTopTensScore(10, 10, true);
      const score3 = calculateTopTensScore(5, 3, false);

      expect(score1.maxPoints).toBe(8);
      expect(score2.maxPoints).toBe(8);
      expect(score3.maxPoints).toBe(8);
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
      expect(score.points).toBe(2); // tier 2
      expect(score.wrongGuessCount).toBe(50);
    });
  });
});

describe('formatTopTensScore', () => {
  it('formats as "4/8" for 7 found', () => {
    const score: TopTensScore = {
      points: 4,
      maxPoints: 8,
      foundCount: 7,
      wrongGuessCount: 3,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('4/8');
  });

  it('formats as "8/8" for perfect score', () => {
    const score: TopTensScore = {
      points: 8,
      maxPoints: 8,
      foundCount: 10,
      wrongGuessCount: 2,
      won: true,
    };
    expect(formatTopTensScore(score)).toBe('8/8');
  });

  it('formats as "0/8" for zero score', () => {
    const score: TopTensScore = {
      points: 0,
      maxPoints: 8,
      foundCount: 0,
      wrongGuessCount: 5,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('0/8');
  });

  it('formats single digit points correctly', () => {
    const score: TopTensScore = {
      points: 1,
      maxPoints: 8,
      foundCount: 1,
      wrongGuessCount: 0,
      won: false,
    };
    expect(formatTopTensScore(score)).toBe('1/8');
  });
});

describe('getScoreProgression', () => {
  it('returns correct score array for each answer count', () => {
    const progression = getScoreProgression();
    expect(progression).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 8]);
  });
});

describe('getPointsForAnswer', () => {
  it('returns correct score for each tier', () => {
    // Tier 1: 1-2 answers = 1 point
    expect(getPointsForAnswer(1)).toBe(1);
    expect(getPointsForAnswer(2)).toBe(1);
    // Tier 2: 3-4 answers = 2 points
    expect(getPointsForAnswer(3)).toBe(2);
    expect(getPointsForAnswer(4)).toBe(2);
    // Tier 3: 5-6 answers = 3 points
    expect(getPointsForAnswer(5)).toBe(3);
    expect(getPointsForAnswer(6)).toBe(3);
    // Tier 4: 7-8 answers = 4 points
    expect(getPointsForAnswer(7)).toBe(4);
    expect(getPointsForAnswer(8)).toBe(4);
    // Tier 5: 9 answers = 5 points
    expect(getPointsForAnswer(9)).toBe(5);
    // Jackpot: 10 answers = 8 points
    expect(getPointsForAnswer(10)).toBe(8);
  });

  it('returns 0 for invalid answer numbers', () => {
    expect(getPointsForAnswer(0)).toBe(0);
    expect(getPointsForAnswer(-1)).toBe(0);
    expect(getPointsForAnswer(11)).toBe(0);
  });
});

describe('MAX_POINTS constant', () => {
  it('equals 8', () => {
    expect(MAX_POINTS).toBe(8);
  });
});
