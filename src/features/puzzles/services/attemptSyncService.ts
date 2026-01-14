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
 * Uses UPSERT to handle the unique constraint on (user_id, puzzle_id),
 * allowing updates to existing attempts (e.g., updating incomplete to completed).
 * Continues syncing even if individual attempts fail, collecting errors
 * and reporting partial success.
 *
 * @param userId - User ID from auth context (can be null for anonymous)
 * @returns SyncResult with success status and count of synced attempts
 */
export async function syncAttemptsToSupabase(userId: string | null): Promise<SyncResult> {
  try {
    console.log('[AttemptSync] Starting sync', { userId: userId ? 'authenticated' : 'anonymous' });

    // Get all local attempts that haven't been synced
    const unsyncedAttempts = await getUnsyncedAttempts();

    console.log('[AttemptSync] Found unsynced attempts:', {
      count: unsyncedAttempts.length,
      attemptIds: unsyncedAttempts.map(a => a.id).slice(0, 3), // Show first 3
    });

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

        console.log('[AttemptSync] Syncing attempt:', {
          attemptId: attempt.id,
          puzzleId: attempt.puzzle_id,
          completed: attempt.completed,
          score: attempt.score,
          userId: supabaseAttempt.user_id,
        });

        // Use UPSERT to handle the unique constraint on (user_id, puzzle_id)
        // If an attempt already exists for this user+puzzle, UPDATE it instead of failing
        // This handles cases where:
        // 1. User starts puzzle (incomplete attempt synced)
        // 2. User completes puzzle (updates the same attempt with completion data)
        const { error } = await supabase
          .from('puzzle_attempts')
          .upsert(supabaseAttempt, {
            onConflict: 'user_id,puzzle_id',
            ignoreDuplicates: false, // Update existing row instead of ignoring
          });

        if (error) {
          console.error('[AttemptSync] Supabase error:', {
            attemptId: attempt.id,
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
          });

          // Other error - collect but continue
          console.error('[AttemptSync] Sync error:', error);
          errors.push(error as Error);
        } else {
          console.log('[AttemptSync] ✅ Successfully synced/updated attempt:', attempt.id);
          // Success - mark as synced in local database
          await markAttemptSynced(attempt.id);
          syncedCount++;
        }
      } catch (err) {
        console.error('[AttemptSync] Exception during sync:', err);
        // Network or other error for this attempt - collect but continue
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    // Return success only if all attempts synced without errors
    if (errors.length > 0) {
      console.error('[AttemptSync] ❌ Sync completed with errors:', {
        totalAttempts: unsyncedAttempts.length,
        syncedCount,
        errorCount: errors.length,
      });
      return {
        success: false,
        error: new Error(`${errors.length} attempt(s) failed to sync`),
        syncedCount,
      };
    }

    console.log('[AttemptSync] ✅ Sync completed successfully:', {
      syncedCount,
      totalAttempts: unsyncedAttempts.length,
    });

    return {
      success: true,
      syncedCount,
    };
  } catch (error) {
    console.error('[AttemptSync] ❌ Sync failed with exception:', error);
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
 * - For anonymous users (userId=null), uses attempt.id as user_id
 * - Booleans are already proper booleans (parsed from SQLite 0/1)
 * - Metadata is already parsed JSON (no need to stringify)
 */
export function transformLocalAttemptToSupabase(
  attempt: ParsedLocalAttempt,
  userId: string | null
): SupabaseAttemptInsert {
  return {
    id: attempt.id,
    puzzle_id: attempt.puzzle_id,
    user_id: userId ?? attempt.id,
    completed: attempt.completed,
    score: attempt.score,
    score_display: attempt.score_display,
    metadata: attempt.metadata as Json | null,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
  };
}
