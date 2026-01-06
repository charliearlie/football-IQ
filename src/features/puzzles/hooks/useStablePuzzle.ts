import { useState, useEffect } from 'react';
import { usePuzzle } from './usePuzzle';
import { GameMode, ParsedLocalPuzzle, UsePuzzleResult } from '../types/puzzle.types';

/**
 * A wrapper around usePuzzle that maintains a stable puzzle reference.
 *
 * Once a puzzle is loaded, it's cached in local state and never replaced
 * until the component unmounts. This prevents background sync operations
 * from causing the game screen to flash loading state or remount.
 *
 * Key behaviors:
 * - Shows loading ONLY on first load when puzzle hasn't been fetched yet
 * - Once puzzle is loaded, maintains stable reference across re-renders
 * - Background sync updates are ignored (puzzle data rarely changes mid-game)
 *
 * Use this hook in game screens where you need to preserve in-memory game
 * state across app background/foreground cycles.
 *
 * @param gameModeOrPuzzleId - Game mode for today's puzzle, or specific puzzle ID
 */
export function useStablePuzzle(
  gameModeOrPuzzleId: GameMode | string
): UsePuzzleResult {
  const {
    puzzle: fetchedPuzzle,
    isLoading: contextLoading,
    refetch,
  } = usePuzzle(gameModeOrPuzzleId);

  // Cache puzzle in local state to maintain stable reference
  const [stablePuzzle, setStablePuzzle] = useState<ParsedLocalPuzzle | null>(
    null
  );
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Update stable puzzle only on first successful fetch
  useEffect(() => {
    if (fetchedPuzzle && !stablePuzzle) {
      setStablePuzzle(fetchedPuzzle);
    }
    // Mark that we've attempted to load (even if puzzle is null)
    if (!contextLoading && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
    }
  }, [fetchedPuzzle, stablePuzzle, contextLoading, hasAttemptedLoad]);

  // Only show loading on true first load:
  // - We don't have a cached puzzle yet
  // - We haven't attempted to load yet
  // - The underlying hook is still loading
  const isLoading = !stablePuzzle && !hasAttemptedLoad && contextLoading;

  return {
    puzzle: stablePuzzle ?? fetchedPuzzle,
    isLoading,
    refetch,
  };
}
