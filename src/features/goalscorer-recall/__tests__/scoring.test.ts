/**
 * Tests for Goalscorer Recall scoring utilities.
 *
 * Scoring: 1 point per scorer found + 3 point bonus for finding all.
 * Example: 6 scorers, found 6/6 = 6 + 3 = 9 points
 */

import {
  calculateGoalscorerScore,
  formatGoalscorerScore,
  getScoreMessage,
} from '../utils/scoring';

describe('calculateGoalscorerScore', () => {
  describe('points calculation with +3 bonus', () => {
    it('awards 8 points when all 5 scorers found (5 + 3 bonus)', () => {
      const score = calculateGoalscorerScore(5, 5, true, 30);
      expect(score.points).toBe(8);
    });

    it('awards 9 points when all 6 scorers found (6 + 3 bonus)', () => {
      const score = calculateGoalscorerScore(6, 6, true, 30);
      expect(score.points).toBe(9);
    });

    it('awards 6 points when all 3 scorers found (3 + 3 bonus)', () => {
      const score = calculateGoalscorerScore(3, 3, true, 30);
      expect(score.points).toBe(6);
    });

    it('awards 4 points when all 1 scorer found (1 + 3 bonus)', () => {
      const score = calculateGoalscorerScore(1, 1, true, 45);
      expect(score.points).toBe(4);
    });

    it('awards 3 points for 3 of 5 found (no bonus)', () => {
      const score = calculateGoalscorerScore(3, 5, false, 0);
      expect(score.points).toBe(3);
    });

    it('awards 2 points for 2 of 3 found (no bonus)', () => {
      const score = calculateGoalscorerScore(2, 3, false, 0);
      expect(score.points).toBe(2);
    });

    it('awards 0 points for none found', () => {
      const score = calculateGoalscorerScore(0, 4, false, 0);
      expect(score.points).toBe(0);
    });
  });

  describe('win conditions', () => {
    it('is won when all found before time expires', () => {
      const score = calculateGoalscorerScore(5, 5, true, 15);
      expect(score.won).toBe(true);
      expect(score.allFound).toBe(true);
    });

    it('is lost when time expires with scorers remaining', () => {
      const score = calculateGoalscorerScore(3, 5, false, 0);
      expect(score.won).toBe(false);
      expect(score.allFound).toBe(false);
    });

    it('is lost when player gives up (time remaining but not all found)', () => {
      const score = calculateGoalscorerScore(2, 5, false, 40);
      expect(score.won).toBe(false);
    });

    it('is lost when all found but time already expired', () => {
      // Edge case: player finds last one exactly as timer hits 0
      // Still gets bonus points, but won=false
      const score = calculateGoalscorerScore(5, 5, true, 0);
      expect(score.won).toBe(false);
      expect(score.allFound).toBe(true);
      expect(score.points).toBe(8); // 5 + 3 bonus
    });
  });

  describe('score object completeness', () => {
    it('returns all required fields for partial completion', () => {
      const score = calculateGoalscorerScore(3, 5, false, 0);

      expect(score).toEqual({
        points: 3,
        scorersFound: 3,
        totalScorers: 5,
        allFound: false,
        won: false,
      });
    });

    it('returns all required fields for perfect game with bonus', () => {
      const score = calculateGoalscorerScore(4, 4, true, 42);

      expect(score).toEqual({
        points: 7, // 4 + 3 bonus
        scorersFound: 4,
        totalScorers: 4,
        allFound: true,
        won: true,
      });
    });
  });

  describe('edge cases', () => {
    it('handles zero total scorers gracefully', () => {
      const score = calculateGoalscorerScore(0, 0, true, 60);
      expect(score.points).toBe(0);
      expect(score.won).toBe(true);
    });
  });
});

describe('formatGoalscorerScore', () => {
  it('formats as X/Y (scorers found, not points)', () => {
    const score = calculateGoalscorerScore(3, 5, false, 0);
    expect(formatGoalscorerScore(score)).toBe('3/5');
  });

  it('formats perfect score', () => {
    const score = calculateGoalscorerScore(5, 5, true, 30);
    expect(formatGoalscorerScore(score)).toBe('5/5');
  });

  it('formats zero score', () => {
    const score = calculateGoalscorerScore(0, 5, false, 0);
    expect(formatGoalscorerScore(score)).toBe('0/5');
  });
});

describe('getScoreMessage', () => {
  it('returns all found message when won', () => {
    const score = calculateGoalscorerScore(5, 5, true, 20);
    expect(getScoreMessage(score)).toBe('All scorers found!');
  });

  it('returns all found message when allFound (even if not won)', () => {
    const score = calculateGoalscorerScore(5, 5, true, 0);
    expect(getScoreMessage(score)).toBe('All scorers found!');
  });

  it('returns great memory for 80%+ completion', () => {
    const score = calculateGoalscorerScore(4, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Great memory! So close!');
  });

  it('returns good effort for 50-79% completion', () => {
    const score = calculateGoalscorerScore(3, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Good effort! Keep practicing!');

    const score2 = calculateGoalscorerScore(2, 4, false, 0);
    expect(getScoreMessage(score2)).toBe('Good effort! Keep practicing!');
  });

  it('returns nice try for <50% with some found', () => {
    const score = calculateGoalscorerScore(1, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Nice try! Every scorer counts!');
  });

  it('returns better luck for 0 found', () => {
    const score = calculateGoalscorerScore(0, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Better luck next time!');
  });
});
