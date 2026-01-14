import { useState, useEffect } from 'react';
import { usePuzzle } from './usePuzzle';
import { getPuzzle } from '@/lib/database';
import { GameMode, ParsedLocalPuzzle, UsePuzzleResult } from '../types/puzzle.types';

/** Valid game modes for type checking */
const GAME_MODES: GameMode[] = [
  'career_path',
  'tic_tac_toe',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'topical_quiz',
];

/** Check if a string is a valid game mode */
function isGameMode(value: string): value is GameMode {
  return GAME_MODES.includes(value as GameMode);
}

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
 * - Falls back to SQLite lookup for archive puzzles not in context
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
  const [hasAttemptedSqlite, setHasAttemptedSqlite] = useState(false);

  // Update stable puzzle only on first successful fetch
  useEffect(() => {
    if (fetchedPuzzle && !stablePuzzle) {
      setStablePuzzle(fetchedPuzzle);
    }
    // Mark that we've attempted to load (even if puzzle is null)
    if (!contextLoading && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
    }
  }, [fetchedPuzzle, stablePuzzle, contextLoading]);  // Removed hasAttemptedLoad - guard prevents re-execution

  // Fallback: Try SQLite directly if puzzle not in context
  // This handles archive puzzles that were just unlocked via ad
  useEffect(() => {
    async function tryFetchFromSqlite() {
      // Only try SQLite if:
      // - We've attempted context load and it's done
      // - No puzzle found in context
      // - We haven't already cached a puzzle
      // - This is a puzzle ID (not a game mode)
      // - We haven't already tried SQLite
      if (
        hasAttemptedLoad &&
        !fetchedPuzzle &&
        !stablePuzzle &&
        !isGameMode(gameModeOrPuzzleId) &&
        !hasAttemptedSqlite
      ) {
        setHasAttemptedSqlite(true);
        try {
          const sqlitePuzzle = await getPuzzle(gameModeOrPuzzleId);
          if (sqlitePuzzle) {
            setStablePuzzle(sqlitePuzzle);
          }
        } catch (error) {
          console.warn('[useStablePuzzle] SQLite fallback failed:', error);
        }
      }
    }
    tryFetchFromSqlite();
  }, [hasAttemptedLoad, fetchedPuzzle, gameModeOrPuzzleId]);  // Removed stablePuzzle, hasAttemptedSqlite - guards prevent re-execution

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
