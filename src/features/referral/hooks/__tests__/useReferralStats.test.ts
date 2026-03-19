/**
 * Tests for useReferralStats hook
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useReferralStats } from '../useReferralStats';

// Mock supabase
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('useReferralStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null stats when userId is null', () => {
    const { result } = renderHook(() => useReferralStats(null));
    expect(result.current.stats).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches stats on mount when userId is provided', async () => {
    mockRpc.mockResolvedValue({
      data: {
        total_referrals: 3,
        completed_referrals: 2,
        unclaimed_rewards: 1,
        archive_unlocks_available: 3,
      },
      error: null,
    });

    const { result } = renderHook(() => useReferralStats('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalReferrals: 3,
      completedReferrals: 2,
      unclaimedRewards: 1,
      archiveUnlocksAvailable: 3,
    });
    expect(mockRpc).toHaveBeenCalledWith('get_referral_stats', { p_user_id: 'user-123' });
  });

  it('handles RPC errors gracefully', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Something went wrong' },
    });

    const { result } = renderHook(() => useReferralStats('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.stats).toEqual({
      totalReferrals: 0,
      completedReferrals: 0,
      unclaimedRewards: 0,
      archiveUnlocksAvailable: 0,
    });
  });
});
