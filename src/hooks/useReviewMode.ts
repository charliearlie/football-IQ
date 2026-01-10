import { useState, useEffect, useMemo } from 'react';
import { getAttemptByPuzzleId } from '@/lib/database';
import { ParsedLocalAttempt } from '@/types/database';

export interface UseReviewModeResult<TMetadata> {
  /** Whether review mode is active */
  isReviewMode: boolean;
  /** The completed attempt data (null if loading or not in review mode) */
  attempt: ParsedLocalAttempt | null;
  /** The parsed metadata from the attempt (typed as TMetadata) */
  metadata: TMetadata | null;
  /** Whether the attempt is being loaded */
  isLoading: boolean;
  /** Error if attempt loading failed */
  error: Error | null;
}

/**
 * Hook to fetch and provide attempt data for review mode.
 *
 * When isReviewMode is true, fetches the completed attempt for the given puzzleId
 * and provides the parsed metadata for rendering the review UI.
 *
 * @param puzzleId - The puzzle ID to fetch the attempt for
 * @param isReviewMode - Whether review mode is active
 * @returns Review mode state including attempt and typed metadata
 *
 * @example
 * ```tsx
 * interface CareerPathMetadata {
 *   guesses: string[];
 *   revealedCount: number;
 *   won: boolean;
 *   totalSteps: number;
 * }
 *
 * const { isReviewMode, metadata, isLoading } = useReviewMode<CareerPathMetadata>(
 *   puzzleId,
 *   params.review === 'true'
 * );
 *
 * if (isReviewMode && metadata) {
 *   // Render review UI with metadata.guesses, metadata.revealedCount, etc.
 * }
 * ```
 */
export function useReviewMode<TMetadata>(
  puzzleId: string | undefined,
  isReviewMode: boolean
): UseReviewModeResult<TMetadata> {
  const [attempt, setAttempt] = useState<ParsedLocalAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset state when not in review mode
    if (!isReviewMode || !puzzleId) {
      setAttempt(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchAttempt() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAttemptByPuzzleId(puzzleId!);

        if (cancelled) return;

        if (result && result.completed) {
          setAttempt(result);
        } else {
          // No completed attempt found - this shouldn't happen in normal usage
          // but handle gracefully
          setError(new Error('No completed attempt found for this puzzle'));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to load attempt'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchAttempt();

    return () => {
      cancelled = true;
    };
  }, [puzzleId, isReviewMode]);

  // Parse metadata as the expected type
  const metadata = useMemo<TMetadata | null>(() => {
    if (!attempt?.metadata) return null;
    // The metadata is already parsed by parseAttempt in database.ts
    return attempt.metadata as TMetadata;
  }, [attempt?.metadata]);

  return {
    isReviewMode,
    attempt,
    metadata,
    isLoading,
    error,
  };
}
