/**
 * useAnalytics Tests
 *
 * Tests the analytics hook's:
 * - ANALYTICS_EVENTS constant completeness and correct string values
 * - All track functions exist on the returned object
 * - Each track function calls PostHog capture with the correct event name
 * - The generic capture function wraps PostHog safely
 */

import { renderHook, act } from '@testing-library/react-native';
import { usePostHog } from 'posthog-react-native';
import { useAnalytics, ANALYTICS_EVENTS } from '../useAnalytics';

// PostHog is mocked in jest-setup.ts — grab the capture mock per-render
function getMockPostHog() {
  const mockCapture = jest.fn();
  (usePostHog as jest.Mock).mockReturnValue({ capture: mockCapture });
  return mockCapture;
}

describe('ANALYTICS_EVENTS', () => {
  describe('growth feature events are defined', () => {
    it('defines STORE_REVIEW_PROMPTED', () => {
      expect(ANALYTICS_EVENTS.STORE_REVIEW_PROMPTED).toBe('store_review_prompted');
    });

    it('defines REFERRAL_LINK_SHARED', () => {
      expect(ANALYTICS_EVENTS.REFERRAL_LINK_SHARED).toBe('referral_link_shared');
    });

    it('defines REFERRAL_ATTRIBUTED', () => {
      expect(ANALYTICS_EVENTS.REFERRAL_ATTRIBUTED).toBe('referral_attributed');
    });

    it('defines REFERRAL_REWARD_CLAIMED', () => {
      expect(ANALYTICS_EVENTS.REFERRAL_REWARD_CLAIMED).toBe('referral_reward_claimed');
    });

    it('defines REFERRAL_CTA_SHOWN', () => {
      expect(ANALYTICS_EVENTS.REFERRAL_CTA_SHOWN).toBe('referral_cta_shown');
    });

    it('defines NOTIFICATION_OPENED', () => {
      expect(ANALYTICS_EVENTS.NOTIFICATION_OPENED).toBe('notification_opened');
    });

    it('defines NOTIFICATION_SCHEDULED', () => {
      expect(ANALYTICS_EVENTS.NOTIFICATION_SCHEDULED).toBe('notification_scheduled');
    });

    it('defines NOTIFICATION_PERMISSION_GRANTED', () => {
      expect(ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_GRANTED).toBe('notification_permission_granted');
    });

    it('defines NOTIFICATION_PERMISSION_DENIED', () => {
      expect(ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_DENIED).toBe('notification_permission_denied');
    });

    it('defines AD_DECLINED', () => {
      expect(ANALYTICS_EVENTS.AD_DECLINED).toBe('ad_declined');
    });
  });

  describe('core game events are defined', () => {
    it('defines GAME_STARTED', () => {
      expect(ANALYTICS_EVENTS.GAME_STARTED).toBe('game_started');
    });

    it('defines GAME_COMPLETED', () => {
      expect(ANALYTICS_EVENTS.GAME_COMPLETED).toBe('game_completed');
    });

    it('defines PREMIUM_OFFER_SHOWN', () => {
      expect(ANALYTICS_EVENTS.PREMIUM_OFFER_SHOWN).toBe('premium_offer_shown');
    });

    it('defines PREMIUM_PURCHASE_COMPLETED', () => {
      expect(ANALYTICS_EVENTS.PREMIUM_PURCHASE_COMPLETED).toBe('premium_purchase_completed');
    });

    it('defines SHARE_COMPLETED', () => {
      expect(ANALYTICS_EVENTS.SHARE_COMPLETED).toBe('share_completed');
    });

    it('defines TIER_LEVEL_UP', () => {
      expect(ANALYTICS_EVENTS.TIER_LEVEL_UP).toBe('tier_level_up');
    });

    it('defines STREAK_MILESTONE_REACHED', () => {
      expect(ANALYTICS_EVENTS.STREAK_MILESTONE_REACHED).toBe('streak_milestone_reached');
    });

    it('defines PAYWALL_DISMISSED', () => {
      expect(ANALYTICS_EVENTS.PAYWALL_DISMISSED).toBe('paywall_dismissed');
    });

    it('defines ARCHIVE_LOCK_SEEN', () => {
      expect(ANALYTICS_EVENTS.ARCHIVE_LOCK_SEEN).toBe('archive_lock_seen');
    });
  });

  it('contains no duplicate event name strings', () => {
    const values = Object.values(ANALYTICS_EVENTS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('all event name strings are snake_case (lowercase with underscores)', () => {
    Object.values(ANALYTICS_EVENTS).forEach((eventName) => {
      expect(eventName).toMatch(/^[a-z][a-z_]*[a-z]$/);
    });
  });
});

describe('useAnalytics hook', () => {
  describe('returned object shape', () => {
    it('exposes all expected track functions', () => {
      const { result } = renderHook(() => useAnalytics());
      const analytics = result.current;

      expect(typeof analytics.capture).toBe('function');
      expect(typeof analytics.trackGameStarted).toBe('function');
      expect(typeof analytics.trackGameCompleted).toBe('function');
      expect(typeof analytics.trackPremiumOfferShown).toBe('function');
      expect(typeof analytics.trackPremiumPurchaseCompleted).toBe('function');
      expect(typeof analytics.trackAdUnlockCompleted).toBe('function');
      expect(typeof analytics.trackShareCompleted).toBe('function');
      expect(typeof analytics.trackOnboardingCompleted).toBe('function');
      expect(typeof analytics.trackTierLevelUp).toBe('function');
      expect(typeof analytics.trackFirstWinCelebrated).toBe('function');
      expect(typeof analytics.trackStreakFreezeUsed).toBe('function');
      expect(typeof analytics.trackStreakFreezeEarned).toBe('function');
      expect(typeof analytics.trackHintUsed).toBe('function');
      expect(typeof analytics.trackStreakMilestoneReached).toBe('function');
      expect(typeof analytics.trackStreakRecovered).toBe('function');
      expect(typeof analytics.trackStreakFreezeAdEarned).toBe('function');
      expect(typeof analytics.trackReferralLinkShared).toBe('function');
      expect(typeof analytics.trackReferralAttributed).toBe('function');
      expect(typeof analytics.trackReferralRewardClaimed).toBe('function');
      expect(typeof analytics.trackNotificationOpened).toBe('function');
      expect(typeof analytics.trackNotificationScheduled).toBe('function');
      expect(typeof analytics.trackPaywallDismissed).toBe('function');
      expect(typeof analytics.trackArchiveLockSeen).toBe('function');
      expect(typeof analytics.trackNotificationPermissionGranted).toBe('function');
      expect(typeof analytics.trackNotificationPermissionDenied).toBe('function');
      expect(typeof analytics.trackReferralCtaShown).toBe('function');
      expect(typeof analytics.trackAdDeclined).toBe('function');
      expect(typeof analytics.trackStoreReviewPrompted).toBe('function');
    });
  });

  describe('capture wrapper', () => {
    it('calls posthog.capture with the event name', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture('test_event');
      });

      expect(mockCapture).toHaveBeenCalledWith('test_event', undefined);
    });

    it('passes properties through to posthog.capture', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.capture('test_event', { key: 'value' });
      });

      expect(mockCapture).toHaveBeenCalledWith('test_event', { key: 'value' });
    });

    it('does not throw when posthog is undefined', () => {
      (usePostHog as jest.Mock).mockReturnValue(undefined);
      const { result } = renderHook(() => useAnalytics());

      expect(() => {
        act(() => {
          result.current.capture('test_event');
        });
      }).not.toThrow();
    });
  });

  describe('trackStoreReviewPrompted', () => {
    it('calls capture with store_review_prompted event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackStoreReviewPrompted({ trigger: 'streak', streak_days: 7 });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'store_review_prompted',
        { trigger: 'streak', streak_days: 7 }
      );
    });

    it('includes session_count when provided', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackStoreReviewPrompted({
          trigger: 'session_count',
          session_count: 5,
        });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'store_review_prompted',
        { trigger: 'session_count', session_count: 5 }
      );
    });
  });

  describe('trackReferralLinkShared', () => {
    it('calls capture with referral_link_shared event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackReferralLinkShared({ source: 'result_modal' });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'referral_link_shared',
        { source: 'result_modal' }
      );
    });
  });

  describe('trackReferralAttributed', () => {
    it('calls capture with referral_attributed event and referral_code', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackReferralAttributed({ referral_code: 'FRIEND42' });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'referral_attributed',
        { referral_code: 'FRIEND42' }
      );
    });
  });

  describe('trackReferralRewardClaimed', () => {
    it('calls capture with referral_reward_claimed event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackReferralRewardClaimed({ unlocks_granted: 3 });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'referral_reward_claimed',
        { unlocks_granted: 3 }
      );
    });
  });

  describe('trackReferralCtaShown', () => {
    it('calls capture with referral_cta_shown event and placement', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackReferralCtaShown({ placement: 'success_screen' });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'referral_cta_shown',
        { placement: 'success_screen' }
      );
    });
  });

  describe('trackNotificationOpened', () => {
    it('calls capture with notification_opened event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackNotificationOpened({
          notification_type: 'daily_reminder',
          notification_id: 'notif-123',
        });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'notification_opened',
        { notification_type: 'daily_reminder', notification_id: 'notif-123' }
      );
    });
  });

  describe('trackNotificationScheduled', () => {
    it('calls capture with notification_scheduled event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackNotificationScheduled({
          notification_type: 'streak_reminder',
          notification_id: 'notif-456',
        });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'notification_scheduled',
        { notification_type: 'streak_reminder', notification_id: 'notif-456' }
      );
    });
  });

  describe('trackNotificationPermissionGranted', () => {
    it('calls capture with notification_permission_granted event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackNotificationPermissionGranted({ prompt_location: 'onboarding' });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'notification_permission_granted',
        { prompt_location: 'onboarding' }
      );
    });

    it('calls capture without properties when called with no arguments', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackNotificationPermissionGranted();
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'notification_permission_granted',
        undefined
      );
    });
  });

  describe('trackAdDeclined', () => {
    it('calls capture with ad_declined event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackAdDeclined({ game_mode: 'career_path', ad_type: 'rewarded' });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'ad_declined',
        { game_mode: 'career_path', ad_type: 'rewarded' }
      );
    });
  });

  describe('trackGameStarted', () => {
    it('calls capture with game_started event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackGameStarted({
          game_mode: 'the_grid',
          puzzle_date: '2026-04-03',
          is_archive: false,
        });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'game_started',
        { game_mode: 'the_grid', puzzle_date: '2026-04-03', is_archive: false }
      );
    });
  });

  describe('trackPaywallDismissed', () => {
    it('calls capture with paywall_dismissed event', () => {
      const mockCapture = getMockPostHog();
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPaywallDismissed({ trigger_source: 'archive_lock' });
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'paywall_dismissed',
        { trigger_source: 'archive_lock' }
      );
    });
  });
});
