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
 * Handles both authenticated and anonymous users.
 *
 * Uses safe_upsert_attempt RPC to handle the unique constraint on (user_id, puzzle_id),
 * allowing updates to existing attempts while protecting completed attempts from
 * being overwritten by stale incomplete data.
 *
 * @param userId - User ID from auth context (required - anonymous users have persistent ID via signInAnonymously)
 * @returns SyncResult with success status and count of synced attempts
 */
export async function syncAttemptsToSupabase(userId: string): Promise<SyncResult> {
  try {
    if (__DEV__) {
      console.log('[AttemptSync] Starting sync for user');
    }

    // Get all local attempts that haven't been synced
    const unsyncedAttempts = await getUnsyncedAttempts();

    if (__DEV__) {
      console.log('[AttemptSync] Found unsynced attempts:', unsyncedAttempts.length);
    }

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

        // Use safe_upsert_attempt RPC for completion protection
        // This function ensures that completed attempts are NEVER overwritten by
        // incomplete data from stale devices. It handles:
        // 1. New attempt: INSERT
        // 2. Existing incomplete attempt: UPDATE with new data
        // 3. Existing completed attempt: Preserve completion, ignore stale data
        const { error } = await supabase.rpc('safe_upsert_attempt' as any, {
          p_id: supabaseAttempt.id,
          p_puzzle_id: supabaseAttempt.puzzle_id,
          p_user_id: supabaseAttempt.user_id,
          p_completed: supabaseAttempt.completed ?? false,
          p_score: supabaseAttempt.score,
          p_score_display: supabaseAttempt.score_display,
          p_metadata: supabaseAttempt.metadata,
          p_started_at: supabaseAttempt.started_at,
          p_completed_at: supabaseAttempt.completed_at,
        });

        if (error) {
          if (__DEV__) {
            console.error('[AttemptSync] Supabase error:', error.message);
          }
          errors.push(error as Error);
        } else {
          // Success - mark as synced in local database
          await markAttemptSynced(attempt.id);
          syncedCount++;
        }
      } catch (err) {
        if (__DEV__) {
          console.error('[AttemptSync] Exception during sync:', err);
        }
        // Network or other error for this attempt - collect but continue
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    // Return success only if all attempts synced without errors
    if (errors.length > 0) {
      if (__DEV__) {
        console.error('[AttemptSync] Sync completed with errors:', errors.length);
      }
      return {
        success: false,
        error: new Error(`${errors.length} attempt(s) failed to sync`),
        syncedCount,
      };
    }

    if (__DEV__) {
      console.log('[AttemptSync] Sync completed successfully:', syncedCount);
    }

    return {
      success: true,
      syncedCount,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('[AttemptSync] Sync failed with exception:', error);
    }
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
 * - Adds user_id (not stored locally) - required, no fallback
 * - Booleans are already proper booleans (parsed from SQLite 0/1)
 * - Metadata is already parsed JSON (no need to stringify)
 *
 * Note: Anonymous users via signInAnonymously() have a persistent user.id,
 * so userId is always available when this function is called.
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
