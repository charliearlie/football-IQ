import {
  calculateScore,
  formatScore,
  GameScore,
} from '../utils/scoring';

describe('calculateScore', () => {
  describe('winning scenarios', () => {
    it('calculates perfect score (guessed on first reveal)', () => {
      const score = calculateScore(10, 1, true);
      expect(score.points).toBe(10);
      expect(score.maxPoints).toBe(10);
      expect(score.stepsRevealed).toBe(1);
      expect(score.won).toBe(true);
    });

    it('calculates score for 5 steps guessed at step 1 = 5 points', () => {
      const score = calculateScore(5, 1, true);
      expect(score.points).toBe(5);
      expect(score.maxPoints).toBe(5);
    });

    it('calculates score for 5 steps guessed at step 5 = 1 point', () => {
      const score = calculateScore(5, 5, true);
      expect(score.points).toBe(1);
      expect(score.maxPoints).toBe(5);
    });

    it('calculates score for 10 steps guessed at step 3 = 8 points', () => {
      const score = calculateScore(10, 3, true);
      expect(score.points).toBe(8); // 10 - (3-1) = 8
      expect(score.maxPoints).toBe(10);
      expect(score.stepsRevealed).toBe(3);
    });

    it('calculates score for 10 steps guessed at step 7 = 4 points', () => {
      const score = calculateScore(10, 7, true);
      expect(score.points).toBe(4); // 10 - (7-1) = 4
    });

    it('calculates score for guess on last step', () => {
      const score = calculateScore(8, 8, true);
      expect(score.points).toBe(1); // 8 - (8-1) = 1
      expect(score.maxPoints).toBe(8);
    });
  });

  describe('losing scenarios', () => {
    it('returns 0 points on loss regardless of steps revealed', () => {
      const score = calculateScore(10, 10, false);
      expect(score.points).toBe(0);
      expect(score.maxPoints).toBe(10);
      expect(score.won).toBe(false);
    });

    it('returns 0 points on loss even with few steps revealed', () => {
      // Edge case: somehow lost early (shouldn't happen in real game)
      const score = calculateScore(10, 5, false);
      expect(score.points).toBe(0);
      expect(score.won).toBe(false);
    });

    it('tracks steps revealed on loss', () => {
      const score = calculateScore(5, 5, false);
      expect(score.stepsRevealed).toBe(5);
      expect(score.maxPoints).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('handles single-step puzzle (perfect = 1 point)', () => {
      const score = calculateScore(1, 1, true);
      expect(score.points).toBe(1);
      expect(score.maxPoints).toBe(1);
    });

    it('handles large puzzles', () => {
      const score = calculateScore(20, 5, true);
      expect(score.points).toBe(16); // 20 - (5-1) = 16
      expect(score.maxPoints).toBe(20);
    });
  });
});

describe('formatScore', () => {
  it('formats winning score as points/maxPoints', () => {
    const score: GameScore = {
      points: 8,
      maxPoints: 10,
      stepsRevealed: 3,
      won: true,
    };
    expect(formatScore(score)).toBe('8/10');
  });

  it('formats losing score as 0/maxPoints', () => {
    const score: GameScore = {
      points: 0,
      maxPoints: 5,
      stepsRevealed: 5,
      won: false,
    };
    expect(formatScore(score)).toBe('0/5');
  });

  it('formats perfect score', () => {
    const score: GameScore = {
      points: 10,
      maxPoints: 10,
      stepsRevealed: 1,
      won: true,
    };
    expect(formatScore(score)).toBe('10/10');
  });

  it('formats minimum winning score', () => {
    const score: GameScore = {
      points: 1,
      maxPoints: 10,
      stepsRevealed: 10,
      won: true,
    };
    expect(formatScore(score)).toBe('1/10');
  });
});
