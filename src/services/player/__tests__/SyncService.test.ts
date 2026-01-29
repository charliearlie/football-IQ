/**
 * Tests for Elite Index Sync Service.
 *
 * Validates:
 * - Throttling (7-day interval between checks)
 * - Delta download and upsert
 * - Error handling
 */

import { isSyncCheckDue, syncEliteIndex } from '../SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const mockGetEliteIndexVersion = jest.fn().mockResolvedValue(1);
const mockSetEliteIndexVersion = jest.fn().mockResolvedValue(undefined);
const mockUpsertPlayerCache = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/database', () => ({
  getEliteIndexVersion: (...args: unknown[]) => mockGetEliteIndexVersion(...args),
  setEliteIndexVersion: (...args: unknown[]) => mockSetEliteIndexVersion(...args),
  upsertPlayerCache: (...args: unknown[]) => mockUpsertPlayerCache(...args),
}));

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSyncCheckDue', () => {
    it('returns true on first check (no stored timestamp)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      expect(await isSyncCheckDue()).toBe(true);
    });

    it('returns false if checked within 7 days', async () => {
      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(recentDate.toISOString());
      expect(await isSyncCheckDue()).toBe(false);
    });

    it('returns true if last check was over 7 days ago', async () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(oldDate.toISOString());
      expect(await isSyncCheckDue()).toBe(true);
    });

    it('returns true if AsyncStorage throws', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      expect(await isSyncCheckDue()).toBe(true);
    });
  });

  describe('syncEliteIndex', () => {
    it('skips if sync check not due', async () => {
      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(recentDate.toISOString());

      const result = await syncEliteIndex();
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('returns early if server has no updates', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockRpc.mockResolvedValue({
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

    it('downloads and upserts delta players', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const mockPlayers = [
        {
          id: 'Q999',
          name: 'New Player',
          search_name: 'new player',
          scout_rank: 100,
          birth_year: 2000,
          position_category: 'Forward',
          nationality_code: 'FR',
        },
      ];

      mockRpc.mockResolvedValue({
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

    it('records check timestamp on successful check', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockRpc.mockResolvedValue({
        data: [{ has_updates: false, server_version: 1, updated_players: [] }],
        error: null,
      });

      await syncEliteIndex();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@elite_index_last_sync_check',
        expect.any(String)
      );
    });

    it('handles RPC errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      const result = await syncEliteIndex();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles unexpected exceptions gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockRpc.mockRejectedValue(new Error('Connection refused'));

      const result = await syncEliteIndex();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('calls RPC with correct local version', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetEliteIndexVersion.mockResolvedValue(3);
      mockRpc.mockResolvedValue({
        data: [{ has_updates: false, server_version: 3, updated_players: [] }],
        error: null,
      });

      await syncEliteIndex();

      expect(mockRpc).toHaveBeenCalledWith('get_elite_index_delta', {
        client_version: 3,
      });
    });
  });
});
