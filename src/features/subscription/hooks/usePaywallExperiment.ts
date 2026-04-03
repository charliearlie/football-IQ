/**
 * Paywall Timing Experiment
 *
 * A/B test: show paywall after first successful game completion
 * vs the current default (only on archive gate / manual triggers).
 *
 * PostHog flag: paywall_timing_v1
 * - control: current behavior (archive gate only)
 * - test: show paywall after first game win, framed as "first_win" context
 *
 * Usage in result modals:
 *   const { shouldShowPaywallOnWin } = usePaywallExperiment();
 *   // After a win result:
 *   if (shouldShowPaywallOnWin) router.push('/premium-modal?mode=first_win');
 */

import { useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useExperimentVariant, useTrackExperimentExposure } from '@/hooks/useExperiment';
import { useAuth } from '@/features/auth';

export function usePaywallExperiment() {
  const variant = useExperimentVariant('paywall_timing_v1');
  const trackExposure = useTrackExperimentExposure();
  const { profile } = useAuth();
  const router = useRouter();
  const hasShownRef = useRef(false);

  const isTestVariant = variant === 'test';
  const isPremium = profile?.is_premium ?? false;

  /**
   * Check if we should show the paywall after a win.
   * Only fires once per session to avoid being annoying.
   * Only for non-premium users in the test variant.
   */
  const maybeTriggerPostWinPaywall = useCallback(() => {
    if (!isTestVariant || isPremium || hasShownRef.current) return false;
    if (variant === undefined) return false; // Flag not loaded yet

    hasShownRef.current = true;
    trackExposure('paywall_timing_v1', 'test');

    // Small delay to let the result modal settle
    setTimeout(() => {
      router.push({
        pathname: '/premium-modal',
        params: { mode: 'first_win' },
      });
    }, 3000);

    return true;
  }, [isTestVariant, isPremium, variant, trackExposure, router]);

  return {
    /** Whether the user is in the test variant */
    isTestVariant,
    /** The experiment variant ('control' | 'test' | undefined) */
    variant,
    /** Call after a win to conditionally show the paywall */
    maybeTriggerPostWinPaywall,
  };
}
