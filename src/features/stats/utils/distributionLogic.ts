/**
 * Score Distribution Logic
 *
 * Pure functions for calculating and normalizing score distributions.
 * Used by the "How You Compare" feature in result modals.
 */

/**
 * Raw score count from database.
 */
export interface ScoreCount {
  score: number;
  count: number;
}

/**
 * Distribution bucket with percentage.
 */
export interface DistributionBucket {
  score: number;
  count: number;
  percentage: number;
}

/**
 * Calculate distribution buckets from raw score counts.
 *
 * Groups scores into buckets (e.g., 0, 10, 20, ..., 100 for bucketSize=10)
 * and calculates the percentage of players in each bucket.
 *
 * @param rawData - Array of { score, count } from database
 * @param maxScore - Maximum possible score (e.g., 100)
 * @param bucketSize - Size of each bucket (default 10)
 * @returns Array of buckets sorted by score descending
 *
 * @example
 * ```ts
 * const buckets = calculateDistributionBuckets(
 *   [{ score: 70, count: 25 }, { score: 50, count: 75 }],
 *   100,
 *   10
 * );
 * // Returns 11 buckets (0, 10, 20, ..., 100)
 * // bucket at 70: { score: 70, count: 25, percentage: 25 }
 * // bucket at 50: { score: 50, count: 75, percentage: 75 }
 * ```
 */
export function calculateDistributionBuckets(
  rawData: ScoreCount[],
  maxScore: number,
  bucketSize: number = 10
): DistributionBucket[] {
  // Calculate number of buckets (e.g., 0-100 with size 10 = 11 buckets)
  const bucketCount = Math.floor(maxScore / bucketSize) + 1;

  // Initialize buckets with zero counts
  const buckets: Map<number, number> = new Map();
  for (let i = 0; i < bucketCount; i++) {
    buckets.set(i * bucketSize, 0);
  }

  // Aggregate counts into buckets
  let totalCount = 0;
  for (const { score, count } of rawData) {
    // Map score to bucket (e.g., 75 -> 70 bucket when bucketSize=10)
    const bucketKey = Math.floor(score / bucketSize) * bucketSize;

    // Ensure bucket exists (handle edge cases)
    if (bucketKey >= 0 && bucketKey <= maxScore) {
      const current = buckets.get(bucketKey) || 0;
      buckets.set(bucketKey, current + count);
      totalCount += count;
    }
  }

  // Convert to array with percentages
  const result: DistributionBucket[] = [];
  for (const [score, count] of buckets.entries()) {
    result.push({
      score,
      count,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    });
  }

  // Sort by score ascending (0 to maxScore)
  result.sort((a, b) => a.score - b.score);

  return result;
}

/**
 * Normalize raw score counts to percentages.
 *
 * Unlike calculateDistributionBuckets, this preserves original scores
 * without bucketing. Useful for display when exact scores are needed.
 *
 * @param raw - Array of { score, count }
 * @returns Array with added percentage field
 */
export function normalizeDistribution(raw: ScoreCount[]): DistributionBucket[] {
  const total = raw.reduce((sum, r) => sum + r.count, 0);

  return raw.map(({ score, count }) => ({
    score,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

/**
 * Calculate percentile rank (what % of players scored lower).
 *
 * @param userScore - The user's score
 * @param distribution - Distribution buckets
 * @returns Percentile (0-100) - percentage of players who scored lower
 *
 * @example
 * ```ts
 * // If 30% of players scored lower than your score of 70
 * getPercentileRank(70, distribution) // Returns 30
 * ```
 */
export function getPercentileRank(
  userScore: number,
  distribution: DistributionBucket[]
): number {
  if (distribution.length === 0) {
    return 0;
  }

  // Sum counts of all buckets with scores lower than user's score
  let lowerCount = 0;
  let totalCount = 0;

  for (const bucket of distribution) {
    totalCount += bucket.count;
    if (bucket.score < userScore) {
      lowerCount += bucket.count;
    }
  }

  return totalCount > 0 ? Math.round((lowerCount / totalCount) * 100) : 0;
}
