/**
 * Smart store review prompt hook.
 *
 * Triggers the native App Store / Play Store review dialog at high-engagement
 * moments: win streaks (3+ days) and tier promotions. Rate-limited to at most
 * once every 60 days using AsyncStorage.
 *
 * Apple and Google can further throttle the native prompt on their end, so
 * calling requestReview() is always safe — it simply no-ops when suppressed.
 */

import { useEffect, useRef } from 'react';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_REVIEW_KEY = '@football_iq_last_review_prompt';
const MIN_INTERVAL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

interface StoreReviewOptions {
  /** Whether the result modal is visible (triggers the check) */
  visible: boolean;
  /** Result type — only prompt on wins */
  resultType: 'win' | 'loss' | 'draw' | 'complete';
  /** Current streak in days */
  streakDays: number | undefined;
  /** Whether a tier change just happened */
  tierChanged: boolean;
}

/**
 * Request a store review if conditions are met.
 * Conditions: win result + (streak >= 3 OR tier promotion) + not prompted recently.
 */
async function maybeRequestReview(
  resultType: string,
  streakDays: number | undefined,
  tierChanged: boolean,
): Promise<void> {
  // Only prompt on positive outcomes
  if (resultType !== 'win' && resultType !== 'complete') return;

  // Must have a meaningful streak or a tier promotion
  const hasStreak = streakDays !== undefined && streakDays >= 3;
  if (!hasStreak && !tierChanged) return;

  // Rate-limit: once per 60 days
  try {
    const lastPrompt = await AsyncStorage.getItem(LAST_REVIEW_KEY);
    if (lastPrompt) {
      const elapsed = Date.now() - parseInt(lastPrompt, 10);
      if (elapsed < MIN_INTERVAL_MS) return;
    }
  } catch {
    // If we can't read storage, proceed cautiously — skip the prompt
    return;
  }

  // Check native availability and request
  const available = await StoreReview.isAvailableAsync();
  if (!available) return;

  await StoreReview.requestReview();
  await AsyncStorage.setItem(LAST_REVIEW_KEY, String(Date.now()));
}

/**
 * Hook that triggers a native store review prompt at the right moment.
 * Call it inside BaseResultModal with the current game state.
 */
export function useStoreReview({
  visible,
  resultType,
  streakDays,
  tierChanged,
}: StoreReviewOptions): void {
  const prompted = useRef(false);

  useEffect(() => {
    if (!visible) {
      prompted.current = false;
      return;
    }

    if (prompted.current) return;
    prompted.current = true;

    // Delay slightly so the result modal animation finishes first
    const timer = setTimeout(() => {
      maybeRequestReview(resultType, streakDays, tierChanged).catch(() => {
        // Never crash the app over a review prompt
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [visible, resultType, streakDays, tierChanged]);
}
