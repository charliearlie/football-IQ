import { supabase } from '@/lib/supabase';
import * as database from '@/lib/database';
import { syncPuzzlesFromSupabase, transformSupabasePuzzleToLocal } from '../services/puzzleSyncService';
import { syncAttemptsToSupabase, transformLocalAttemptToSupabase } from '../services/attemptSyncService';
import { SupabasePuzzle, ParsedLocalAttempt } from '../types/puzzle.types';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        gt: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
    rpc: jest.fn(() => ({
      maybeSingle: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  },
}));

// Mock database functions
jest.mock('@/lib/database', () => ({
  savePuzzle: jest.fn().mockResolvedValue(undefined),
  getUnsyncedAttempts: jest.fn().mockResolvedValue([]),
  markAttemptSynced: jest.fn().mockResolvedValue(undefined),
  getAllLocalPuzzleIds: jest.fn().mockResolvedValue([]),
  deletePuzzlesByIds: jest.fn().mockResolvedValue(0),
}));

describe('Sync Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('puzzleSyncService', () => {
    describe('syncPuzzlesFromSupabase', () => {
      it('fetches puzzles from Supabase and saves to SQLite', async () => {
        // Arrange: Mock Supabase to return 3 puzzles
        const mockPuzzles: Partial<SupabasePuzzle>[] = [
          {
            id: 'puzzle-1',
            game_mode: 'career_path',
            puzzle_date: '2024-01-15',
            content: { clues: ['Clue 1'] },
            difficulty: 'medium',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
          {
            id: 'puzzle-2',
            game_mode: 'tic_tac_toe',
            puzzle_date: '2024-01-15',
            content: { grid: [] },
            difficulty: 'hard',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
          {
            id: 'puzzle-3',
            game_mode: 'topical_quiz',
            puzzle_date: '2024-01-15',
            content: { questions: [] },
            difficulty: 'easy',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        ];

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: mockPuzzles,
            error: null,
          }),
        });

        // Act
        const result = await syncPuzzlesFromSupabase({
          userId: 'user-123',
          isPremium: false,
          lastSyncedAt: null,
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.syncedCount).toBe(3);
        expect(database.savePuzzle).toHaveBeenCalledTimes(3);
      });

      it('handles empty response gracefully', async () => {
        // Arrange
        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        });

        // Act
        const result = await syncPuzzlesFromSupabase({
          userId: 'user-123',
          isPremium: false,
          lastSyncedAt: null,
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.syncedCount).toBe(0);
        expect(database.savePuzzle).not.toHaveBeenCalled();
      });

      it('fetches all puzzles without incremental sync', async () => {
        // Arrange: The service now always fetches ALL puzzles (no incremental sync)
        // to enable orphan detection
        const mockSelect = jest.fn().mockReturnValue({
          data: [],
          error: null,
        });

        (supabase.from as jest.Mock).mockReturnValue({
          select: mockSelect,
        });

        // Act
        await syncPuzzlesFromSupabase({
          userId: 'user-123',
          isPremium: true,
          lastSyncedAt: '2024-01-14T00:00:00Z',
        });

        // Assert: Should fetch all puzzles, not use incremental sync
        expect(mockSelect).toHaveBeenCalledWith('*');
      });

      it('returns error on Supabase failure', async () => {
        // Arrange
        const mockError = new Error('Network error');
        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: null,
            error: mockError,
          }),
        });

        // Act
        const result = await syncPuzzlesFromSupabase({
          userId: 'user-123',
          isPremium: false,
          lastSyncedAt: null,
        });

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe(mockError);
      });
    });

    describe('transformSupabasePuzzleToLocal', () => {
      it('converts Supabase puzzle to LocalPuzzle format', () => {
        // Arrange
        const supabasePuzzle: SupabasePuzzle = {
          id: 'puzzle-123',
          game_mode: 'career_path',
          puzzle_date: '2024-01-15',
          content: { clues: ['Clue 1', 'Clue 2'] },
          difficulty: 'medium',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          status: 'published',
          source: 'manual',
          triggered_by: null,
          is_special: false,
          is_bonus: false,
          is_premium: false,
          event_title: null,
          event_subtitle: null,
          event_tag: null,
          event_theme: null,
        };

        // Act
        const localPuzzle = transformSupabasePuzzleToLocal(supabasePuzzle);

        // Assert
        expect(localPuzzle.id).toBe('puzzle-123');
        expect(localPuzzle.game_mode).toBe('career_path');
        expect(localPuzzle.puzzle_date).toBe('2024-01-15');
        expect(localPuzzle.content).toBe('{"clues":["Clue 1","Clue 2"]}'); // JSON stringified
        expect(localPuzzle.difficulty).toBe('medium');
        expect(localPuzzle.synced_at).toBeDefined();
      });
    });
  });

  describe('attemptSyncService', () => {
    describe('syncAttemptsToSupabase', () => {
      it('fetches unsynced attempts and pushes to Supabase', async () => {
        // Arrange: Mock getUnsyncedAttempts to return 2 attempts
        const mockAttempts: ParsedLocalAttempt[] = [
          {
            id: 'attempt-1',
            puzzle_id: 'puzzle-1',
            completed: true,
            score: 100,
            score_display: '100%',
            metadata: { guesses: 3 },
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:05:00Z',
            synced: false,
          },
          {
            id: 'attempt-2',
            puzzle_id: 'puzzle-2',
            completed: false,
            score: null,
            score_display: null,
            metadata: null,
            started_at: '2024-01-15T11:00:00Z',
            completed_at: null,
            synced: false,
          },
        ];

        (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);

        const mockRpc = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        (supabase.rpc as jest.Mock).mockImplementation(mockRpc);

        // Act
        const result = await syncAttemptsToSupabase('user-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.syncedCount).toBe(2);
        expect(mockRpc).toHaveBeenCalledTimes(2);
        expect(mockRpc).toHaveBeenCalledWith('safe_upsert_attempt', expect.any(Object));
      });

      it('marks attempts as synced on success', async () => {
        // Arrange
        const mockAttempts: ParsedLocalAttempt[] = [
          {
            id: 'attempt-1',
            puzzle_id: 'puzzle-1',
            completed: true,
            score: 100,
            score_display: '100%',
            metadata: null,
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:05:00Z',
            synced: false,
          },
        ];

        (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);
        (supabase.rpc as jest.Mock).mockResolvedValue({
          data: null,
          error: null,
        });

        // Act
        await syncAttemptsToSupabase('user-123');

        // Assert
        expect(database.markAttemptSynced).toHaveBeenCalledWith('attempt-1');
      });

      it('adds user_id to each attempt before sync', async () => {
        // Arrange
        const mockAttempts: ParsedLocalAttempt[] = [
          {
            id: 'attempt-1',
            puzzle_id: 'puzzle-1',
            completed: true,
            score: 100,
            score_display: '100%',
            metadata: null,
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:05:00Z',
            synced: false,
          },
        ];

        (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);

        const mockRpc = jest.fn().mockResolvedValue({
          data: null,
          error: null,
        });
        (supabase.rpc as jest.Mock).mockImplementation(mockRpc);

        // Act
        await syncAttemptsToSupabase('user-123');

        // Assert
        expect(mockRpc).toHaveBeenCalledWith(
          'safe_upsert_attempt',
          expect.objectContaining({
            p_user_id: 'user-123',
          })
        );
      });

      it('returns early if no unsynced attempts', async () => {
        // Arrange
        (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue([]);

        // Act
        const result = await syncAttemptsToSupabase('user-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.syncedCount).toBe(0);
        expect(supabase.from).not.toHaveBeenCalled();
      });

      it('handles Supabase RPC failure gracefully and continues', async () => {
        // Arrange: Two attempts, first will fail, second should still sync
        const mockAttempts: ParsedLocalAttempt[] = [
          {
            id: 'attempt-1',
            puzzle_id: 'puzzle-1',
            completed: true,
            score: 100,
            score_display: '100%',
            metadata: null,
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:05:00Z',
            synced: false,
          },
          {
            id: 'attempt-2',
            puzzle_id: 'puzzle-2',
            completed: true,
            score: 80,
            score_display: '80%',
            metadata: null,
            started_at: '2024-01-15T11:00:00Z',
            completed_at: '2024-01-15T11:05:00Z',
            synced: false,
          },
        ];

        (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);

        const mockError = new Error('RPC failed');
        let callCount = 0;
        (supabase.rpc as jest.Mock).mockImplementation(() => {
          callCount++;
          // First call fails, second succeeds
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: mockError });
          }
          return Promise.resolve({ data: null, error: null });
        });

        // Act
        const result = await syncAttemptsToSupabase('user-123');

        // Assert: Partial success - first failed, second synced
        expect(result.success).toBe(false); // Overall failure due to errors
        expect(result.syncedCount).toBe(1); // Second attempt was synced
        expect(database.markAttemptSynced).toHaveBeenCalledTimes(1);
        expect(database.markAttemptSynced).toHaveBeenCalledWith('attempt-2');
      });

      it('uses safe_upsert_attempt RPC which handles duplicates automatically', async () => {
        // Arrange: The RPC handles duplicate/conflict resolution internally
        const mockAttempts: ParsedLocalAttempt[] = [
          {
            id: 'attempt-1',
            puzzle_id: 'puzzle-1',
            completed: true,
            score: 100,
            score_display: '100%',
            metadata: null,
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:05:00Z',
            synced: false,
          },
        ];

        (database.getUnsyncedAttempts as jest.Mock).mockResolvedValue(mockAttempts);

        // The RPC returns success regardless of whether it inserted or updated
        (supabase.rpc as jest.Mock).mockResolvedValue({
          data: null,
          error: null,
        });

        // Act
        const result = await syncAttemptsToSupabase('user-123');

        // Assert: Should mark as synced since RPC succeeded
        expect(result.success).toBe(true);
        expect(result.syncedCount).toBe(1);
        expect(database.markAttemptSynced).toHaveBeenCalledWith('attempt-1');
      });
    });

    describe('transformLocalAttemptToSupabase', () => {
      it('converts local attempt to Supabase format with user_id', () => {
        // Arrange
        const localAttempt: ParsedLocalAttempt = {
          id: 'attempt-123',
          puzzle_id: 'puzzle-456',
          completed: true,
          score: 85,
          score_display: '85%',
          metadata: { guesses: 3 },
          started_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:05:00Z',
          synced: false,
        };

        // Act
        const supabaseAttempt = transformLocalAttemptToSupabase(localAttempt, 'user-123');

        // Assert
        expect(supabaseAttempt.id).toBe('attempt-123');
        expect(supabaseAttempt.puzzle_id).toBe('puzzle-456');
        expect(supabaseAttempt.user_id).toBe('user-123');
        expect(supabaseAttempt.completed).toBe(true); // Boolean, not 0/1
        expect(supabaseAttempt.score).toBe(85);
        expect(supabaseAttempt.metadata).toEqual({ guesses: 3 });
      });
    });
  });
});
