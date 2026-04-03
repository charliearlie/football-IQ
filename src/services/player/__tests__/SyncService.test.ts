/**
 * Tests for Elite Index Sync Service.
 *
 * Validates:
 * - Calendar-aware throttling via SyncScheduler
 * - Delta download and upsert (including stats_cache)
 * - Error handling
 */

import { syncEliteIndex } from '../SyncService';
import {
  isSyncCheckDue,
  recordSyncCheck,
} from '@/services/sync/SyncScheduler';
import { supabase } from '@/lib/supabase';

// Cast mocked methods from the global supabase mock (provided by jest-setup.ts)
const mockSupabaseRpc = supabase.rpc as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;

// Mock SyncScheduler
jest.mock('@/services/sync/SyncScheduler', () => ({
  isSyncCheckDue: jest.fn().mockResolvedValue(true),
  recordSyncCheck: jest.fn().mockResolvedValue(undefined),
  getSyncPeriod: jest.fn().mockReturnValue('weekly'),
  getSyncIntervalMs: jest.fn().mockReturnValue(7 * 24 * 60 * 60 * 1000),
}));

const mockGetEliteIndexVersion = jest.fn().mockResolvedValue(1);
const mockSetEliteIndexVersion = jest.fn().mockResolvedValue(undefined);
const mockUpsertPlayerCache = jest.fn().mockResolvedValue(undefined);
const mockRecalculateEliteStatus = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/database', () => ({
  getEliteIndexVersion: (...args: unknown[]) => mockGetEliteIndexVersion(...args),
  setEliteIndexVersion: (...args: unknown[]) => mockSetEliteIndexVersion(...args),
  upsertPlayerCache: (...args: unknown[]) => mockUpsertPlayerCache(...args),
  recalculateEliteStatus: (...args: unknown[]) => mockRecalculateEliteStatus(...args),
}));

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated session so tests reach the RPC call
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  describe('syncEliteIndex', () => {
    it('skips if sync check not due', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(false);

      const result = await syncEliteIndex();
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
      expect(mockSupabaseRpc).not.toHaveBeenCalled();
    });

    it('returns early if server has no updates', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(true);
      mockSupabaseRpc.mockResolvedValue({
        data: [{ has_updates: false, server_version: 1, updated_players: [] }],
        error: null,
      });

      const result = await syncEliteIndex();
      expect(result).toEqual({
        success: true,
        updatedCount: 0,
        serverVersion: 1,
      });
    });

    it('downloads and upserts delta players with stats_cache', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(true);
      const mockPlayers = [
        {
          id: 'Q999',
          name: 'New Player',
          search_name: 'new player',
          scout_rank: 100,
          birth_year: 2000,
          position_category: 'Forward',
          nationality_code: 'FR',
          stats_cache: { ucl_titles: 2 },
        },
      ];

      mockSupabaseRpc.mockResolvedValue({
        data: [{
          has_updates: true,
          server_version: 2,
          updated_players: mockPlayers,
        }],
        error: null,
      });

      const result = await syncEliteIndex();

      expect(result).toEqual({
        success: true,
        updatedCount: 1,
        serverVersion: 2,
      });

      expect(mockUpsertPlayerCache).toHaveBeenCalledWith(mockPlayers);
      expect(mockSetEliteIndexVersion).toHaveBeenCalledWith(2);
    });

    it('records check timestamp via SyncScheduler', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(true);
      mockSupabaseRpc.mockResolvedValue({
        data: [{ has_updates: false, server_version: 1, updated_players: [] }],
        error: null,
      });

      await syncEliteIndex();

      expect(recordSyncCheck).toHaveBeenCalled();
    });

    it('handles RPC errors gracefully', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(true);
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      const result = await syncEliteIndex();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles unexpected exceptions gracefully', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(true);
      mockSupabaseRpc.mockRejectedValue(new Error('Connection refused'));

      const result = await syncEliteIndex();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('calls RPC with correct local version', async () => {
      (isSyncCheckDue as jest.Mock).mockResolvedValue(true);
      mockGetEliteIndexVersion.mockResolvedValue(3);
      mockSupabaseRpc.mockResolvedValue({
        data: [{ has_updates: false, server_version: 3, updated_players: [] }],
        error: null,
      });

      await syncEliteIndex();

      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_elite_index_delta', {
        client_version: 3,
      });
    });
  });
});
