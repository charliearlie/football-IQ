import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '../types/auth.types';

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  isPremium: boolean;
  displayName: string | null;
  needsDisplayName: boolean;
  refetch: () => Promise<void>;
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

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      setError(fetchError as unknown as Error);
      setProfile(null);
    } else {
      setProfile(data);
    }

    setIsLoading(false);
  }, [userId]);

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

  return {
    profile,
    isLoading,
    error,
    isPremium,
    displayName,
    needsDisplayName,
    refetch: fetchProfile,
  };
}
