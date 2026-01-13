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
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/features/auth';
import { UnlockedPuzzle } from '@/types/database';
import { getValidAdUnlocks, saveAdUnlock } from '@/lib/database';
import { isPuzzleInUnlocks } from '../services/adUnlockService';
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

  // Ad unlocks state
  const [adUnlocks, setAdUnlocks] = useState<UnlockedPuzzle[]>([]);
  const [isLoadingUnlocks, setIsLoadingUnlocks] = useState(true);

  // Rewarded ad state
  const [rewardedAdState, setRewardedAdState] = useState<RewardedAdState>('idle');

  // Refs for rewarded ad instance and callback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewardedAdRef = useRef<any>(null);
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

  // Load ad unlocks from database
  const refreshAdUnlocks = useCallback(async () => {
    try {
      // Get all unlocks (permanent - no expiry)
      const unlocks = await getValidAdUnlocks();
      setAdUnlocks(unlocks);
    } catch (error) {
      console.error('Failed to load ad unlocks:', error);
    } finally {
      setIsLoadingUnlocks(false);
    }
  }, []);

  // Initial load of ad unlocks
  useEffect(() => {
    refreshAdUnlocks();
  }, [refreshAdUnlocks]);

  // Refresh ad unlocks when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshAdUnlocks();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshAdUnlocks]);

  // Cleanup rewarded ad on unmount
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      rewardedAdRef.current = null;
    };
  }, []);

  // Check if a specific puzzle is ad-unlocked
  const isAdUnlockedPuzzle = useCallback(
    (puzzleId: string): boolean => {
      return isPuzzleInUnlocks(puzzleId, adUnlocks);
    },
    [adUnlocks]
  );

  // Grant an ad unlock for a puzzle
  const grantAdUnlock = useCallback(
    async (puzzleId: string): Promise<void> => {
      try {
        await saveAdUnlock(puzzleId);
        await refreshAdUnlocks();
      } catch (error) {
        console.error('Failed to grant ad unlock:', error);
        throw error;
      }
    },
    [refreshAdUnlocks]
  );

  // Clean up rewarded ad listeners
  const cleanupRewardedAd = useCallback(() => {
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];
    rewardedAdRef.current = null;
  }, []);

  // Load a rewarded ad using the actual SDK
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

    try {
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      // Set up event listeners
      const unsubscribeLoaded = rewarded.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          setRewardedAdState('loaded');
        }
      );

      const unsubscribeError = rewarded.addAdEventListener(
        AdEventType.ERROR,
        (error: Error) => {
          console.error('[AdContext] Rewarded ad error:', error);
          setRewardedAdState('error');
          cleanupRewardedAd();
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
    }
  }, [shouldShowAds, cleanupRewardedAd]);

  // Show the loaded rewarded ad
  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    if (!shouldShowAds || rewardedAdState !== 'loaded') {
      return false;
    }

    if (!rewardedAdRef.current) {
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
        setRewardedAdState('error');
        rewardCallbackRef.current = null;
        resolve(false);
      }
    });
  }, [shouldShowAds, rewardedAdState]);

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
      adUnlocks,
      isAdUnlockedPuzzle,
      grantAdUnlock,
      refreshAdUnlocks,
    }),
    [
      shouldShowAds,
      isRewardedAdReady,
      rewardedAdState,
      loadRewardedAd,
      showRewardedAd,
      adUnlocks,
      isAdUnlockedPuzzle,
      grantAdUnlock,
      refreshAdUnlocks,
    ]
  );

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

/**
 * Hook to access ad context.
 * Must be used within AdProvider.
 *
 * @throws Error if used outside of AdProvider
 */
export function useAds(): AdContextValue {
  const context = useContext(AdContext);
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
  return useContext(AdContext);
}
