/**
 * Career Path Distribution Utilities
 *
 * Transforms distribution data for Career Path game mode.
 * The transformation converts normalized scores (0-100) from the database
 * back to "points" values that map correctly to bucket labels.
 *
 * The bucket/label relationship:
 * - Bucket 5 (points=5) -> index 0 -> label "1 club" (best)
 * - Bucket 4 (points=4) -> index 1 -> label "2 clubs"
 * - Bucket 3 (points=3) -> index 2 -> label "3 clubs"
 * - Bucket 2 (points=2) -> index 3 -> label "4 clubs"
 * - Bucket 1 (points=1) -> index 4 -> label "5 clubs" (worst)
 */

import { DistributionEntry } from '../services/distributionService';

/**
 * Transform Career Path distribution from normalized 0-100 scores to points.
 *
 * The RPC returns normalized scores: (points / maxPoints) * 100
 * We need to convert back to points so the buckets align with labels.
 *
 * @param distribution - Raw distribution entries from API
 * @param maxSteps - Total number of career steps in the puzzle
 * @returns Distribution entries with score = points (1 to maxSteps)
 *
 * @example
 * // Input: normalized score of 80 for a 5-step career
 * // Means: points = 4 (revealed 2 clubs)
 * // Output: { score: 4, percentage: X }
 */
export function transformCareerPathDistribution(
  distribution: DistributionEntry[],
  maxSteps: number
): DistributionEntry[] {
  // Group by points value
  const pointsMap = new Map<number, number>();

  for (const entry of distribution) {
    // Convert normalized score (0-100) back to points (0 to maxSteps)
    // normalized = (points / maxSteps) * 100
    // points = normalized * maxSteps / 100
    const points = Math.round((entry.score * maxSteps) / 100);

    // Clamp to valid bucket range (1 to maxSteps)
    // Score of 0 (loss) maps to bucket 1 (worst)
    const clampedPoints = Math.max(1, Math.min(points, maxSteps));

    const current = pointsMap.get(clampedPoints) || 0;
    pointsMap.set(clampedPoints, current + entry.percentage);
  }

  // Convert to array with points as score
  return Array.from(pointsMap.entries()).map(([points, percentage]) => ({
    score: points,
    count: 0, // Not used for display
    percentage,
  }));
}
