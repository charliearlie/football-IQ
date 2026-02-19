/**
 * Tests for Timeline scoring utilities.
 *
 * Scoring system (attempt-based, 5-point scale):
 * - 1 attempt  → 5 points  "Perfect Timeline"
 * - 2 attempts → 4 points  "World Class"
 * - 3 attempts → 3 points  "Expert"
 * - 4 attempts → 2 points  "Promising"
 * - 5 attempts → 1 point   "Rookie"
 * - Lost / gave up         → 0 points  ""
 *
 * Normalized score: points * 20  (maps 0-5 → 0-100)
 */

import {
  calculateTimelineScore,
  getTimelineScoreLabel,
  normalizeTimelineScore,
  MAX_TIMELINE_ATTEMPTS,
} from '../utils/scoring';
import { TimelineScore } from '../types/timeline.types';

describe('calculateTimelineScore', () => {
  describe('winning scenarios', () => {
    it('returns 5 points and "Perfect Timeline" label for 1 attempt', () => {
      const score = calculateTimelineScore(1, true);

      expect(score.points).toBe(5);
      expect(score.label).toBe('Perfect Timeline');
      expect(score.totalAttempts).toBe(1);
    });

    it('returns 4 points and "World Class" label for 2 attempts', () => {
      const score = calculateTimelineScore(2, true);

      expect(score.points).toBe(4);
      expect(score.label).toBe('World Class');
      expect(score.totalAttempts).toBe(2);
    });

    it('returns 3 points and "Expert" label for 3 attempts', () => {
      const score = calculateTimelineScore(3, true);

      expect(score.points).toBe(3);
      expect(score.label).toBe('Expert');
      expect(score.totalAttempts).toBe(3);
    });

    it('returns 2 points and "Promising" label for 4 attempts', () => {
      const score = calculateTimelineScore(4, true);

      expect(score.points).toBe(2);
      expect(score.label).toBe('Promising');
      expect(score.totalAttempts).toBe(4);
    });

    it('returns 1 point and "Rookie" label for 5 attempts', () => {
      const score = calculateTimelineScore(5, true);

      expect(score.points).toBe(1);
      expect(score.label).toBe('Rookie');
      expect(score.totalAttempts).toBe(5);
    });
  });

  describe('losing scenarios', () => {
    it('returns 0 points for gave up (0 attempts, won=false)', () => {
      const score = calculateTimelineScore(0, false);

      expect(score.points).toBe(0);
      expect(score.label).toBe('');
      expect(score.totalAttempts).toBe(0);
    });

    it('returns 0 points for lost after all 5 attempts (won=false)', () => {
      const score = calculateTimelineScore(5, false);

      expect(score.points).toBe(0);
      expect(score.label).toBe('');
      expect(score.totalAttempts).toBe(5);
    });

    it('returns 0 points regardless of attempt count when won=false', () => {
      expect(calculateTimelineScore(1, false).points).toBe(0);
      expect(calculateTimelineScore(2, false).points).toBe(0);
      expect(calculateTimelineScore(3, false).points).toBe(0);
      expect(calculateTimelineScore(4, false).points).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('always gives at least 1 point when won=true, even for many attempts', () => {
      // Formula: Math.max(1, 6 - totalAttempts) — floor is 1 for winners
      const score = calculateTimelineScore(10, true);

      expect(score.points).toBeGreaterThanOrEqual(1);
    });

    it('returns a complete TimelineScore object with all required fields', () => {
      const score = calculateTimelineScore(2, true);

      expect(score).toEqual({
        points: 4,
        totalAttempts: 2,
        label: 'World Class',
      });
    });
  });
});

describe('getTimelineScoreLabel', () => {
  it('returns "Perfect Timeline" for 5 points', () => {
    expect(getTimelineScoreLabel(5)).toBe('Perfect Timeline');
  });

  it('returns "World Class" for 4 points', () => {
    expect(getTimelineScoreLabel(4)).toBe('World Class');
  });

  it('returns "Expert" for 3 points', () => {
    expect(getTimelineScoreLabel(3)).toBe('Expert');
  });

  it('returns "Promising" for 2 points', () => {
    expect(getTimelineScoreLabel(2)).toBe('Promising');
  });

  it('returns "Rookie" for 1 point', () => {
    expect(getTimelineScoreLabel(1)).toBe('Rookie');
  });

  it('returns "" for 0 points', () => {
    expect(getTimelineScoreLabel(0)).toBe('');
  });

  it('returns "" for an unknown point value', () => {
    expect(getTimelineScoreLabel(99)).toBe('');
    expect(getTimelineScoreLabel(-1)).toBe('');
  });
});

describe('normalizeTimelineScore', () => {
  it('normalizes 5 points to 100', () => {
    const score: TimelineScore = { points: 5, totalAttempts: 1, label: 'Perfect Timeline' };
    expect(normalizeTimelineScore(score)).toBe(100);
  });

  it('normalizes 4 points to 80', () => {
    const score: TimelineScore = { points: 4, totalAttempts: 2, label: 'World Class' };
    expect(normalizeTimelineScore(score)).toBe(80);
  });

  it('normalizes 3 points to 60', () => {
    const score: TimelineScore = { points: 3, totalAttempts: 3, label: 'Expert' };
    expect(normalizeTimelineScore(score)).toBe(60);
  });

  it('normalizes 2 points to 40', () => {
    const score: TimelineScore = { points: 2, totalAttempts: 4, label: 'Promising' };
    expect(normalizeTimelineScore(score)).toBe(40);
  });

  it('normalizes 1 point to 20', () => {
    const score: TimelineScore = { points: 1, totalAttempts: 5, label: 'Rookie' };
    expect(normalizeTimelineScore(score)).toBe(20);
  });

  it('normalizes 0 points to 0', () => {
    const score: TimelineScore = { points: 0, totalAttempts: 5, label: '' };
    expect(normalizeTimelineScore(score)).toBe(0);
  });
});

describe('MAX_TIMELINE_ATTEMPTS', () => {
  it('equals 5', () => {
    expect(MAX_TIMELINE_ATTEMPTS).toBe(5);
  });
});
