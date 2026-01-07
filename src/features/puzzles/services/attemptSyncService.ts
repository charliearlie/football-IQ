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

/** PostgreSQL unique violation error code */
const POSTGRES_UNIQUE_VIOLATION = '23505';

/**
 * Sync local unsynced attempts to Supabase.
 *
 * Continues syncing even if individual attempts fail, collecting errors
 * and reporting partial success. Handles duplicate key violations gracefully
 * (e.g., attempt already synced from another device).
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
    const errors: Error[] = [];

    // Sync each attempt individually, continuing on failures
    for (const attempt of unsyncedAttempts) {
      try {
        const supabaseAttempt = transformLocalAttemptToSupabase(attempt, userId);

        const { error } = await supabase.from('puzzle_attempts').insert(supabaseAttempt);

        if (error) {
          // Handle duplicate key gracefully (already synced from another device)
          if (error.code === POSTGRES_UNIQUE_VIOLATION) {
            // Already exists in Supabase - mark as synced locally
            await markAttemptSynced(attempt.id);
            syncedCount++;
          } else {
            // Other error - collect but continue
            errors.push(error as Error);
          }
        } else {
          // Success - mark as synced in local database
          await markAttemptSynced(attempt.id);
          syncedCount++;
        }
      } catch (err) {
        // Network or other error for this attempt - collect but continue
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    // Return success only if all attempts synced without errors
    if (errors.length > 0) {
      return {
        success: false,
        error: new Error(`${errors.length} attempt(s) failed to sync`),
        syncedCount,
      };
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
