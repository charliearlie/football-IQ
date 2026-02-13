/**
 * RehydrationService
 *
 * Restores user data from Supabase to local SQLite after app reinstall.
 *
 * Trigger conditions:
 * 1. User session exists (restored via SecureStore)
 * 2. Local SQLite attempts table is empty
 * 3. Supabase has historical data for this user
 *
 * This enables seamless restoration of progress, stats, and streak data
 * after the user reinstalls the app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getAttemptCount, saveAttemptIfNotExists, savePuzzle } from '@/lib/database';
import { LocalAttempt, LocalPuzzle } from '@/types/database';

/**
 * Floor date for data rehydration.
 * Don't pull or calculate data before this date.
 * Aligns with app launch date and Streak Calendar floor.
 */
export const DATA_FLOOR_DATE = '2026-01-20';

/**
 * Maximum number of attempts to pull during rehydration.
 * Limits bandwidth and storage impact of reinstall recovery.
 */
export const MAX_ATTEMPTS_TO_PULL = 100;

/**
 * AsyncStorage key to track rehydration completion.
 * Prevents repeated rehydration on every app launch.
 */
export const REHYDRATION_FLAG_KEY = '@rehydration_completed';

/**
 * Result of rehydration operation.
 */
export interface RehydrationResult {
  /** Whether rehydration completed successfully */
  success: boolean;
  /** Number of attempts restored to local database */
  attemptsRehydrated: number;
  /** Error if rehydration failed */
  error?: Error;
}

/**
 * Supabase attempt row with joined puzzle data.
 */
interface SupabaseAttemptWithPuzzle {
  id: string;
  puzzle_id: string;
  completed: boolean;
  score: number | null;
  score_display: string | null;
  metadata: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  daily_puzzles: {
    id: string;
    game_mode: string;
    puzzle_date: string;
    content: unknown;
    difficulty: string | null;
    updated_at: string | null;
    is_special: boolean;
    event_title: string | null;
    event_subtitle: string | null;
    event_tag: string | null;
    event_theme: string | null;
  } | null;
}

/**
 * Check if data rehydration is needed.
 *
 * Returns true when:
 * 1. Valid userId provided
 * 2. Rehydration hasn't been completed for this user (checked FIRST)
 * 3. Local SQLite attempts table is empty
 * 4. Supabase has data for this user after floor date
 *
 * IMPORTANT: The flag check happens FIRST to prevent any database
 * operations on normal app launches. This fixes the issue where
 * rehydration was triggered on every app open due to database
 * timing issues.
 *
 * @param userId - Supabase user ID
 * @returns true if rehydration should be performed
 */
export async function needsRehydration(userId: string): Promise<boolean> {
  // Guard: Need valid userId
  if (!userId) {
    return false;
  }

  try {
    // CHECK FLAG FIRST - this is the most reliable check
    // If we've already rehydrated for this user, skip everything else
    const rehydratedUserId = await AsyncStorage.getItem(REHYDRATION_FLAG_KEY);
    console.log('[Rehydration] Checking rehydration flag. Stored:', rehydratedUserId, 'Current user:', userId);
    if (rehydratedUserId === userId) {
      console.log('[Rehydration] Already rehydrated for this user, skipping');
      return false;
    }

    // Only then check local database
    const localCount = await getAttemptCount();
    if (localCount > 0) {
      console.log('[Rehydration] Local data exists, setting flag and skipping');
      // Set the flag to prevent future checks - this user has local data
      await AsyncStorage.setItem(REHYDRATION_FLAG_KEY, userId);
      return false;
    }

    // Check if Supabase has data for this user
    const { count, error } = await supabase
      .from('puzzle_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('started_at', DATA_FLOOR_DATE);

    if (error) {
      console.error('[Rehydration] Error checking Supabase:', error);
      return false;
    }

    const hasSupabaseData = (count ?? 0) > 0;
    console.log(`[Rehydration] Supabase has ${count} attempts for user`);

    // If no Supabase data either, set the flag to avoid checking again
    if (!hasSupabaseData) {
      await AsyncStorage.setItem(REHYDRATION_FLAG_KEY, userId);
    }

    return hasSupabaseData;
  } catch (error) {
    console.error('[Rehydration] needsRehydration error:', error);
    return false;
  }
}

/**
 * Perform data rehydration from Supabase to local SQLite.
 *
 * Fetches the most recent attempts from Supabase (respecting floor date)
 * and inserts them into the local database with synced=1 flag
 * to prevent re-uploading.
 *
 * @param userId - Supabase user ID
 * @returns RehydrationResult with success status and count
 */
export async function performRehydration(
  userId: string
): Promise<RehydrationResult> {
  console.log('[Rehydration] Starting rehydration for user:', userId);

  // Set flag FIRST to prevent retry loop on failure
  // Even if rehydration fails, we don't want to retry on every app launch
  // User can manually trigger retry via settings if needed
  try {
    await AsyncStorage.setItem(REHYDRATION_FLAG_KEY, userId);
  } catch (e) {
    console.error('[Rehydration] Failed to set rehydration flag', e);
  }

  try {
    // Fetch attempts from Supabase with related puzzle data
    const { data: attempts, error } = await supabase
      .from('puzzle_attempts')
      .select(
        `
        id,
        puzzle_id,
        completed,
        score,
        score_display,
        metadata,
        started_at,
        completed_at,
        daily_puzzles (
          id,
          game_mode,
          puzzle_date,
          content,
          difficulty,
          updated_at,
          is_special,
          event_title,
          event_subtitle,
          event_tag,
          event_theme
        )
      `
      )
      .eq('user_id', userId)
      .gte('started_at', DATA_FLOOR_DATE)
      .order('started_at', { ascending: false })
      .limit(MAX_ATTEMPTS_TO_PULL);

    if (error) {
      console.error('[Rehydration] Supabase fetch error:', error);
      return {
        success: false,
        attemptsRehydrated: 0,
        error: new Error(error.message),
      };
    }

    const attemptsToRehydrate = (attempts as SupabaseAttemptWithPuzzle[]) ?? [];
    console.log(`[Rehydration] Fetched ${attemptsToRehydrate.length} attempts`);

    // Insert each attempt into local database
    let successCount = 0;
    for (const attempt of attemptsToRehydrate) {
      // Skip attempts without puzzle data - can't insert due to foreign key constraint
      // The attempts table has: FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
      if (!attempt.daily_puzzles) {
        console.log('[Rehydration] Skipping attempt without puzzle data:', attempt.id);
        continue;
      }

      // Handle content: Supabase returns JSONB/JSON as an object, but we need a string for SQLite
      let puzzleContent = attempt.daily_puzzles.content;
      if (typeof puzzleContent === 'object' && puzzleContent !== null) {
        puzzleContent = JSON.stringify(puzzleContent);
      } else if (typeof puzzleContent !== 'string') {
        // Fallback for other types
        puzzleContent = String(puzzleContent);
      }

      // Save puzzle first (required for foreign key)
      const localPuzzle: LocalPuzzle = {
        id: attempt.daily_puzzles.id,
        game_mode: attempt.daily_puzzles.game_mode,
        puzzle_date: attempt.daily_puzzles.puzzle_date,
        content: puzzleContent as string,
        difficulty: attempt.daily_puzzles.difficulty ?? null,
        synced_at: new Date().toISOString(),
        updated_at: attempt.daily_puzzles.updated_at ?? null,
        is_special: attempt.daily_puzzles.is_special ? 1 : 0,
        event_title: attempt.daily_puzzles.event_title ?? null,
        event_subtitle: attempt.daily_puzzles.event_subtitle ?? null,
        event_tag: attempt.daily_puzzles.event_tag ?? null,
        event_theme: attempt.daily_puzzles.event_theme ?? null,
      };
      await savePuzzle(localPuzzle);

      // Save attempt (marked as synced to prevent re-upload)
      // Uses INSERT OR IGNORE to avoid overwriting any existing local data
      // CRITICAL: Explicitly handle NULL/undefined for all optional fields
      // expo-sqlite throws on 'undefined', so we must use 'null'
      const localAttempt: LocalAttempt = {
        id: attempt.id,
        puzzle_id: attempt.puzzle_id,
        completed: attempt.completed ? 1 : 0,
        score: attempt.score ?? null,
        score_display: attempt.score_display ?? null,
        metadata: attempt.metadata ? JSON.stringify(attempt.metadata) : null,
        started_at: attempt.started_at ?? null,
        completed_at: attempt.completed_at ?? null,
        synced: 1, // Already synced - don't re-upload
      };
      await saveAttemptIfNotExists(localAttempt);
      successCount++;
    }

    // Flag was already set at the start to prevent retry loops

    console.log(
      `[Rehydration] Complete. Restored ${successCount} of ${attemptsToRehydrate.length} attempts`
    );

    return {
      success: true,
      attemptsRehydrated: successCount,
    };
  } catch (error) {
    console.error('[Rehydration] performRehydration error:', error);
    return {
      success: false,
      attemptsRehydrated: 0,
      error: error as Error,
    };
  }
}

/**
 * Clear the rehydration flag.
 * Used during testing or when user signs out.
 */
export async function clearRehydrationFlag(): Promise<void> {
  await AsyncStorage.removeItem(REHYDRATION_FLAG_KEY);
}
