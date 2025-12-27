/**
 * Tests for Topical Quiz Scoring
 */

import {
  calculateQuizScore,
  formatQuizScore,
  formatQuizScoreDetailed,
} from '../utils/quizScoring';

describe('calculateQuizScore', () => {
  it('returns 10 points for perfect score (5/5)', () => {
    const score = calculateQuizScore(5);

    expect(score.points).toBe(10);
    expect(score.maxPoints).toBe(10);
    expect(score.correctCount).toBe(5);
    expect(score.totalQuestions).toBe(5);
    expect(score.won).toBe(true);
  });

  it('returns 6 points for 3/5 correct', () => {
    const score = calculateQuizScore(3);

    expect(score.points).toBe(6);
    expect(score.correctCount).toBe(3);
    expect(score.won).toBe(true);
  });

  it('returns 0 points for 0/5 correct', () => {
    const score = calculateQuizScore(0);

    expect(score.points).toBe(0);
    expect(score.correctCount).toBe(0);
    expect(score.won).toBe(true); // No fail condition
  });

  it('returns 2 points per correct answer', () => {
    expect(calculateQuizScore(1).points).toBe(2);
    expect(calculateQuizScore(2).points).toBe(4);
    expect(calculateQuizScore(3).points).toBe(6);
    expect(calculateQuizScore(4).points).toBe(8);
    expect(calculateQuizScore(5).points).toBe(10);
  });

  it('clamps negative values to 0', () => {
    const score = calculateQuizScore(-1);

    expect(score.points).toBe(0);
    expect(score.correctCount).toBe(0);
  });

  it('clamps values above 5 to 5', () => {
    const score = calculateQuizScore(10);

    expect(score.points).toBe(10);
    expect(score.correctCount).toBe(5);
  });

  it('always returns won: true (no fail condition)', () => {
    expect(calculateQuizScore(0).won).toBe(true);
    expect(calculateQuizScore(1).won).toBe(true);
    expect(calculateQuizScore(5).won).toBe(true);
  });
});

describe('formatQuizScore', () => {
  it('formats score as "X/5"', () => {
    expect(formatQuizScore(calculateQuizScore(5))).toBe('5/5');
    expect(formatQuizScore(calculateQuizScore(3))).toBe('3/5');
    expect(formatQuizScore(calculateQuizScore(0))).toBe('0/5');
  });
});

describe('formatQuizScoreDetailed', () => {
  it('formats score with points', () => {
    expect(formatQuizScoreDetailed(calculateQuizScore(5))).toBe(
      '5/5 Correct (10 pts)'
    );
    expect(formatQuizScoreDetailed(calculateQuizScore(3))).toBe(
      '3/5 Correct (6 pts)'
    );
    expect(formatQuizScoreDetailed(calculateQuizScore(0))).toBe(
      '0/5 Correct (0 pts)'
    );
  });
});
