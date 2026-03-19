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
  TIER_LEVEL_UP: 'tier_level_up',
  FIRST_WIN_CELEBRATED: 'first_win_celebrated',
  STREAK_FREEZE_USED: 'streak_freeze_used',
  STREAK_FREEZE_EARNED: 'streak_freeze_earned',
  HINT_USED: 'hint_used',
  STREAK_MILESTONE_REACHED: 'streak_milestone_reached',
  STREAK_RECOVERED: 'streak_recovered',
  STREAK_FREEZE_AD_EARNED: 'streak_freeze_ad_earned',
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATION_SCHEDULED: 'notification_scheduled',
  REFERRAL_LINK_SHARED: 'referral_link_shared',
  REFERRAL_ATTRIBUTED: 'referral_attributed',
  REFERRAL_REWARD_CLAIMED: 'referral_reward_claimed',
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

interface TierLevelUpProps extends EventProps {
  new_tier: string;
  new_tier_number: number;
  total_iq: number;
}

interface FirstWinCelebratedProps extends EventProps {
  game_mode?: string;
  score?: number;
}

interface StreakFreezeUsedProps extends EventProps {
  streak_length: number;
  freeze_source: 'earned' | 'initial' | 'premium';
}

interface StreakFreezeEarnedProps extends EventProps {
  streak_milestone: number;
  total_freezes: number;
}

interface HintUsedProps extends EventProps {
  game_mode: string;
  hint_source: 'premium' | 'rewarded_ad';
}

interface StreakMilestoneReachedProps extends EventProps {
  milestone_days: number;
  reward_type: string;
  current_streak: number;
}

interface StreakRecoveredProps extends EventProps {
  previous_streak: number;
  games_played: number;
}

interface StreakFreezeAdEarnedProps extends EventProps {
  available_freezes: number;
  streak_length: number;
}

interface ReferralLinkSharedProps extends EventProps {
  source: string;
}

interface ReferralAttributedProps extends EventProps {
  referral_code: string;
}

interface ReferralRewardClaimedProps extends EventProps {
  unlocks_granted: number;
}

interface NotificationOpenedProps extends EventProps {
  notification_type: string;
  notification_id: string;
}

interface NotificationScheduledProps extends EventProps {
  notification_type: string;
  notification_id: string;
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

  const trackTierLevelUp = useCallback(
    (props: TierLevelUpProps) => capture(ANALYTICS_EVENTS.TIER_LEVEL_UP, props),
    [capture]
  );

  const trackFirstWinCelebrated = useCallback(
    (props: FirstWinCelebratedProps) => capture(ANALYTICS_EVENTS.FIRST_WIN_CELEBRATED, props),
    [capture]
  );

  const trackStreakFreezeUsed = useCallback(
    (props: StreakFreezeUsedProps) => capture(ANALYTICS_EVENTS.STREAK_FREEZE_USED, props),
    [capture]
  );

  const trackStreakFreezeEarned = useCallback(
    (props: StreakFreezeEarnedProps) => capture(ANALYTICS_EVENTS.STREAK_FREEZE_EARNED, props),
    [capture]
  );

  const trackHintUsed = useCallback(
    (props: HintUsedProps) => capture(ANALYTICS_EVENTS.HINT_USED, props),
    [capture]
  );

  const trackStreakMilestoneReached = useCallback(
    (props: StreakMilestoneReachedProps) =>
      capture(ANALYTICS_EVENTS.STREAK_MILESTONE_REACHED, props),
    [capture]
  );

  const trackStreakRecovered = useCallback(
    (props: StreakRecoveredProps) => capture(ANALYTICS_EVENTS.STREAK_RECOVERED, props),
    [capture]
  );

  const trackStreakFreezeAdEarned = useCallback(
    (props: StreakFreezeAdEarnedProps) =>
      capture(ANALYTICS_EVENTS.STREAK_FREEZE_AD_EARNED, props),
    [capture]
  );

  const trackReferralLinkShared = useCallback(
    (props: ReferralLinkSharedProps) =>
      capture(ANALYTICS_EVENTS.REFERRAL_LINK_SHARED, props),
    [capture]
  );

  const trackReferralAttributed = useCallback(
    (props: ReferralAttributedProps) =>
      capture(ANALYTICS_EVENTS.REFERRAL_ATTRIBUTED, props),
    [capture]
  );

  const trackReferralRewardClaimed = useCallback(
    (props: ReferralRewardClaimedProps) =>
      capture(ANALYTICS_EVENTS.REFERRAL_REWARD_CLAIMED, props),
    [capture]
  );

  const trackNotificationOpened = useCallback(
    (props: NotificationOpenedProps) =>
      capture(ANALYTICS_EVENTS.NOTIFICATION_OPENED, props),
    [capture]
  );

  const trackNotificationScheduled = useCallback(
    (props: NotificationScheduledProps) =>
      capture(ANALYTICS_EVENTS.NOTIFICATION_SCHEDULED, props),
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
    trackTierLevelUp,
    trackFirstWinCelebrated,
    trackStreakFreezeUsed,
    trackStreakFreezeEarned,
    trackHintUsed,
    trackStreakMilestoneReached,
    trackStreakRecovered,
    trackStreakFreezeAdEarned,
    trackNotificationOpened,
    trackNotificationScheduled,
    trackReferralLinkShared,
    trackReferralAttributed,
    trackReferralRewardClaimed,
  };
}
