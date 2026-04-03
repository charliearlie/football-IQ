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
import { useAnalytics } from './useAnalytics';

const LAST_REVIEW_KEY = '@football_iq_last_review_prompt';
const SESSION_COUNT_KEY = '@football_iq_session_count';
const MIN_INTERVAL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days (3 prompts/year, Apple rarely suppresses)
const MIN_SESSIONS_FOR_REVIEW = 5;

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
 * Increment and return the session count.
 */
async function incrementSessionCount(): Promise<number> {
  try {
    const current = await AsyncStorage.getItem(SESSION_COUNT_KEY);
    const count = (current ? parseInt(current, 10) : 0) + 1;
    await AsyncStorage.setItem(SESSION_COUNT_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

/**
 * Request a store review if conditions are met.
 * Conditions: win result + (streak >= 3 OR tier promotion OR 5+ sessions) + not prompted recently.
 */
async function maybeRequestReview(
  resultType: string,
  streakDays: number | undefined,
  tierChanged: boolean,
  trackPrompted?: (props: { trigger: string; streak_days?: number; session_count?: number }) => void,
): Promise<void> {
  // Only prompt on positive outcomes
  if (resultType !== 'win' && resultType !== 'complete') return;

  // Increment session count on each completed game
  const sessionCount = await incrementSessionCount();

  // Must have a meaningful streak, tier promotion, or enough sessions
  const hasStreak = streakDays !== undefined && streakDays >= 3;
  const hasEnoughSessions = sessionCount >= MIN_SESSIONS_FOR_REVIEW;
  if (!hasStreak && !tierChanged && !hasEnoughSessions) return;

  // Rate-limit: once per 90 days
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

  const trigger = tierChanged ? 'tier_promotion' : hasStreak ? 'streak' : 'session_count';
  trackPrompted?.({ trigger, streak_days: streakDays, session_count: sessionCount });

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
  const { trackStoreReviewPrompted } = useAnalytics();

  useEffect(() => {
    if (!visible) {
      prompted.current = false;
      return;
    }

    if (prompted.current) return;
    prompted.current = true;

    // Delay slightly so the result modal animation finishes first
    const timer = setTimeout(() => {
      maybeRequestReview(resultType, streakDays, tierChanged, trackStoreReviewPrompted).catch(() => {
        // Never crash the app over a review prompt
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [visible, resultType, streakDays, tierChanged, trackStoreReviewPrompted]);
}
