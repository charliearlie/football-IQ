import { useState, useEffect } from 'react';
import { usePuzzle } from './usePuzzle';
import { getPuzzle } from '@/lib/database';
import { GameMode, ParsedLocalPuzzle, UsePuzzleResult } from '../types/puzzle.types';

import { fetchAndSavePuzzle } from '@/features/puzzles/services/puzzleSyncService';

/** Valid game modes for type checking */
const GAME_MODES: GameMode[] = [
  'career_path',
  'career_path_pro',
  'the_grid',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'topical_quiz',
  'top_tens',
  'starting_xi',
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
 * - Final fallback: fetches from network if missing locally (e.g. ad-unlocked)
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

  const [stablePuzzle, setStablePuzzle] = useState<ParsedLocalPuzzle | null>(null);
  
  // State machine for loading process
  // idle: waiting for context to load
  // context_checked: context loaded, checking if we have puzzle
  // checking_sqlite: checking sqlite fallback
  // checking_network: checking network fallback
  // resolved: puzzle found (or definitively not found)
  const [loadState, setLoadState] = useState<
    'idle' | 'context_checked' | 'checking_sqlite' | 'checking_network' | 'resolved'
  >('idle');

  // Effect 1: Sync with Context
  useEffect(() => {
    if (!contextLoading && loadState === 'idle') {
      if (fetchedPuzzle) {
        setStablePuzzle(fetchedPuzzle);
        setLoadState('resolved');
      } else {
        setLoadState('context_checked');
      }
    } else if (fetchedPuzzle && !stablePuzzle && loadState !== 'resolved') {
      // Late arrival from context (e.g. background sync)
      // Only process if we haven't already resolved to prevent race conditions
      setStablePuzzle(fetchedPuzzle);
      setLoadState('resolved');
    } else if (fetchedPuzzle && stablePuzzle && loadState === 'resolved') {
      // Check if puzzle was UPDATED (not just synced) - this happens when
      // light sync detects a CMS edit and refreshes the puzzle content.
      // We detect this by comparing updated_at timestamps.
      const fetchedUpdatedAt = fetchedPuzzle.updated_at;
      const stableUpdatedAt = stablePuzzle.updated_at;

      if (fetchedUpdatedAt && fetchedUpdatedAt !== stableUpdatedAt) {
        console.log(
          '[useStablePuzzle] Puzzle content updated, refreshing:',
          stableUpdatedAt,
          '->',
          fetchedUpdatedAt
        );
        setStablePuzzle(fetchedPuzzle);
      }
    }
  }, [contextLoading, loadState, fetchedPuzzle, stablePuzzle]);

  // Effect 2: Fallback Logic
  useEffect(() => {
    async function executeFallback() {
      // Only proceed if we've checked context and haven't found a puzzle yet
      if (loadState !== 'context_checked' || stablePuzzle || isGameMode(gameModeOrPuzzleId)) {
        if (loadState === 'context_checked' && isGameMode(gameModeOrPuzzleId)) {
           // Game modes don't fallback to UUID logic, so we are done
           setLoadState('resolved');
        }
        return;
      }

      // Start SQLite check
      setLoadState('checking_sqlite');
      console.log('[useStablePuzzle] Checking SQLite for:', gameModeOrPuzzleId);
      
      try {
        const sqlitePuzzle = await getPuzzle(gameModeOrPuzzleId);
        if (sqlitePuzzle) {
          console.log('[useStablePuzzle] Found in SQLite');
          setStablePuzzle(sqlitePuzzle);
          setLoadState('resolved');
          return;
        }
      } catch (e) {
        console.error('[useStablePuzzle] SQLite check failed', e);
      }

      // SQLite failed, try Network
      setLoadState('checking_network');
      console.log('[useStablePuzzle] Checking Network for:', gameModeOrPuzzleId);

      try {
        const networkPuzzle = await fetchAndSavePuzzle(gameModeOrPuzzleId);
        if (networkPuzzle) {
           console.log('[useStablePuzzle] Found in Network');
           // Re-fetch from SQLite to get parsed object
           const reloaded = await getPuzzle(gameModeOrPuzzleId);
           if (reloaded) {
             setStablePuzzle(reloaded);
           }
        } else {
            console.warn('[useStablePuzzle] Network fetch failed');
        }
      } catch (e) {
        console.error('[useStablePuzzle] Network check failed', e);
      }

      // Done
      setLoadState('resolved');
    }

    executeFallback();
  }, [loadState, stablePuzzle, gameModeOrPuzzleId]);

  const isLoading = !stablePuzzle && loadState !== 'resolved';

  return {
    puzzle: stablePuzzle ?? fetchedPuzzle,
    isLoading,
    refetch,
  };
}
