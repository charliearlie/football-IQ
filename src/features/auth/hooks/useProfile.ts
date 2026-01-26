import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import { Profile } from '../types/auth.types';
import { getUnsyncedIQ } from '@/lib/database';

const PROFILE_TIMEOUT_MS = 10000;

/**
 * Wraps a promise-like (thenable) with a timeout to prevent indefinite hanging.
 * Works with both Promises and Supabase's PostgrestBuilder.
 */
function withTimeout<T>(
  promiseLike: PromiseLike<T>,
  ms: number,
  message: string
): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  isPremium: boolean;
  displayName: string | null;
  needsDisplayName: boolean;
  /** Combined total IQ: server value + local unsynced attempts */
  totalIQ: number;
  refetch: () => Promise<void>;
  /** Refresh local unsynced IQ (call after completing a game) */
  refreshLocalIQ: () => Promise<void>;
}

/**
 * Hook to fetch and subscribe to the current user's profile.
 *
 * @param userId - The user's ID from auth, or null if not authenticated
 * @returns Profile data, loading state, and derived premium/displayName values
 */
export function useProfile(userId: string | null): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(userId !== null);
  const [error, setError] = useState<Error | null>(null);
  const [localUnsyncedIQ, setLocalUnsyncedIQ] = useState(0);

  // Track server total_iq to detect when sync completes
  const prevServerTotalIQ = useRef<number | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single(),
        PROFILE_TIMEOUT_MS,
        'Profile fetch timed out'
      );

      if (fetchError) {
        // PGRST116 = "Row not found" - create profile for new user
        if (fetchError.code === 'PGRST116') {
          console.log('[useProfile] Profile not found, creating for user:', userId);
          const { data: newProfile, error: createError } = await withTimeout(
            supabase.from('profiles').insert({ id: userId }).select().single(),
            PROFILE_TIMEOUT_MS,
            'Profile creation timed out'
          );

          if (createError) {
            console.error('[useProfile] Failed to create profile:', createError);
            setError(createError as unknown as Error);
            setProfile(null);
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error('[useProfile] Profile fetch error:', fetchError);
          setError(fetchError as unknown as Error);
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (timeoutError) {
      console.error('[useProfile] Operation timed out:', timeoutError);
      setError(timeoutError as Error);
      setProfile(null);
    }

    setIsLoading(false);
  }, [userId]);

  // Fetch local unsynced IQ from SQLite
  const refreshLocalIQ = useCallback(async () => {
    // SQLite not available on web
    if (Platform.OS === 'web') {
      setLocalUnsyncedIQ(0);
      return;
    }
    try {
      const unsyncedIQ = await getUnsyncedIQ();
      setLocalUnsyncedIQ(unsyncedIQ);
    } catch (err) {
      console.warn('[useProfile] Failed to get unsynced IQ:', err);
      setLocalUnsyncedIQ(0);
    }
  }, []);

  // Reset local IQ when server total_iq changes (sync completed)
  useEffect(() => {
    const serverTotalIQ = profile?.total_iq ?? 0;
    if (prevServerTotalIQ.current !== null && serverTotalIQ !== prevServerTotalIQ.current) {
      // Server IQ changed, meaning sync completed - refresh local IQ
      // (it should now be 0 or lower as synced attempts are cleared)
      refreshLocalIQ();
    }
    prevServerTotalIQ.current = serverTotalIQ;
  }, [profile?.total_iq, refreshLocalIQ]);

  // Fetch local IQ on mount
  useEffect(() => {
    refreshLocalIQ();
  }, [refreshLocalIQ]);

  // Fetch profile and subscribe to realtime changes
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    fetchProfile();

    // Subscribe to realtime changes for this user's profile
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProfile]);

  // Derived state
  const isPremium = profile?.is_premium ?? false;
  const displayName = profile?.display_name ?? null;
  const needsDisplayName = profile !== null && !profile.display_name;
  // Combine server IQ with local unsynced IQ for immediate display
  const serverTotalIQ = profile?.total_iq ?? 0;
  const totalIQ = serverTotalIQ + localUnsyncedIQ;

  return {
    profile,
    isLoading,
    error,
    isPremium,
    displayName,
    needsDisplayName,
    totalIQ,
    refetch: fetchProfile,
    refreshLocalIQ,
  };
}
