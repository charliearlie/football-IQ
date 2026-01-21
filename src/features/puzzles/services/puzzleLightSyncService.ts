/**
 * Puzzle Light Sync Service
 *
 * Performs efficient staleness detection by comparing local vs server updated_at
 * timestamps without fetching full puzzle content. This enables the app to detect
 * CMS edits and refresh stale cached puzzles when returning to foreground.
 *
 * Two-phase sync strategy:
 * 1. Light Check: Fetch only id, updated_at for relevant date range
 * 2. Selective Fetch: Only fetch full content for stale puzzles
 */

import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import {
  getPuzzleTimestampsForDateRange,
  savePuzzle,
  deleteAttemptsByPuzzleId,
} from '@/lib/database';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { transformSupabasePuzzleToLocal } from './puzzleSyncService';
import { SupabasePuzzle } from '../types/puzzle.types';

/**
 * Result of a light sync operation
 */
export interface LightSyncResult {
  /** IDs of puzzles that were detected as stale */
  stalePuzzleIds: string[];
  /** Number of local puzzles checked */
  checkedCount: number;
  /** Number of puzzles that were refreshed */
  updatedCount: number;
}

/**
 * Calculate the date range for light sync based on access tier.
 * Free/Anonymous users check last 7 days (matches RLS window).
 * Premium users check last 30 days of potentially cached puzzles.
 */
function getDateRange(isPremium: boolean): { startDate: string; endDate: string } {
  const today = getAuthorizedDateUnsafe();
  const endDate = today;

  // Calculate start date based on tier
  const start = new Date();
  if (isPremium) {
    // Premium: check last 30 days of cached puzzles
    start.setDate(start.getDate() - 30);
  } else {
    // Free/Anonymous: check last 7 days (matches RLS window)
    start.setDate(start.getDate() - 7);
  }

  // Format as YYYY-MM-DD
  const startDate = start.toISOString().split('T')[0];

  return { startDate, endDate };
}

/**
 * Check for stale puzzles and refresh them if needed.
 *
 * This function is designed to be called on app foreground return.
 * It uses a two-phase approach to minimize bandwidth:
 * 1. Fetch only timestamps from server
 * 2. Compare against local timestamps
 * 3. Fetch full content only for stale puzzles
 *
 * @param isPremium - Whether user has premium access (affects date range)
 * @returns LightSyncResult with counts and stale puzzle IDs
 */
export async function performLightSync(
  isPremium: boolean
): Promise<LightSyncResult> {
  try {
    const { startDate, endDate } = getDateRange(isPremium);

    // Phase 1: Get local puzzle timestamps
    const localTimestamps = await getPuzzleTimestampsForDateRange(
      startDate,
      endDate
    );

    if (localTimestamps.length === 0) {
      // No local puzzles to check - nothing is stale
      return { stalePuzzleIds: [], checkedCount: 0, updatedCount: 0 };
    }

    // Build map for quick lookup: id -> updated_at
    const localMap = new Map<string, string | null>();
    for (const p of localTimestamps) {
      localMap.set(p.id, p.updated_at);
    }

    // Phase 2: Fetch server timestamps for the same date range
    const { data: serverTimestamps, error } = await supabase
      .from('daily_puzzles')
      .select('id, updated_at')
      .gte('puzzle_date', startDate)
      .lte('puzzle_date', endDate);

    if (error) {
      // Network error - silently return (offline graceful handling)
      console.log(
        '[LightSync] Offline or error, skipping check:',
        error.message
      );
      return { stalePuzzleIds: [], checkedCount: 0, updatedCount: 0 };
    }

    if (!serverTimestamps || serverTimestamps.length === 0) {
      // Server returned no puzzles (possibly RLS filtered)
      return {
        stalePuzzleIds: [],
        checkedCount: localTimestamps.length,
        updatedCount: 0,
      };
    }

    // Find stale puzzles by comparing timestamps
    const stalePuzzleIds: string[] = [];

    for (const serverPuzzle of serverTimestamps) {
      const localUpdatedAt = localMap.get(serverPuzzle.id);

      // Puzzle is stale if:
      // 1. We have it locally AND
      // 2. Server's updated_at is newer than local (or local updated_at is null)
      if (localMap.has(serverPuzzle.id)) {
        const serverUpdatedAt = serverPuzzle.updated_at;

        if (
          !localUpdatedAt ||
          (serverUpdatedAt && serverUpdatedAt > localUpdatedAt)
        ) {
          stalePuzzleIds.push(serverPuzzle.id);
        }
      }
    }

    if (stalePuzzleIds.length === 0) {
      // All local puzzles are fresh
      return {
        stalePuzzleIds: [],
        checkedCount: localTimestamps.length,
        updatedCount: 0,
      };
    }

    // Phase 3: Fetch and update stale puzzles
    const updatedCount = await refreshStalePuzzles(stalePuzzleIds);

    return {
      stalePuzzleIds,
      checkedCount: localTimestamps.length,
      updatedCount,
    };
  } catch (error) {
    console.error('[LightSync] Exception:', error);
    Sentry.captureException(error, {
      tags: { feature: 'light_sync' },
    });
    return { stalePuzzleIds: [], checkedCount: 0, updatedCount: 0 };
  }
}

/**
 * Fetch and update specific stale puzzles by ID.
 * Called internally after staleness detection.
 */
async function refreshStalePuzzles(puzzleIds: string[]): Promise<number> {
  if (puzzleIds.length === 0) return 0;

  // Add breadcrumb for debugging
  Sentry.addBreadcrumb({
    category: 'puzzle_sync',
    message: 'Refreshing stale puzzles',
    level: 'info',
    data: { puzzleIds, count: puzzleIds.length },
  });

  try {
    // Fetch full puzzle content for stale puzzles
    const { data: puzzles, error } = await supabase
      .from('daily_puzzles')
      .select('*')
      .in('id', puzzleIds);

    if (error || !puzzles) {
      console.error('[LightSync] Failed to fetch stale puzzles:', error);
      return 0;
    }

    // Update each puzzle in SQLite and clear any existing attempts
    // (since puzzle content changed, user should play fresh)
    for (const puzzle of puzzles) {
      // Delete existing attempts first so user can replay the updated puzzle
      const deletedCount = await deleteAttemptsByPuzzleId(puzzle.id);
      if (deletedCount > 0) {
        console.log(
          `[LightSync] Cleared ${deletedCount} attempt(s) for updated puzzle ${puzzle.id}`
        );
      }

      const localPuzzle = transformSupabasePuzzleToLocal(
        puzzle as SupabasePuzzle
      );
      await savePuzzle(localPuzzle);
    }

    // Log to Sentry for monitoring cache invalidation frequency
    Sentry.captureMessage('Puzzle Cache Invalidated', {
      level: 'info',
      tags: {
        feature: 'light_sync',
        updated_count: String(puzzles.length),
      },
      extra: {
        puzzleIds,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`[LightSync] Refreshed ${puzzles.length} stale puzzle(s)`);

    return puzzles.length;
  } catch (error) {
    console.error('[LightSync] Error refreshing puzzles:', error);
    Sentry.captureException(error, {
      tags: { feature: 'light_sync' },
    });
    return 0;
  }
}
