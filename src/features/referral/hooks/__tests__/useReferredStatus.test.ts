/**
 * Tests for useReferredStatus hook
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useReferredStatus } from '../useReferredStatus';

// Mock AsyncStorage
const mockAsyncStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockAsyncStorage[key] = value;
      return Promise.resolve();
    }),
  },
}));

// Mock supabase
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('useReferredStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockAsyncStorage).forEach((key) => delete mockAsyncStorage[key]);
  });

  it('returns default 3-day window when userId is null', async () => {
    const { result } = renderHook(() => useReferredStatus(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isReferred).toBe(false);
    expect(result.current.freeWindowDays).toBe(3);
  });

  it('returns 7-day window for referred users', async () => {
    mockRpc.mockResolvedValue({
      data: { is_referred: true, extended_window_days: 7 },
      error: null,
    });

    const { result } = renderHook(() => useReferredStatus('user-456'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isReferred).toBe(true);
    expect(result.current.freeWindowDays).toBe(7);
  });

  it('returns 3-day window for non-referred users', async () => {
    mockRpc.mockResolvedValue({
      data: { is_referred: false, extended_window_days: 3 },
      error: null,
    });

    const { result } = renderHook(() => useReferredStatus('user-789'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isReferred).toBe(false);
    expect(result.current.freeWindowDays).toBe(3);
  });

  it('uses cached status when available', async () => {
    mockAsyncStorage['@referred_status'] = JSON.stringify({
      isReferred: true,
      extendedWindowDays: 7,
    });

    const { result } = renderHook(() => useReferredStatus('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isReferred).toBe(true);
    expect(result.current.freeWindowDays).toBe(7);
    // RPC should NOT have been called
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
