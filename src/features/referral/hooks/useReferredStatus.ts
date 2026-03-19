/**
 * useReferredStatus
 *
 * Checks whether the current user was referred by someone.
 * Referred users get an extended 7-day free window (instead of 3 days).
 * The result is cached in AsyncStorage to avoid repeated RPC calls.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = '@referred_status';

interface ReferredStatus {
  isReferred: boolean;
  extendedWindowDays: number;
}

interface UseReferredStatusResult {
  isReferred: boolean;
  freeWindowDays: number;
  loading: boolean;
}

export function useReferredStatus(userId: string | null): UseReferredStatusResult {
  const [status, setStatus] = useState<ReferredStatus>({
    isReferred: false,
    extendedWindowDays: 3,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Check cache first
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as ReferredStatus;
        setStatus(parsed);
        setLoading(false);
        return;
      }
    } catch { /* ignore cache read errors */ }

    // Fetch from Supabase
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(
        'check_referred_status',
        { p_user_id: userId },
      );

      if (error) {
        console.warn('[useReferredStatus] RPC failed:', (error as { message: string }).message);
        setLoading(false);
        return;
      }

      const result = data as { is_referred: boolean; extended_window_days: number };
      const newStatus: ReferredStatus = {
        isReferred: result.is_referred,
        extendedWindowDays: result.extended_window_days,
      };

      setStatus(newStatus);

      // Cache the result (it won't change once set)
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newStatus));
    } catch (err) {
      console.warn('[useReferredStatus] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isReferred: status.isReferred,
    freeWindowDays: status.extendedWindowDays,
    loading,
  };
}

/**
 * Get the free window days from cache synchronously-ish (for use in utility functions).
 * Returns 3 (default) if no cached value exists.
 */
export async function getCachedFreeWindowDays(): Promise<number> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as ReferredStatus;
      return parsed.extendedWindowDays;
    }
  } catch { /* ignore */ }
  return 3;
}
