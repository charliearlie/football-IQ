/**
 * Score Distribution Logic Tests
 *
 * TDD tests for the "How You Compare" distribution calculation.
 * Write tests BEFORE implementation to define expected behavior.
 */

import {
  calculateDistributionBuckets,
  normalizeDistribution,
  getPercentileRank,
  type ScoreCount,
  type DistributionBucket,
} from '../utils/distributionLogic';

describe('calculateDistributionBuckets', () => {
  describe('single score scenarios', () => {
    it('single score shows 100% at that score bucket', () => {
      const rawData: ScoreCount[] = [{ score: 70, count: 1 }];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      // Should have 11 buckets for 0-100 in 10s
      expect(distribution).toHaveLength(11);

      // Bucket at 70 should have 100%
      const bucket70 = distribution.find((b) => b.score === 70);
      expect(bucket70).toBeDefined();
      expect(bucket70?.count).toBe(1);
      expect(bucket70?.percentage).toBe(100);

      // All other buckets should be 0
      const otherBuckets = distribution.filter((b) => b.score !== 70);
      otherBuckets.forEach((bucket) => {
        expect(bucket.count).toBe(0);
        expect(bucket.percentage).toBe(0);
      });
    });

    it('score at boundary maps to correct bucket', () => {
      const rawData: ScoreCount[] = [{ score: 100, count: 1 }];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      const bucket100 = distribution.find((b) => b.score === 100);
      expect(bucket100?.percentage).toBe(100);
    });

    it('score of 0 maps to first bucket', () => {
      const rawData: ScoreCount[] = [{ score: 0, count: 1 }];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      const bucket0 = distribution.find((b) => b.score === 0);
      expect(bucket0?.percentage).toBe(100);
    });
  });

  describe('multiple identical scores', () => {
    it('all players same score shows 100% at that bucket', () => {
      const rawData: ScoreCount[] = [{ score: 50, count: 100 }];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      const bucket50 = distribution.find((b) => b.score === 50);
      expect(bucket50?.count).toBe(100);
      expect(bucket50?.percentage).toBe(100);
    });
  });

  describe('mixed score distribution', () => {
    it('calculates correct percentages for mixed scores', () => {
      // 25 at score 80, 50 at score 50, 25 at score 30 = 100 total
      const rawData: ScoreCount[] = [
        { score: 80, count: 25 },
        { score: 50, count: 50 },
        { score: 30, count: 25 },
      ];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      expect(distribution.find((b) => b.score === 80)?.percentage).toBe(25);
      expect(distribution.find((b) => b.score === 50)?.percentage).toBe(50);
      expect(distribution.find((b) => b.score === 30)?.percentage).toBe(25);
    });

    it('handles scores within same bucket', () => {
      // Scores 71, 75, 79 all go into 70 bucket (70-79)
      const rawData: ScoreCount[] = [
        { score: 71, count: 10 },
        { score: 75, count: 20 },
        { score: 79, count: 10 },
      ];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      const bucket70 = distribution.find((b) => b.score === 70);
      expect(bucket70?.count).toBe(40);
      expect(bucket70?.percentage).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('empty array returns zero distribution', () => {
      const distribution = calculateDistributionBuckets([], 100, 10);

      expect(distribution).toHaveLength(11);
      expect(distribution.every((b) => b.count === 0)).toBe(true);
      expect(distribution.every((b) => b.percentage === 0)).toBe(true);
    });

    it('handles bucket size of 1', () => {
      const rawData: ScoreCount[] = [
        { score: 5, count: 1 },
        { score: 7, count: 2 },
      ];
      const distribution = calculateDistributionBuckets(rawData, 10, 1);

      expect(distribution).toHaveLength(11); // 0-10 inclusive
      expect(distribution.find((b) => b.score === 5)?.count).toBe(1);
      expect(distribution.find((b) => b.score === 7)?.count).toBe(2);
    });

    it('handles Top Tens 0-10 scale with bucket size 10', () => {
      // Top Tens: scores normalized to 0-100 (0, 10, 20, ..., 100)
      const rawData: ScoreCount[] = [
        { score: 100, count: 5 }, // 10/10 = 5 players
        { score: 70, count: 15 }, // 7/10 = 15 players
        { score: 50, count: 30 }, // 5/10 = 30 players
      ];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      expect(distribution.find((b) => b.score === 100)?.percentage).toBe(10);
      expect(distribution.find((b) => b.score === 70)?.percentage).toBe(30);
      expect(distribution.find((b) => b.score === 50)?.percentage).toBe(60);
    });
  });

  describe('rounding behavior', () => {
    it('rounds percentages to integers', () => {
      // 1 out of 3 = 33.33...%
      const rawData: ScoreCount[] = [
        { score: 90, count: 1 },
        { score: 80, count: 1 },
        { score: 70, count: 1 },
      ];
      const distribution = calculateDistributionBuckets(rawData, 100, 10);

      // Each should round to 33%
      expect(distribution.find((b) => b.score === 90)?.percentage).toBe(33);
      expect(distribution.find((b) => b.score === 80)?.percentage).toBe(33);
      expect(distribution.find((b) => b.score === 70)?.percentage).toBe(33);
    });
  });
});

describe('normalizeDistribution', () => {
  it('converts raw counts to percentages', () => {
    const raw: ScoreCount[] = [
      { score: 1, count: 25 },
      { score: 2, count: 75 },
    ];
    const normalized = normalizeDistribution(raw);

    expect(normalized[0].percentage).toBe(25);
    expect(normalized[1].percentage).toBe(75);
  });

  it('handles empty array', () => {
    const normalized = normalizeDistribution([]);
    expect(normalized).toHaveLength(0);
  });

  it('handles single item', () => {
    const raw: ScoreCount[] = [{ score: 5, count: 10 }];
    const normalized = normalizeDistribution(raw);

    expect(normalized[0].percentage).toBe(100);
  });

  it('preserves score and count fields', () => {
    const raw: ScoreCount[] = [{ score: 42, count: 17 }];
    const normalized = normalizeDistribution(raw);

    expect(normalized[0].score).toBe(42);
    expect(normalized[0].count).toBe(17);
  });
});

describe('getPercentileRank', () => {
  it('calculates percentile correctly (what % scored lower)', () => {
    const distribution: DistributionBucket[] = [
      { score: 10, count: 10, percentage: 10 },
      { score: 20, count: 20, percentage: 20 },
      { score: 30, count: 30, percentage: 30 },
      { score: 40, count: 40, percentage: 40 },
    ];

    // User scored 30 -> better than 10+20 = 30 (30% scored lower)
    expect(getPercentileRank(30, distribution)).toBe(30);
  });

  it('returns 0 for lowest score', () => {
    const distribution: DistributionBucket[] = [
      { score: 10, count: 50, percentage: 50 },
      { score: 20, count: 50, percentage: 50 },
    ];

    expect(getPercentileRank(10, distribution)).toBe(0);
  });

  it('returns 100 for highest score (everyone scored lower)', () => {
    const distribution: DistributionBucket[] = [
      { score: 10, count: 50, percentage: 50 },
      { score: 20, count: 50, percentage: 50 },
    ];

    // Score of 30 is higher than everyone
    expect(getPercentileRank(30, distribution)).toBe(100);
  });

  it('handles empty distribution', () => {
    expect(getPercentileRank(50, [])).toBe(0);
  });

  it('handles single entry where user has same score', () => {
    const distribution: DistributionBucket[] = [
      { score: 70, count: 1, percentage: 100 },
    ];

    // No one scored lower than 70 when there's only one entry at 70
    expect(getPercentileRank(70, distribution)).toBe(0);
  });
});
