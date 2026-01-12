/**
 * useScoreDistribution Hook
 *
 * Fetches and manages score distribution state for a puzzle.
 * Used by ScoreDistributionContainer in result modals.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import {
  getPuzzleScoreDistribution,
  DistributionEntry,
} from '../services/distributionService';

export interface UseScoreDistributionResult {
  /** Distribution data by score */
  distribution: DistributionEntry[];
  /** Total number of attempts for this puzzle */
  totalAttempts: number;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch distribution */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching puzzle score distribution.
 *
 * Fetches distribution data from Supabase when puzzleId is provided.
 * Returns empty distribution when puzzleId is null/undefined.
 *
 * @param puzzleId - UUID of the puzzle (null/undefined skips fetch)
 * @param _gameMode - Game mode (for future use, not currently used in query)
 * @returns Distribution state and refetch action
 *
 * @example
 * ```tsx
 * const { distribution, totalAttempts, isLoading, error } = useScoreDistribution(
 *   puzzle.id,
 *   'top_tens'
 * );
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return null;
 *
 * return <ScoreDistributionGraph distribution={distribution} ... />;
 * ```
 */
export function useScoreDistribution(
  puzzleId: string | undefined | null,
  _gameMode: GameMode
): UseScoreDistributionResult {
  const [distribution, setDistribution] = useState<DistributionEntry[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const fetchDistribution = useCallback(async () => {
    // Skip fetch if no puzzleId
    if (!puzzleId) {
      setDistribution([]);
      setTotalAttempts(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPuzzleScoreDistribution(puzzleId);

      // Only update state if still mounted
      if (isMountedRef.current) {
        setDistribution(result.distribution);
        setTotalAttempts(result.totalAttempts);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const fetchError =
          err instanceof Error ? err : new Error('Failed to fetch distribution');
        setError(fetchError);
        console.error('useScoreDistribution error:', fetchError);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [puzzleId]);

  // Fetch distribution when puzzleId changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchDistribution();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDistribution]);

  return {
    distribution,
    totalAttempts,
    isLoading,
    error,
    refetch: fetchDistribution,
  };
}
