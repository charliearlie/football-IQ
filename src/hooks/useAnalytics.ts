/**
 * Analytics Hook
 *
 * Lightweight wrapper around PostHog with typed events.
 * Provides safe capture (try/catch, no-ops if PostHog unavailable).
 */

import { useCallback } from 'react';
import { usePostHog } from 'posthog-react-native';

// Event name constants - single source of truth
export const ANALYTICS_EVENTS = {
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  PREMIUM_OFFER_SHOWN: 'premium_offer_shown',
  PREMIUM_PURCHASE_COMPLETED: 'premium_purchase_completed',
  AD_UNLOCK_COMPLETED: 'ad_unlock_completed',
  SHARE_COMPLETED: 'share_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

// Base type compatible with PostHog's event properties
type EventProps = Record<string, string | number | boolean | null | undefined>;

interface GameStartedProps extends EventProps {
  game_mode: string;
  puzzle_date?: string;
  is_archive?: boolean;
}

interface GameCompletedProps extends EventProps {
  game_mode: string;
  result: string;
  time_spent_seconds: number | null;
  puzzle_date?: string;
}

interface PremiumOfferShownProps extends EventProps {
  trigger_source?: string;
}

interface PremiumPurchaseCompletedProps extends EventProps {
  product_id: string;
}

interface AdUnlockCompletedProps extends EventProps {
  game_mode: string;
  puzzle_id: string;
}

interface ShareCompletedProps extends EventProps {
  game_mode: string;
  method: string;
}

interface OnboardingCompletedProps extends EventProps {
  has_display_name: boolean;
}

export function useAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, properties?: EventProps) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        posthog?.capture(event, properties as any);
      } catch (error) {
        if (__DEV__) {
          console.warn('[Analytics] Failed to capture event:', event, error);
        }
      }
    },
    [posthog]
  );

  const trackGameStarted = useCallback(
    (props: GameStartedProps) => capture(ANALYTICS_EVENTS.GAME_STARTED, props),
    [capture]
  );

  const trackGameCompleted = useCallback(
    (props: GameCompletedProps) => capture(ANALYTICS_EVENTS.GAME_COMPLETED, props),
    [capture]
  );

  const trackPremiumOfferShown = useCallback(
    (props: PremiumOfferShownProps) => capture(ANALYTICS_EVENTS.PREMIUM_OFFER_SHOWN, props),
    [capture]
  );

  const trackPremiumPurchaseCompleted = useCallback(
    (props: PremiumPurchaseCompletedProps) =>
      capture(ANALYTICS_EVENTS.PREMIUM_PURCHASE_COMPLETED, props),
    [capture]
  );

  const trackAdUnlockCompleted = useCallback(
    (props: AdUnlockCompletedProps) => capture(ANALYTICS_EVENTS.AD_UNLOCK_COMPLETED, props),
    [capture]
  );

  const trackShareCompleted = useCallback(
    (props: ShareCompletedProps) => capture(ANALYTICS_EVENTS.SHARE_COMPLETED, props),
    [capture]
  );

  const trackOnboardingCompleted = useCallback(
    (props: OnboardingCompletedProps) => capture(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, props),
    [capture]
  );

  return {
    capture,
    trackGameStarted,
    trackGameCompleted,
    trackPremiumOfferShown,
    trackPremiumPurchaseCompleted,
    trackAdUnlockCompleted,
    trackShareCompleted,
    trackOnboardingCompleted,
  };
}
