/**
 * Attempt Sync Service
 *
 * Handles syncing attempts from SQLite (local) to Supabase (cloud).
 * Local attempts are saved with synced=0 when offline, then pushed
 * to Supabase when connectivity is available.
 */

import { supabase } from '@/lib/supabase';
import { getUnsyncedAttempts, markAttemptSynced } from '@/lib/database';
import { Json } from '@/types/supabase';
import { ParsedLocalAttempt, SupabaseAttemptInsert, SyncResult } from '../types/puzzle.types';

/**
 * Sync local unsynced attempts to Supabase.
 *
 * @param userId - The current user's ID (from auth context)
 * @returns SyncResult with success status and count of synced attempts
 */
export async function syncAttemptsToSupabase(userId: string): Promise<SyncResult> {
  try {
    // Get all local attempts that haven't been synced
    const unsyncedAttempts = await getUnsyncedAttempts();

    if (unsyncedAttempts.length === 0) {
      return {
        success: true,
        syncedCount: 0,
      };
    }

    let syncedCount = 0;

    // Sync each attempt individually to handle partial failures
    for (const attempt of unsyncedAttempts) {
      const supabaseAttempt = transformLocalAttemptToSupabase(attempt, userId);

      const { error } = await supabase.from('puzzle_attempts').insert(supabaseAttempt);

      if (error) {
        // Return on first error - could be enhanced to continue and collect errors
        return {
          success: false,
          error: error as Error,
          syncedCount,
        };
      }

      // Mark as synced in local database
      await markAttemptSynced(attempt.id);
      syncedCount++;
    }

    return {
      success: true,
      syncedCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      syncedCount: 0,
    };
  }
}

/**
 * Transform a local attempt to Supabase format.
 *
 * Key transformations:
 * - Adds user_id (not stored locally)
 * - Booleans are already proper booleans (parsed from SQLite 0/1)
 * - Metadata is already parsed JSON (no need to stringify)
 */
export function transformLocalAttemptToSupabase(
  attempt: ParsedLocalAttempt,
  userId: string
): SupabaseAttemptInsert {
  return {
    id: attempt.id,
    puzzle_id: attempt.puzzle_id,
    user_id: userId,
    completed: attempt.completed,
    score: attempt.score,
    score_display: attempt.score_display,
    metadata: attempt.metadata as Json | null,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
  };
}
