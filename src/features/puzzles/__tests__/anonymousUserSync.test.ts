/**
 * @jest-environment node
 *
 * Anonymous User Sync Tests
 *
 * Tests verify that the sync safety fixes work correctly:
 * 1. Anonymous users via signInAnonymously() have persistent user IDs
 * 2. Sync requires non-null userId (waits for auth to initialize)
 * 3. Same user_id is used across all attempts for same user
 */

import { supabase } from '@/lib/supabase';
import { syncAttemptsToSupabase, transformLocalAttemptToSupabase } from '../services/attemptSyncService';
import * as database from '@/lib/database';
import { ParsedLocalAttempt } from '../types/puzzle.types';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('@/lib/database', () => ({
  getUnsyncedAttempts: jest.fn(),
  markAttemptSynced: jest.fn(),
}));

describe('Anonymous User Sync - Fixed Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transform function requires non-null userId', () => {
    it('uses provided userId for all attempts (no fallback to attempt.id)', () => {
      // Arrange: Two attempts from same user
      const persistentUserId = 'user-uuid-from-signInAnonymously';

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

      // Act: Transform with persistent userId
      const supabaseAttempt1 = transformLocalAttemptToSupabase(attempt1, persistentUserId);
      const supabaseAttempt2 = transformLocalAttemptToSupabase(attempt2, persistentUserId);

      // Assert: Same user_id for both attempts
      expect(supabaseAttempt1.user_id).toBe(persistentUserId);
      expect(supabaseAttempt2.user_id).toBe(persistentUserId);
      expect(supabaseAttempt1.user_id).toBe(supabaseAttempt2.user_id);

      // Both have same puzzle_id
      expect(supabaseAttempt1.puzzle_id).toBe('puzzle-123');
      expect(supabaseAttempt2.puzzle_id).toBe('puzzle-123');

      // UPSERT with onConflict: 'user_id,puzzle_id' will now:
      // - First: INSERT (user-uuid, puzzle-123)
      // - Second: UPDATE (user-uuid, puzzle-123) - same keys!
    });
  });

  describe('Sync function handles userId correctly', () => {
    it('syncs attempts when userId is provided', async () => {
      const userId = 'user-uuid-12345';
      const mockAttempts: ParsedLocalAttempt[] = [
        {
          id: 'attempt-abc',
          puzzle_id: 'puzzle-123',
          completed: true,
          score: 100,
          score_display: '100%',
          metadata: { guesses: 3 },
          started_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:05:00Z',
          synced: false,
        },
      ];

      (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);
      (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });
      (database.markAttemptSynced as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await syncAttemptsToSupabase(userId);

      // Assert: Sync succeeded
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);

      // Verify RPC was called with correct user_id
      expect(supabase.rpc).toHaveBeenCalledWith('safe_upsert_attempt', expect.objectContaining({
        p_user_id: userId,
        p_puzzle_id: 'puzzle-123',
        p_completed: true,
      }));
    });

    it('handles RPC errors gracefully', async () => {
      const userId = 'user-uuid-12345';
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
      (supabase.rpc as jest.Mock).mockResolvedValue({
        error: { message: 'RPC error', code: '42000' },
      });

      // Act
      const result = await syncAttemptsToSupabase(userId);

      // Assert: Sync failed with error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns early success when no unsynced attempts', async () => {
      const userId = 'user-uuid-12345';
      (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await syncAttemptsToSupabase(userId);

      // Assert: Success with 0 synced
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('Multi-device scenario with authenticated anonymous user', () => {
    it('same anonymous user on different devices uses same user_id', () => {
      // Both devices use the same user_id from signInAnonymously()
      const anonymousUserId = 'anon-user-uuid-persistent';

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

      // Both devices use the same persistent user_id
      const supabaseA = transformLocalAttemptToSupabase(deviceAAttempt, anonymousUserId);
      const supabaseB = transformLocalAttemptToSupabase(deviceBAttempt, anonymousUserId);

      // FIXED: Same user_id on both devices
      expect(supabaseA.user_id).toBe(anonymousUserId);
      expect(supabaseB.user_id).toBe(anonymousUserId);

      // Result in Supabase with unique constraint + safe_upsert_attempt:
      // - First sync: INSERT row (anon-user-uuid, puzzle-123, incomplete)
      // - Second sync: UPDATE row (anon-user-uuid, puzzle-123, complete)
      // ^ Only ONE row exists!
    });
  });
});

describe('Completion Protection via safe_upsert_attempt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls safe_upsert_attempt RPC with correct parameters', async () => {
    const userId = 'user-123';
    const mockAttempt: ParsedLocalAttempt = {
      id: 'attempt-abc',
      puzzle_id: 'puzzle-456',
      completed: true,
      score: 85,
      score_display: '85%',
      metadata: { guesses: 5 },
      started_at: '2024-01-15T10:00:00Z',
      completed_at: '2024-01-15T10:10:00Z',
      synced: false,
    };

    (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue([mockAttempt]);
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });
    (database.markAttemptSynced as jest.Mock).mockResolvedValue(undefined);

    await syncAttemptsToSupabase(userId);

    // Verify RPC called with all required parameters
    expect(supabase.rpc).toHaveBeenCalledWith('safe_upsert_attempt', {
      p_id: 'attempt-abc',
      p_puzzle_id: 'puzzle-456',
      p_user_id: userId,
      p_completed: true,
      p_score: 85,
      p_score_display: '85%',
      p_metadata: { guesses: 5 },
      p_started_at: '2024-01-15T10:00:00Z',
      p_completed_at: '2024-01-15T10:10:00Z',
    });
  });

  it('handles incomplete attempts correctly (completed=false)', async () => {
    const userId = 'user-123';
    const mockAttempt: ParsedLocalAttempt = {
      id: 'attempt-incomplete',
      puzzle_id: 'puzzle-789',
      completed: false,
      score: null,
      score_display: null,
      metadata: null,
      started_at: '2024-01-15T10:00:00Z',
      completed_at: null,
      synced: false,
    };

    (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue([mockAttempt]);
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });
    (database.markAttemptSynced as jest.Mock).mockResolvedValue(undefined);

    await syncAttemptsToSupabase(userId);

    // Verify RPC called with completed=false (not null)
    expect(supabase.rpc).toHaveBeenCalledWith('safe_upsert_attempt', expect.objectContaining({
      p_completed: false,  // Coalesced from null to false
      p_score: null,
      p_metadata: null,
    }));
  });
});
