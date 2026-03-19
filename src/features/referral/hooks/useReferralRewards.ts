/**
 * useReferralRewards
 *
 * Checks for unclaimed referral rewards and grants archive puzzle unlocks
 * to the local SQLite database. Each completed referral grants 3 archive unlocks.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveAdUnlock } from '@/lib/database';

interface UseReferralRewardsResult {
  claimRewards: (userId: string) => Promise<number>;
  claiming: boolean;
}

/**
 * Grants N archive puzzle unlocks by inserting entries into the local
 * unlocked_puzzles table. Picks the N oldest locked puzzles from the catalog.
 */
async function grantArchiveUnlocks(count: number): Promise<void> {
  if (count <= 0) return;

  // We don't need to pick specific puzzles here — the unlocks will be
  // consumed when the user navigates to locked archive puzzles.
  // Instead, we generate placeholder unlock entries that the user can
  // "spend" on any locked puzzle they choose.
  //
  // We store these as special referral unlock credits in AsyncStorage
  // rather than pre-selecting puzzles, giving users choice.
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const key = '@referral_unlock_credits';
  const existing = await AsyncStorage.getItem(key);
  const current = existing ? parseInt(existing, 10) : 0;
  await AsyncStorage.setItem(key, String(current + count));
}

export function useReferralRewards(): UseReferralRewardsResult {
  const [claiming, setClaiming] = useState(false);

  const claimRewards = useCallback(async (userId: string): Promise<number> => {
    setClaiming(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(
        'claim_referral_rewards',
        { p_user_id: userId },
      );

      if (error) {
        console.warn('[useReferralRewards] Claim failed:', (error as { message: string }).message);
        return 0;
      }

      const unlocksGranted = data as number;

      if (unlocksGranted > 0) {
        await grantArchiveUnlocks(unlocksGranted);
      }

      return unlocksGranted;
    } catch (err) {
      console.warn('[useReferralRewards] Unexpected error:', err);
      return 0;
    } finally {
      setClaiming(false);
    }
  }, []);

  return { claimRewards, claiming };
}

/**
 * Get current referral unlock credits from AsyncStorage.
 */
export async function getReferralUnlockCredits(): Promise<number> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const val = await AsyncStorage.getItem('@referral_unlock_credits');
  return val ? parseInt(val, 10) : 0;
}

/**
 * Spend one referral unlock credit on a specific puzzle.
 * Returns true if credit was available and spent.
 */
export async function spendReferralUnlockCredit(puzzleId: string): Promise<boolean> {
  const credits = await getReferralUnlockCredits();
  if (credits <= 0) return false;

  // Grant the actual puzzle unlock in SQLite
  await saveAdUnlock(puzzleId);

  // Decrement credits
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem('@referral_unlock_credits', String(credits - 1));
  return true;
}
