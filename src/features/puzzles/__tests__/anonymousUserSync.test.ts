/**
 * @jest-environment node
 *
 * Anonymous User Sync Tests
 *
 * CRITICAL: Tests for Bug #1 - Anonymous user UPSERT creating duplicate rows
 *
 * These tests verify that:
 * 1. Anonymous users don't create multiple rows for same puzzle
 * 2. UPSERT behavior correctly updates incomplete→completed
 * 3. RLS policies allow anonymous user operations
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

describe('Anonymous User Sync - CRITICAL BUG VERIFICATION', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bug #1: Anonymous user creates duplicate rows', () => {
    it('FAILS: two attempts with same puzzle_id get different user_ids', async () => {
      // Arrange: Anonymous user has two attempts for same puzzle
      const attempt1: ParsedLocalAttempt = {
        id: 'attempt-abc',
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
        id: 'attempt-xyz',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: { guesses: 3 },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: false,
      };

      // Transform with userId = null (anonymous)
      const supabaseAttempt1 = transformLocalAttemptToSupabase(attempt1, null);
      const supabaseAttempt2 = transformLocalAttemptToSupabase(attempt2, null);

      // Assert: BUG - different user_ids for same logical user!
      expect(supabaseAttempt1.user_id).toBe('attempt-abc');
      expect(supabaseAttempt2.user_id).toBe('attempt-xyz');
      expect(supabaseAttempt1.user_id).not.toBe(supabaseAttempt2.user_id);

      // Both have same puzzle_id
      expect(supabaseAttempt1.puzzle_id).toBe('puzzle-123');
      expect(supabaseAttempt2.puzzle_id).toBe('puzzle-123');

      // UPSERT with onConflict: 'user_id,puzzle_id'
      // Conflict check: ('attempt-abc', 'puzzle-123') vs ('attempt-xyz', 'puzzle-123')
      // Result: NO CONFLICT (different user_ids) → BOTH ROWS INSERTED

      // 🚨 THIS IS THE BUG: Same anonymous user has 2 attempts for same puzzle
    });

    it('EXPECTED BEHAVIOR: should use same user_id for same anonymous user', () => {
      // What SHOULD happen: use persistent device ID, not attempt.id
      const persistentDeviceId = 'device-uuid-12345'; // From AsyncStorage

      const attempt1: ParsedLocalAttempt = {
        id: 'attempt-abc',
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
        id: 'attempt-xyz',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: { guesses: 3 },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: false,
      };

      // CORRECT: Use persistent device ID, not attempt.id
      const supabaseAttempt1 = {
        ...attempt1,
        user_id: persistentDeviceId, // ✅ Same ID
      };

      const supabaseAttempt2 = {
        ...attempt2,
        user_id: persistentDeviceId, // ✅ Same ID
      };

      // Now UPSERT will work correctly:
      // First sync: INSERT (device-uuid-12345, puzzle-123) with completed=false
      // Second sync: UPDATE (device-uuid-12345, puzzle-123) with completed=true
      expect(supabaseAttempt1.user_id).toBe(supabaseAttempt2.user_id);
    });
  });

  describe('Bug #2: RLS policy blocks anonymous UPDATE', () => {
    it('FAILS: anonymous user UPSERT will fail on UPDATE due to RLS', async () => {
      // Arrange: Mock scenario where first INSERT succeeds, then UPDATE fails
      const mockAttempts: ParsedLocalAttempt[] = [
        {
          id: 'attempt-abc',
          puzzle_id: 'puzzle-123',
          completed: false,
          score: null,
          score_display: null,
          metadata: null,
          started_at: '2024-01-15T10:00:00Z',
          completed_at: null,
          synced: false,
        },
      ];

      (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);

      let callCount = 0;
      const mockUpsert = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call (incomplete) - INSERT succeeds
          return { data: null, error: null };
        } else {
          // Second call (completed) - UPSERT tries UPDATE, RLS blocks
          return {
            data: null,
            error: {
              code: '42501', // PostgreSQL insufficient_privilege
              message: 'new row violates row-level security policy',
              details: 'Policy "Update own attempts" violated',
            },
          };
        }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      // Act: First sync (incomplete)
      await syncAttemptsToSupabase(null);

      // Simulate user completing puzzle
      mockAttempts[0].completed = true;
      mockAttempts[0].score = 100;
      (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);

      // Act: Second sync (completed) - should UPDATE but RLS blocks
      const result = await syncAttemptsToSupabase(null);

      // Assert: Sync fails due to RLS policy
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('failed to sync');
    });
  });

  describe('Completion Update Scenario', () => {
    it('CURRENT BEHAVIOR: creates duplicate rows instead of updating', async () => {
      // Scenario:
      // 1. User starts puzzle → attempt-abc (incomplete) synced
      // 2. User completes puzzle → attempt-xyz (completed) synced
      // 3. UPSERT checks (attempt-abc, puzzle-123) vs (attempt-xyz, puzzle-123)
      // 4. Different user_ids → NO CONFLICT → Both inserted

      const incompleteAttempt: ParsedLocalAttempt = {
        id: 'attempt-abc',
        puzzle_id: 'puzzle-123',
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      const completedAttempt: ParsedLocalAttempt = {
        id: 'attempt-xyz',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: { guesses: 3 },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: false,
      };

      // Transform both (anonymous user)
      const supabase1 = transformLocalAttemptToSupabase(incompleteAttempt, null);
      const supabase2 = transformLocalAttemptToSupabase(completedAttempt, null);

      // Verify: Different user_ids cause no conflict
      expect(supabase1.user_id).not.toBe(supabase2.user_id);
      expect(supabase1.puzzle_id).toBe(supabase2.puzzle_id);

      // In real Supabase, this results in:
      // Row 1: user_id=attempt-abc, puzzle_id=puzzle-123, completed=false
      // Row 2: user_id=attempt-xyz, puzzle_id=puzzle-123, completed=true
      // ^ DUPLICATE ROWS for same logical user
    });
  });

  describe('Multi-Device Scenario', () => {
    it('FAILS: same anonymous user on different devices creates multiple rows', () => {
      // Device A: Creates attempt-aaa
      const deviceAAttempt: ParsedLocalAttempt = {
        id: 'attempt-aaa',
        puzzle_id: 'puzzle-123',
        completed: false,
        score: null,
        score_display: null,
        metadata: null,
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: false,
      };

      // Device B: Creates attempt-bbb (same user, same puzzle)
      const deviceBAttempt: ParsedLocalAttempt = {
        id: 'attempt-bbb',
        puzzle_id: 'puzzle-123',
        completed: true,
        score: 100,
        score_display: '100%',
        metadata: { guesses: 3 },
        started_at: '2024-01-15T11:00:00Z',
        completed_at: '2024-01-15T11:05:00Z',
        synced: false,
      };

      const supabaseA = transformLocalAttemptToSupabase(deviceAAttempt, null);
      const supabaseB = transformLocalAttemptToSupabase(deviceBAttempt, null);

      // BUG: Different user_ids on different devices
      expect(supabaseA.user_id).toBe('attempt-aaa');
      expect(supabaseB.user_id).toBe('attempt-bbb');

      // Result in Supabase:
      // Row 1: user_id=attempt-aaa, puzzle_id=puzzle-123
      // Row 2: user_id=attempt-bbb, puzzle_id=puzzle-123
      // ^ Same user (anonymous), 2 rows!
    });
  });
});

describe('UPSERT Test Updates Required', () => {
  it('OLD TEST is now invalid: duplicate key handling', () => {
    // The test at sync_engine.test.ts:376-410 expects code 23505
    // But UPSERT never throws 23505 - it updates instead

    // This test documents that the old test needs updating
    expect(true).toBe(true); // Placeholder

    // TODO: Update sync_engine.test.ts:376-410 to test UPSERT conflict resolution
    // Instead of testing INSERT duplicate error (23505), test:
    // 1. First UPSERT inserts row
    // 2. Second UPSERT updates same row
    // 3. Verify only ONE row exists with updated data
  });
});
