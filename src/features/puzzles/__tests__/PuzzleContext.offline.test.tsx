import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { PuzzleProvider, usePuzzleContext } from '../context/PuzzleContext';

// ── Controllable mocks ──────────────────────────────────────────────────

let mockIsConnected: boolean | null = true;
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isConnected: mockIsConnected,
    isInternetReachable: mockIsConnected,
  }),
}));

let mockUserId: string | null = 'user-123';
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockUserId ? { id: mockUserId } : null,
    profile: { is_premium: false },
  }),
}));

const mockSyncPuzzles = jest.fn().mockResolvedValue({ success: true, syncedCount: 5 });
jest.mock('../services/puzzleSyncService', () => ({
  syncPuzzlesFromSupabase: (...args: unknown[]) => mockSyncPuzzles(...args),
}));

const mockSyncAttempts = jest.fn().mockResolvedValue({ success: true, syncedCount: 0 });
jest.mock('../services/attemptSyncService', () => ({
  syncAttemptsToSupabase: (...args: unknown[]) => mockSyncAttempts(...args),
}));

jest.mock('@/features/archive/services/catalogSyncService', () => ({
  syncCatalogFromSupabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/puzzleLightSyncService', () => ({
  performLightSync: jest.fn().mockResolvedValue({ updatedCount: 0 }),
}));

jest.mock('@/features/integrity', () => ({
  useRehydration: () => ({ status: 'idle' }),
}));

jest.mock('@/lib/database', () => ({
  getAllPuzzles: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/time', () => ({
  onMidnight: jest.fn(() => jest.fn()), // returns unsubscribe
}));

// ── Helpers ─────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return <PuzzleProvider>{children}</PuzzleProvider>;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('PuzzleContext offline behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-123';
    mockIsConnected = true;
  });

  it('calls syncPuzzles when online and userId becomes available', async () => {
    mockIsConnected = true;

    renderHook(() => usePuzzleContext(), { wrapper });

    await waitFor(() => {
      expect(mockSyncPuzzles).toHaveBeenCalled();
    });
  });

  it('does NOT call syncPuzzles when offline', async () => {
    mockIsConnected = false;

    const { result } = renderHook(() => usePuzzleContext(), { wrapper });

    // Wait for hydration to complete
    await waitFor(() => {
      expect(result.current.hasHydrated).toBe(true);
    });

    // syncPuzzles should not have been called
    expect(mockSyncPuzzles).not.toHaveBeenCalled();
    // syncStatus should stay idle (not 'syncing')
    expect(result.current.syncStatus).toBe('idle');
  });

  it('triggers deferred syncPuzzles when connectivity returns after being offline', async () => {
    mockIsConnected = false;

    const { result, rerender } = renderHook(() => usePuzzleContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.hasHydrated).toBe(true);
    });

    expect(mockSyncPuzzles).not.toHaveBeenCalled();

    // Come back online
    mockIsConnected = true;
    rerender({});

    await waitFor(() => {
      expect(mockSyncPuzzles).toHaveBeenCalled();
    });
  });

  it('flushes unsynced attempts when connectivity returns after being offline', async () => {
    mockIsConnected = false;

    const { result, rerender } = renderHook(() => usePuzzleContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.hasHydrated).toBe(true);
    });

    expect(mockSyncAttempts).not.toHaveBeenCalled();

    // Come back online
    mockIsConnected = true;
    rerender({});

    await waitFor(() => {
      expect(mockSyncAttempts).toHaveBeenCalledWith('user-123');
    });
  });
});
