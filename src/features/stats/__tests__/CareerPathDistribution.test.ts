/**
 * Career Path Distribution Transformation Tests
 *
 * Tests for transforming normalized scores (0-100) from the database
 * back to Career Path bucket scores (points).
 *
 * The system is designed so:
 * - Higher bucket scores = better performance
 * - Bucket 5 -> index 0 -> label "1 club" (best)
 * - Bucket 4 -> index 1 -> label "2 clubs"
 * - Bucket 1 -> index 4 -> label "5 clubs" (worst)
 */

import { transformCareerPathDistribution } from '../utils/careerPathDistribution';
import { DistributionEntry } from '../services/distributionService';

describe('transformCareerPathDistribution', () => {
  describe('basic transformations', () => {
    it('transforms normalized score 80 (2 clubs revealed) to points 4', () => {
      // When maxSteps=5 and someone reveals 2 clubs:
      // points = 5 - (2-1) = 4
      // normalized = (4/5) * 100 = 80
      // Should map back to bucket 4 (which displays as "2 clubs")
      const distribution: DistributionEntry[] = [
        { score: 80, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(4);
      expect(result[0].percentage).toBe(100);
    });

    it('transforms normalized score 100 (1 club revealed) to points 5', () => {
      // Perfect game: 1 club revealed
      // points = 5 - (1-1) = 5
      // normalized = (5/5) * 100 = 100
      const distribution: DistributionEntry[] = [
        { score: 100, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      expect(result[0].score).toBe(5);
    });

    it('transforms normalized score 60 (3 clubs revealed) to points 3', () => {
      // 3 clubs revealed
      // points = 5 - (3-1) = 3
      // normalized = (3/5) * 100 = 60
      const distribution: DistributionEntry[] = [
        { score: 60, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      expect(result[0].score).toBe(3);
    });

    it('transforms normalized score 40 (4 clubs revealed) to points 2', () => {
      // 4 clubs revealed
      // points = 5 - (4-1) = 2
      // normalized = (2/5) * 100 = 40
      const distribution: DistributionEntry[] = [
        { score: 40, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      expect(result[0].score).toBe(2);
    });

    it('transforms normalized score 20 (5 clubs revealed, barely won) to points 1', () => {
      // 5 clubs revealed but still won
      // points = 5 - (5-1) = 1
      // normalized = (1/5) * 100 = 20
      const distribution: DistributionEntry[] = [
        { score: 20, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      expect(result[0].score).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('transforms normalized score 0 (loss) to points 1 (clamped to minScore)', () => {
      // Lost game: points = 0
      // normalized = 0
      // Should clamp to 1 (minScore for career path)
      const distribution: DistributionEntry[] = [
        { score: 0, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      // Clamped to minimum of 1
      expect(result[0].score).toBe(1);
    });

    it('handles empty distribution', () => {
      const distribution: DistributionEntry[] = [];
      const result = transformCareerPathDistribution(distribution, 5);

      expect(result).toHaveLength(0);
    });

    it('aggregates multiple scores into same bucket', () => {
      // Two entries that both round to points=4
      const distribution: DistributionEntry[] = [
        { score: 78, count: 5, percentage: 25 }, // rounds to 4
        { score: 82, count: 15, percentage: 75 }, // rounds to 4
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      // Should aggregate into single bucket
      const bucket4 = result.find((r) => r.score === 4);
      expect(bucket4).toBeDefined();
      expect(bucket4?.percentage).toBe(100); // 25 + 75
    });
  });

  describe('different maxSteps values', () => {
    it('handles 10-step career (maxSteps=10)', () => {
      // 10 steps, reveal 2 -> points = 10 - (2-1) = 9
      // normalized = (9/10) * 100 = 90
      const distribution: DistributionEntry[] = [
        { score: 90, count: 1, percentage: 100 },
      ];
      const result = transformCareerPathDistribution(distribution, 10);

      expect(result[0].score).toBe(9);
    });

    it('handles 3-step career (maxSteps=3)', () => {
      // 3 steps, reveal 2 -> points = 3 - (2-1) = 2
      // normalized = (2/3) * 100 = 66.67
      const distribution: DistributionEntry[] = [
        { score: 67, count: 1, percentage: 100 }, // rounds to 67
      ];
      const result = transformCareerPathDistribution(distribution, 3);

      expect(result[0].score).toBe(2);
    });
  });

  describe('distribution with multiple buckets', () => {
    it('correctly transforms a realistic distribution', () => {
      // Realistic distribution for a 5-step career:
      // 10% got it in 1 club (score=100)
      // 30% got it in 2 clubs (score=80)
      // 40% got it in 3 clubs (score=60)
      // 15% got it in 4 clubs (score=40)
      // 5% lost (score=0)
      const distribution: DistributionEntry[] = [
        { score: 100, count: 10, percentage: 10 },
        { score: 80, count: 30, percentage: 30 },
        { score: 60, count: 40, percentage: 40 },
        { score: 40, count: 15, percentage: 15 },
        { score: 0, count: 5, percentage: 5 },
      ];
      const result = transformCareerPathDistribution(distribution, 5);

      // Should have 5 buckets (points 5, 4, 3, 2, 1)
      // Note: score 0 (loss) and score 20 (barely won) both map to points=1
      expect(result.find((r) => r.score === 5)?.percentage).toBe(10);
      expect(result.find((r) => r.score === 4)?.percentage).toBe(30);
      expect(result.find((r) => r.score === 3)?.percentage).toBe(40);
      expect(result.find((r) => r.score === 2)?.percentage).toBe(15);
      expect(result.find((r) => r.score === 1)?.percentage).toBe(5);
    });
  });
});
