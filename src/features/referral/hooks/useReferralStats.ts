/**
 * useReferralStats
 *
 * Fetches the current user's referral statistics from Supabase.
 * Returns total referrals, completed referrals, and unclaimed rewards.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  unclaimedRewards: number;
  archiveUnlocksAvailable: number;
}

interface UseReferralStatsResult {
  stats: ReferralStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const DEFAULT_STATS: ReferralStats = {
  totalReferrals: 0,
  completedReferrals: 0,
  unclaimedRewards: 0,
  archiveUnlocksAvailable: 0,
};

export function useReferralStats(userId: string | null): UseReferralStatsResult {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase as any).rpc(
        'get_referral_stats',
        { p_user_id: userId },
      );

      if (rpcError) {
        throw new Error((rpcError as { message: string }).message);
      }

      const parsed = data as {
        total_referrals: number;
        completed_referrals: number;
        unclaimed_rewards: number;
        archive_unlocks_available: number;
      };

      setStats({
        totalReferrals: parsed.total_referrals,
        completedReferrals: parsed.completed_referrals,
        unclaimedRewards: parsed.unclaimed_rewards,
        archiveUnlocksAvailable: parsed.archive_unlocks_available,
      });
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to fetch referral stats');
      console.error('[useReferralStats]', e);
      setError(e);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  return { stats, loading, error, refresh };
}
