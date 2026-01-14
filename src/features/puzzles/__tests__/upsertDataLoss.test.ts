/**
 * @jest-environment node
 *
 * UPSERT Data Loss Tests
 *
 * CRITICAL: Tests for Bug #2 - UPSERT can overwrite completed attempts with older incomplete data
 *
 * The sync service uses UPSERT with `onConflict: 'user_id,puzzle_id'` which means:
 * - If a row exists with the same (user_id, puzzle_id), UPDATE it
 * - Otherwise, INSERT new row
 *
 * PROBLEM: No timestamp comparison. Last write wins, even if it's older data.
 *
 * Scenario:
 * 1. User completes puzzle on Device A → Syncs immediately (completed=true, score=100)
 * 2. User has old incomplete attempt on Device B (offline for days)
 * 3. Device B comes online, syncs old incomplete attempt
 * 4. UPSERT sees conflict → UPDATES row with old data (completed=false, score=null)
 * 5. User's completion data is LOST ❌
 */

import { supabase } from '@/lib/supabase';
import { syncAttemptsToSupabase, transformLocalAttemptToSupabase } from '../services/attemptSyncService';
import * as database from '@/lib/database';
import { ParsedLocalAttempt } from '../types/puzzle.types';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/database', () => ({
  getUnsyncedAttempts: jest.fn(),
  markAttemptSynced: jest.fn(),
}));

describe('UPSERT Data Loss - Multi-Device Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bug #2: Older Data Overwrites Newer Data', () => {
    it('🚨 CRITICAL: Device B overwrites Device A completed attempt with incomplete data', async () => {
      // Simulate timeline:
      // T1: Device A - User starts puzzle
      // T2: Device A - User completes puzzle (score=100) - SYNCS IMMEDIATELY
      // T3: Device B (offline since T1) - Still has incomplete attempt from T1
      // T4: Device B comes online - Syncs stale incomplete attempt
      // Result: UPSERT overwrites completed data with incomplete ❌

      const userId = 'user-123';
      const puzzleId = 'puzzle-abc';

      // === DEVICE A: Completed attempt (synced at T2) ===
      // In real scenario, this is already in Supabase
      // We'll simulate the database state after Device A sync

      // === DEVICE B: Stale incomplete attempt (synced at T4) ===
      const staleAttempt: ParsedLocalAttempt = {
        id: 'attempt-device-b',
        puzzle_id: puzzleId,
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue([staleAttempt]);

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      // Act: Device B syncs stale attempt
      await syncAttemptsToSupabase(userId);

      // Verify: UPSERT called with incomplete data
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          puzzle_id: puzzleId,
          completed: false, // 🚨 Overwrites completed=true with false!
          score: null, // 🚨 User loses their score!
        }),
        {
          onConflict: 'user_id,puzzle_id',
          ignoreDuplicates: false,
        }
      );

      // 🚨 RESULT: User's completion data is LOST
      // No timestamp check, no "keep newer data" logic
      // Last write wins, even if it's stale
    });

    it('🚨 CRITICAL: Multiple incomplete attempts can overwrite completed ones', async () => {
      // Scenario: User has multiple devices, all syncing stale data
      const userId = 'user-456';
      const puzzleId = 'puzzle-xyz';

      // Device A: Incomplete
      // Device B: Incomplete
      // Device C: Completed (but this synced first)
      // Device A & B sync later → overwrite completion

      const incompleteAttempt1: ParsedLocalAttempt = {
        id: 'attempt-device-a',
        puzzle_id: puzzleId,
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T09:00:00Z',
        completed_at: null,
        synced: false,
      };

      const incompleteAttempt2: ParsedLocalAttempt = {
        id: 'attempt-device-b',
        puzzle_id: puzzleId,
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T09:30:00Z',
        completed_at: null,
        synced: false,
      };

      (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue([
        incompleteAttempt1,
        incompleteAttempt2,
      ]);

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      await syncAttemptsToSupabase(userId);

      // Both calls will overwrite any existing completed attempt
      expect(mockUpsert).toHaveBeenCalledTimes(2);

      // Last call wins
      expect(mockUpsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          completed: false,
        }),
        expect.any(Object)
      );

      // 🚨 User loses completion data
    });
  });

  describe('EXPECTED BEHAVIOR: Should Preserve Completed Attempts', () => {
    it('IDEAL: should NOT overwrite completed=true with completed=false', () => {
      // What SHOULD happen:
      // 1. Check if row exists
      // 2. If existing row has completed=true, do NOT overwrite
      // 3. Only allow updates that don't regress progress

      // Possible solutions:
      // A) Add updated_at timestamp, only update if newer
      // B) Add application logic: if existing.completed=true, skip sync
      // C) Use PostgreSQL conditional UPSERT:
      //    ON CONFLICT (user_id, puzzle_id) DO UPDATE
      //    SET ... WHERE attempts.completed = false OR EXCLUDED.completed = true

      expect(true).toBe(true); // Placeholder for expected behavior
    });

    it('IDEAL: should use updated_at timestamp for conflict resolution', () => {
      // Best practice: Add updated_at column
      // UPSERT logic: Only update if EXCLUDED.updated_at > attempts.updated_at
      // This ensures "last modified" wins, not "last synced"

      const oldAttempt: ParsedLocalAttempt = {
        id: 'attempt-old',
        puzzle_id: 'puzzle-123',
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      const newAttempt: ParsedLocalAttempt = {
        id: 'attempt-new',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: { guesses: 3 },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z', // Newer timestamp
        synced: false,
      };

      // If we had updated_at logic:
      // UPSERT would compare timestamps and keep newAttempt

      // Currently: No such logic exists ❌
    });
  });

  describe('Race Condition: Simultaneous Syncs', () => {
    it('🚨 RISK: Two devices syncing simultaneously causes unpredictable results', async () => {
      // Scenario:
      // Device A and Device B both sync at exact same time
      // Both have different attempt data for same puzzle
      // PostgreSQL will serialize the UPSERTs, but order is random
      // Result: Random device wins, data is unpredictable

      const userId = 'user-789';
      const puzzleId = 'puzzle-concurrent';

      const deviceAAttempt: ParsedLocalAttempt = {
        id: 'attempt-device-a',
        puzzle_id: puzzleId,
        completed: false,
        score: 50,
        score_display: '50%',
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      const deviceBAttempt: ParsedLocalAttempt = {
        id: 'attempt-device-b',
        puzzle_id: puzzleId,
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: { guesses: 5 },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:10:00Z',
        synced: false,
      };

      // Both devices call UPSERT "simultaneously"
      // No way to predict which one wins
      // Could be incomplete or completed, depending on transaction ordering

      // 🚨 This is a RACE CONDITION - non-deterministic data corruption
    });
  });

  describe('Authenticated User vs Anonymous User Behavior', () => {
    it('authenticated users have stable user_id (consistent behavior)', async () => {
      const userId = 'auth-user-123';

      const attempt1: ParsedLocalAttempt = {
        id: 'attempt-1',
        puzzle_id: 'puzzle-123',
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      const attempt2: ParsedLocalAttempt = {
        id: 'attempt-2',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: false,
      };

      const supabase1 = transformLocalAttemptToSupabase(attempt1, userId);
      const supabase2 = transformLocalAttemptToSupabase(attempt2, userId);

      // Both use same user_id (authenticated)
      expect(supabase1.user_id).toBe(userId);
      expect(supabase2.user_id).toBe(userId);
      expect(supabase1.user_id).toBe(supabase2.user_id);

      // UPSERT conflict: (auth-user-123, puzzle-123)
      // Second sync will UPDATE first row (expected behavior for authenticated)
    });

    it('🚨 CRITICAL: anonymous users have different user_id per attempt (broken UPSERT)', async () => {
      // This is BUG #1 from anonymousUserSync.test.ts
      // Anonymous users use attempt.id as user_id
      // Result: No conflict detection, creates duplicate rows

      const attempt1: ParsedLocalAttempt = {
        id: 'attempt-anon-1',
        puzzle_id: 'puzzle-123',
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      const attempt2: ParsedLocalAttempt = {
        id: 'attempt-anon-2',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: false,
      };

      const supabase1 = transformLocalAttemptToSupabase(attempt1, null);
      const supabase2 = transformLocalAttemptToSupabase(attempt2, null);

      // Different user_ids!
      expect(supabase1.user_id).toBe('attempt-anon-1');
      expect(supabase2.user_id).toBe('attempt-anon-2');
      expect(supabase1.user_id).not.toBe(supabase2.user_id);

      // UPSERT conflicts:
      // (attempt-anon-1, puzzle-123) vs (attempt-anon-2, puzzle-123)
      // NO CONFLICT (different user_ids) → Both rows inserted
      // Result: Duplicate attempts for same anonymous user + puzzle ❌
    });
  });

  describe('Edge Case: completed_at Timestamp Manipulation', () => {
    it('RISK: older completed_at could overwrite newer one', async () => {
      const userId = 'user-time-test';

      // Device A: Completed at 10:00 (synced first)
      const newerCompletion: ParsedLocalAttempt = {
        id: 'attempt-new',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: null,
        started_at: '2024-01-15T09:00:00Z',
        completed_at: '2024-01-15T10:00:00Z', // Newer
        synced: false,
      };

      // Device B: Completed at 09:30 (synced later due to network delay)
      const olderCompletion: ParsedLocalAttempt = {
        id: 'attempt-old',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 80,
        score_display: '80%',
        metadata: null,
        started_at: '2024-01-15T09:00:00Z',
        completed_at: '2024-01-15T09:30:00Z', // Older
        synced: false,
      };

      // If Device B syncs second, it will overwrite the better score
      // Even though completed_at is older, UPSERT doesn't check

      // User's best attempt (100%) gets replaced with worse attempt (80%)
      // 🚨 Data regression
    });
  });
});

describe('UPSERT Conflict Resolution Strategies', () => {
  it('documents current behavior: last write wins (no conflict resolution)', () => {
    // CURRENT: UPSERT always overwrites existing row
    // No checks for:
    // - Timestamp (which data is newer?)
    // - Completion status (preserve completed over incomplete?)
    // - Score (keep higher score?)

    // This is the SIMPLEST but LEAST SAFE strategy
  });

  it('documents ideal behavior: smart conflict resolution', () => {
    // IDEAL STRATEGIES:
    //
    // 1. Timestamp-based (recommended):
    //    - Add updated_at column to attempts table
    //    - UPSERT only if EXCLUDED.updated_at > attempts.updated_at
    //    - Ensures "last modified" wins, not "last synced"
    //
    // 2. Status-based:
    //    - Never overwrite completed=true with completed=false
    //    - Allow incomplete→completed, not completed→incomplete
    //
    // 3. Score-based:
    //    - Keep higher score if both completed
    //    - Useful for games with multiple valid completions
    //
    // 4. Client-side conflict detection:
    //    - Before sync, fetch existing row
    //    - Compare timestamps/status locally
    //    - Only sync if local data is newer
    //    - More network requests but safer

    expect(true).toBe(true); // Documentation placeholder
  });
});
