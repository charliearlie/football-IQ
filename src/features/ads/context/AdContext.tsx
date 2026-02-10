/**
 * Ad Context
 *
 * Provides ad-related state and actions to the app.
 * Manages rewarded ads, banner ads visibility, and ad unlock tracking.
 *
 * Premium users: shouldShowAds = false, no ads loaded
 * Free users: shouldShowAds = true, ads loaded and shown
 */

import React, {
  createContext,
  use,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/features/auth';
import { saveAdUnlock } from '@/lib/database';
import { fetchAndSavePuzzle } from '../services/puzzleFetchService';
import { AdContextValue, RewardedAdState } from '../types/ads.types';
import { isAdsSupportedPlatform, getAdUnitId } from '../config/adUnits';

// Conditionally import RewardedAd SDK components only on native platforms
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RewardedAd: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RewardedAdEventType: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AdEventType: any = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require('react-native-google-mobile-ads');
    RewardedAd = mobileAds.RewardedAd;
    RewardedAdEventType = mobileAds.RewardedAdEventType;
    AdEventType = mobileAds.AdEventType;
  } catch {
    // Module not available
  }
}

const AdContext = createContext<AdContextValue | null>(null);

interface AdProviderProps {
  children: React.ReactNode;
}

/**
 * AdProvider - Context provider for ad management.
 *
 * Features:
 * - Checks premium status to determine if ads should be shown
 * - Manages rewarded ad loading state
 * - Tracks ad-unlocked puzzles (permanent unlocks)
 * - Refreshes unlocks on app foreground
 */
export function AdProvider({ children }: AdProviderProps) {
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;

  // Rewarded ad state
  const [rewardedAdState, setRewardedAdState] = useState<RewardedAdState>('idle');

  // Refs for rewarded ad instance and callback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewardedAdRef = useRef<any>(null);
  const rewardedAdLoadedRef = useRef(false);
  const rewardCallbackRef = useRef<((rewarded: boolean) => void) | null>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Determine if ads should be shown
  const shouldShowAds = useMemo(() => {
    // No ads on unsupported platforms
    if (!isAdsSupportedPlatform()) {
      return false;
    }
    // No ads for premium users
    if (isPremium) {
      return false;
    }
    return true;
  }, [isPremium]);


  // Cleanup rewarded ad on unmount
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      rewardedAdRef.current = null;
    };
  }, []);

  // Grant an ad unlock for a puzzle
  // Nuclear option: Just save to database, no state updates
  // Archive will refresh naturally when user returns (useFocusEffect)
  const grantAdUnlock = useCallback(
    async (puzzleId: string): Promise<void> => {
      try {
        // Save the unlock record
        await saveAdUnlock(puzzleId);

        // Fetch and save full puzzle content from Supabase
        // This ensures the puzzle data is available locally for free users
        // who haven't synced archive puzzles (only last 7 days are synced)
        await fetchAndSavePuzzle(puzzleId);

        // That's it - no state updates, no callbacks
        // Archive will refresh when user returns to it
      } catch (error) {
        console.error('Failed to grant ad unlock:', error);
        throw error;
      }
    },
    []
  );

  // Clean up rewarded ad listeners
  const cleanupRewardedAd = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];
    rewardedAdRef.current = null;
    rewardedAdLoadedRef.current = false;
  }, []);

  // Load a rewarded ad using the actual SDK
  // Returns a Promise that resolves when ad is loaded or rejects on error
  const loadRewardedAd = useCallback(async (): Promise<void> => {
    if (!shouldShowAds) {
      return;
    }

    // Skip on unsupported platforms or if SDK not available
    if (!RewardedAd || !AdEventType || !RewardedAdEventType) {
      console.warn('[AdContext] RewardedAd SDK not available');
      return;
    }

    const adUnitId = getAdUnitId('rewarded');
    if (!adUnitId) {
      return;
    }

    // Clean up existing ad instance
    cleanupRewardedAd();

    setRewardedAdState('loading');
    rewardedAdLoadedRef.current = false;

    // Return a Promise that resolves when ad is loaded
    return new Promise<void>((resolve, reject) => {
      try {
        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });

        // Set up event listeners
        const unsubscribeLoaded = rewarded.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            rewardedAdLoadedRef.current = true;
            setRewardedAdState('loaded');
            resolve(); // Resolve when ad is loaded
          }
        );

        const unsubscribeError = rewarded.addAdEventListener(
          AdEventType.ERROR,
          (error: Error) => {
            console.error('[AdContext] Rewarded ad error:', error);
            setRewardedAdState('error');
            cleanupRewardedAd();
            reject(error); // Reject on error
          }
        );

        const unsubscribeClosed = rewarded.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            // If user closed without earning reward, resolve with false
            if (rewardCallbackRef.current) {
              rewardCallbackRef.current(false);
              rewardCallbackRef.current = null;
            }
            setRewardedAdState('idle');
            cleanupRewardedAd();
          }
        );

        const unsubscribeEarned = rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            setRewardedAdState('rewarded');
            // User earned the reward
            if (rewardCallbackRef.current) {
              rewardCallbackRef.current(true);
              rewardCallbackRef.current = null;
            }
          }
        );

        // Store reference and unsubscribers for cleanup
        rewardedAdRef.current = rewarded;
        unsubscribersRef.current = [
          unsubscribeLoaded,
          unsubscribeError,
          unsubscribeClosed,
          unsubscribeEarned,
        ];

        // Load the ad
        rewarded.load();
      } catch (error) {
        console.error('[AdContext] Failed to create rewarded ad:', error);
        setRewardedAdState('error');
        reject(error);
      }
    });
  }, [shouldShowAds, cleanupRewardedAd]);

  // Show the loaded rewarded ad
  // Uses ref instead of state to avoid stale closure issues
  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    if (!shouldShowAds) {
      return false;
    }

    // Use ref for synchronous check - avoids stale closure issues
    if (!rewardedAdLoadedRef.current || !rewardedAdRef.current) {
      console.warn('[AdContext] showRewardedAd called but ad not ready');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      // Store callback to be called when ad closes or reward earned
      rewardCallbackRef.current = resolve;
      setRewardedAdState('showing');

      try {
        rewardedAdRef.current.show();
      } catch (error) {
        console.error('[AdContext] Failed to show rewarded ad:', error);
        rewardedAdLoadedRef.current = false;
        setRewardedAdState('error');
        rewardCallbackRef.current = null;
        resolve(false);
      }
    });
  }, [shouldShowAds]);

  // Check if rewarded ad is ready
  const isRewardedAdReady = useMemo(() => {
    return rewardedAdState === 'loaded';
  }, [rewardedAdState]);

  // Context value
  const value: AdContextValue = useMemo(
    () => ({
      shouldShowAds,
      isRewardedAdReady,
      rewardedAdState,
      loadRewardedAd,
      showRewardedAd,
      grantAdUnlock,
    }),
    [
      shouldShowAds,
      isRewardedAdReady,
      rewardedAdState,
      loadRewardedAd,
      showRewardedAd,
      grantAdUnlock,
    ]
  );

  return <AdContext value={value}>{children}</AdContext>;
}

/**
 * Hook to access ad context.
 * Must be used within AdProvider.
 *
 * @throws Error if used outside of AdProvider
 */
export function useAds(): AdContextValue {
  const context = use(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if outside AdProvider.
 * Useful for components that may or may not have ad support.
 */
export function useAdsOptional(): AdContextValue | null {
  return use(AdContext);
}
