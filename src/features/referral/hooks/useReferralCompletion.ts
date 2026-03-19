/**
 * useReferralCompletion
 *
 * Listens for the user's first game completion and marks their referral
 * as completed (if they were referred). This triggers the referrer's reward.
 *
 * Designed to be mounted once at the app level (e.g., in _layout.tsx).
 * Uses AsyncStorage to ensure the RPC is only called once.
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { onStatsChanged } from '@/lib/statsEvents';

const COMPLETION_KEY = '@referral_completion_sent';

export function useReferralCompletion() {
  const { user } = useAuth();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!user?.id || sentRef.current) return;

    // Listen for stats changes (emitted after game completion)
    const unsubscribe = onStatsChanged(async () => {
      if (sentRef.current) return;

      // Check if we've already sent the completion
      const alreadySent = await AsyncStorage.getItem(COMPLETION_KEY);
      if (alreadySent) {
        sentRef.current = true;
        return;
      }

      // Mark as sent before the RPC to avoid races
      sentRef.current = true;
      await AsyncStorage.setItem(COMPLETION_KEY, 'true');

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('complete_referral', {
          p_referred_user_id: user.id,
        });
        console.log('[useReferralCompletion] Referral completion sent');
      } catch (err) {
        // Non-fatal — referral completion failure must never affect gameplay
        console.warn('[useReferralCompletion] Failed:', err);
      }
    });

    return unsubscribe;
  }, [user?.id]);
}
