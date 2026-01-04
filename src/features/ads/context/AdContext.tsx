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
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/features/auth';
import { UnlockedPuzzle } from '@/types/database';
import { getValidAdUnlocks, saveAdUnlock } from '@/lib/database';
import { isPuzzleInUnlocks } from '../services/adUnlockService';
import { AdContextValue, RewardedAdState } from '../types/ads.types';
import { isAdsSupportedPlatform } from '../config/adUnits';

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

  // Load a rewarded ad (placeholder - will be implemented with actual SDK)
  const loadRewardedAd = useCallback(async (): Promise<void> => {
    if (!shouldShowAds) {
      return;
    }

    // Skip on unsupported platforms
    if (Platform.OS === 'web') {
      return;
    }

    setRewardedAdState('loading');

    try {
      // TODO: Implement actual rewarded ad loading with react-native-google-mobile-ads
      // For now, simulate loading
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRewardedAdState('loaded');
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      setRewardedAdState('error');
    }
  }, [shouldShowAds]);

  // Show the loaded rewarded ad
  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    if (!shouldShowAds || rewardedAdState !== 'loaded') {
      return false;
    }

    setRewardedAdState('showing');

    try {
      // TODO: Implement actual rewarded ad showing with react-native-google-mobile-ads
      // For now, simulate watching ad
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRewardedAdState('rewarded');

      // Reset state after reward
      setTimeout(() => setRewardedAdState('idle'), 500);

      return true; // User earned reward
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      setRewardedAdState('error');
      return false;
    }
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
