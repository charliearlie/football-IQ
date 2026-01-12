/**
 * Distribution Service
 *
 * Fetches score distribution data from Supabase RPC.
 * Used by the "How You Compare" feature in result modals.
 */

import { supabase } from '@/lib/supabase';

/**
 * Response row from get_puzzle_score_distribution RPC.
 */
interface DistributionRow {
  score: number;
  count: number;
  percentage: number;
  total_attempts: number;
}

/**
 * Transformed distribution entry for UI.
 */
export interface DistributionEntry {
  score: number;
  count: number;
  percentage: number;
}

/**
 * Full distribution result with metadata.
 */
export interface DistributionResult {
  distribution: DistributionEntry[];
  totalAttempts: number;
}

/**
 * Transform RPC response row to camelCase.
 */
function transformDistributionRow(row: DistributionRow): DistributionEntry {
  return {
    score: row.score,
    count: Number(row.count),
    percentage: Number(row.percentage),
  };
}

/**
 * Fetch score distribution for a specific puzzle.
 *
 * @param puzzleId - UUID of the puzzle
 * @returns Distribution data or throws on error
 *
 * @example
 * ```ts
 * const result = await getPuzzleScoreDistribution('abc-123');
 * // result.distribution = [{ score: 100, count: 5, percentage: 10 }, ...]
 * // result.totalAttempts = 50
 * ```
 */
export async function getPuzzleScoreDistribution(
  puzzleId: string
): Promise<DistributionResult> {
  // Note: get_puzzle_score_distribution is a custom RPC not yet in generated types
  // Using type assertion until types are regenerated
  const { data, error } = await (supabase.rpc as CallableFunction)(
    'get_puzzle_score_distribution',
    { target_puzzle_id: puzzleId }
  );

  if (error) {
    console.error('Error fetching score distribution:', error);
    throw new Error(`Failed to fetch distribution: ${(error as Error).message}`);
  }

  const rows = data as DistributionRow[] | null;

  // Handle empty results
  if (!rows || rows.length === 0) {
    return { distribution: [], totalAttempts: 0 };
  }

  // Extract total attempts from first row (all rows have same total)
  const totalAttempts = Number(rows[0]?.total_attempts ?? 0);

  return {
    distribution: rows.map(transformDistributionRow),
    totalAttempts,
  };
}
