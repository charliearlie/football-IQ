/**
 * Tests for Goalscorer Recall scoring utilities.
 *
 * Scoring: 0-5 points based on completion percentage.
 * Finding all scorers = 5 points (regardless of total count).
 */

import {
  calculateGoalscorerScore,
  formatGoalscorerScore,
  getScoreMessage,
} from '../utils/scoring';

describe('calculateGoalscorerScore', () => {
  describe('points calculation', () => {
    it('awards 5 points when all 5 scorers found', () => {
      const score = calculateGoalscorerScore(5, 5, true, 30);
      expect(score.points).toBe(5);
    });

    it('awards 3 points for 3 of 5 found', () => {
      const score = calculateGoalscorerScore(3, 5, false, 0);
      expect(score.points).toBe(3);
    });

    it('awards 0 points for none found', () => {
      const score = calculateGoalscorerScore(0, 4, false, 0);
      expect(score.points).toBe(0);
    });

    it('caps points at 5 even if more scorers exist', () => {
      // Edge case: game with 7 goals
      const score = calculateGoalscorerScore(7, 7, true, 30);
      expect(score.points).toBe(5);
    });

    it('awards 5 points when all found (any total)', () => {
      // 1/1 = 100% = 5 points
      const score = calculateGoalscorerScore(1, 1, true, 45);
      expect(score.points).toBe(5);
    });

    it('awards 5 points for 3/3 scorers (100%)', () => {
      // This was the bug: 3/3 should be 5 points, not 3
      const score = calculateGoalscorerScore(3, 3, true, 30);
      expect(score.points).toBe(5);
    });

    it('scales partial completion proportionally', () => {
      // 2/3 = 66.7% = round(3.33) = 3 points
      const score = calculateGoalscorerScore(2, 3, false, 0);
      expect(score.points).toBe(3);
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
      const score = calculateGoalscorerScore(5, 5, true, 0);
      expect(score.won).toBe(false);
      expect(score.allFound).toBe(true);
    });
  });

  describe('score object completeness', () => {
    it('returns all required fields', () => {
      const score = calculateGoalscorerScore(3, 5, false, 0);

      expect(score).toEqual({
        points: 3,
        scorersFound: 3,
        totalScorers: 5,
        allFound: false,
        won: false,
      });
    });

    it('handles perfect game (4/4 = 100% = 5 points)', () => {
      const score = calculateGoalscorerScore(4, 4, true, 42);

      expect(score).toEqual({
        points: 5,
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
      expect(score.points).toBe(5);
      expect(score.won).toBe(true);
    });
  });
});

describe('formatGoalscorerScore', () => {
  it('formats as X/Y', () => {
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

  it('returns all found message for 5 points (even if not won)', () => {
    const score = calculateGoalscorerScore(5, 5, true, 0);
    expect(getScoreMessage(score)).toBe('All scorers found!');
  });

  it('returns great memory for 4 points', () => {
    const score = calculateGoalscorerScore(4, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Great memory! So close!');
  });

  it('returns good effort for 2-3 points', () => {
    const score = calculateGoalscorerScore(3, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Good effort! Keep practicing!');

    const score2 = calculateGoalscorerScore(2, 5, false, 0);
    expect(getScoreMessage(score2)).toBe('Good effort! Keep practicing!');
  });

  it('returns nice try for 1 point', () => {
    const score = calculateGoalscorerScore(1, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Nice try! Every scorer counts!');
  });

  it('returns better luck for 0 points', () => {
    const score = calculateGoalscorerScore(0, 5, false, 0);
    expect(getScoreMessage(score)).toBe('Better luck next time!');
  });
});
