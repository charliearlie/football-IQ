/**
 * Tests for Goalscorer Recall scoring utilities.
 */

import {
  calculateGoalscorerScore,
  formatGoalscorerScore,
  getScoreMessage,
} from '../utils/scoring';

describe('calculateGoalscorerScore', () => {
  describe('percentage calculation', () => {
    it('calculates 100% when all scorers found', () => {
      const score = calculateGoalscorerScore(5, 5, 30, true);
      expect(score.percentage).toBe(100);
    });

    it('calculates 60% for 3 of 5 found', () => {
      const score = calculateGoalscorerScore(3, 5, 0, false);
      expect(score.percentage).toBe(60);
    });

    it('calculates 0% for none found', () => {
      const score = calculateGoalscorerScore(0, 4, 0, false);
      expect(score.percentage).toBe(0);
    });

    it('rounds percentage to whole number', () => {
      // 2/3 = 66.666...
      const score = calculateGoalscorerScore(2, 3, 0, false);
      expect(score.percentage).toBe(67);
    });

    it('handles 1 of 1 scorers', () => {
      const score = calculateGoalscorerScore(1, 1, 45, true);
      expect(score.percentage).toBe(100);
    });
  });

  describe('time bonus', () => {
    it('awards time bonus when all found with time remaining', () => {
      const score = calculateGoalscorerScore(5, 5, 30, true);
      expect(score.timeBonus).toBe(60); // 30 * 2
    });

    it('awards no time bonus when not all found', () => {
      const score = calculateGoalscorerScore(4, 5, 20, false);
      expect(score.timeBonus).toBe(0);
    });

    it('awards no time bonus when time is exactly 0', () => {
      const score = calculateGoalscorerScore(5, 5, 0, true);
      expect(score.timeBonus).toBe(0);
    });

    it('awards maximum bonus for fast completion', () => {
      const score = calculateGoalscorerScore(3, 3, 55, true);
      expect(score.timeBonus).toBe(110); // 55 * 2
    });
  });

  describe('win conditions', () => {
    it('is won when all found before time expires', () => {
      const score = calculateGoalscorerScore(5, 5, 15, true);
      expect(score.won).toBe(true);
      expect(score.allFound).toBe(true);
    });

    it('is lost when time expires with scorers remaining', () => {
      const score = calculateGoalscorerScore(3, 5, 0, false);
      expect(score.won).toBe(false);
      expect(score.allFound).toBe(false);
    });

    it('is lost when player gives up (time remaining but not all found)', () => {
      const score = calculateGoalscorerScore(2, 5, 40, false);
      expect(score.won).toBe(false);
    });

    it('is lost when all found but time already expired', () => {
      // Edge case: player finds last one exactly as timer hits 0
      const score = calculateGoalscorerScore(5, 5, 0, true);
      expect(score.won).toBe(false);
      expect(score.allFound).toBe(true);
    });
  });

  describe('score object completeness', () => {
    it('returns all required fields', () => {
      const score = calculateGoalscorerScore(3, 5, 20, false);

      expect(score).toEqual({
        percentage: 60,
        scorersFound: 3,
        totalScorers: 5,
        timeRemaining: 20,
        timeBonus: 0,
        allFound: false,
        won: false,
      });
    });

    it('handles perfect game', () => {
      const score = calculateGoalscorerScore(4, 4, 42, true);

      expect(score).toEqual({
        percentage: 100,
        scorersFound: 4,
        totalScorers: 4,
        timeRemaining: 42,
        timeBonus: 84,
        allFound: true,
        won: true,
      });
    });
  });

  describe('edge cases', () => {
    it('handles zero total scorers gracefully', () => {
      const score = calculateGoalscorerScore(0, 0, 60, true);
      expect(score.percentage).toBe(100);
      expect(score.won).toBe(true);
    });
  });
});

describe('formatGoalscorerScore', () => {
  it('formats percentage only when no time bonus', () => {
    const score = calculateGoalscorerScore(3, 5, 0, false);
    expect(formatGoalscorerScore(score)).toBe('60%');
  });

  it('formats with time bonus when present', () => {
    const score = calculateGoalscorerScore(5, 5, 30, true);
    expect(formatGoalscorerScore(score)).toBe('100% (+60 bonus)');
  });

  it('shows 100% without bonus if all found at time 0', () => {
    const score = calculateGoalscorerScore(5, 5, 0, true);
    expect(formatGoalscorerScore(score)).toBe('100%');
  });
});

describe('getScoreMessage', () => {
  it('returns fast completion message for 30+ seconds remaining', () => {
    const score = calculateGoalscorerScore(5, 5, 35, true);
    expect(getScoreMessage(score)).toBe('Lightning fast! Incredible recall!');
  });

  it('returns perfect message for all found with time bonus', () => {
    const score = calculateGoalscorerScore(5, 5, 20, true);
    expect(getScoreMessage(score)).toBe('Perfect! All scorers found!');
  });

  it('returns all found message for 100% without bonus', () => {
    const score = calculateGoalscorerScore(5, 5, 0, true);
    expect(getScoreMessage(score)).toBe('All scorers found!');
  });

  it('returns great memory for 80%+', () => {
    const score = calculateGoalscorerScore(4, 5, 0, false);
    expect(getScoreMessage(score)).toBe('Great memory! So close!');
  });

  it('returns good effort for 50%+', () => {
    const score = calculateGoalscorerScore(3, 5, 0, false);
    expect(getScoreMessage(score)).toBe('Good effort! Keep practicing!');
  });

  it('returns nice try for partial completion', () => {
    const score = calculateGoalscorerScore(1, 5, 0, false);
    expect(getScoreMessage(score)).toBe('Nice try! Every scorer counts!');
  });

  it('returns better luck for 0%', () => {
    const score = calculateGoalscorerScore(0, 5, 0, false);
    expect(getScoreMessage(score)).toBe('Better luck next time!');
  });
});
