/**
 * Ad Feature Types
 *
 * Type definitions for the ad monetization system including
 * banner ads, rewarded ads, and ad-to-unlock functionality.
 */

import { UnlockedPuzzle } from '@/types/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Ad unit types supported by the app.
 */
export type AdUnitType = 'banner' | 'rewarded';

/**
 * State of a rewarded ad.
 */
export type RewardedAdState =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'showing'
  | 'rewarded'
  | 'closed'
  | 'error';

/**
 * State machine for the UnlockChoiceModal.
 */
export type UnlockChoiceState =
  | 'idle' // Initial state, showing two options
  | 'loading_ad' // Loading rewarded ad
  | 'showing_ad' // Ad is being displayed
  | 'ad_success' // Ad completed, unlock granted
  | 'redirecting' // Transition buffer before navigation
  | 'ad_error' // Ad failed to load/show
  | 'premium_flow'; // Delegated to PremiumUpsellModal

/**
 * Ad context value provided by AdProvider.
 */
export interface AdContextValue {
  /** Whether ads should be shown (false if premium) */
  shouldShowAds: boolean;

  /** Whether a rewarded ad is ready to show */
  isRewardedAdReady: boolean;

  /** Current state of the rewarded ad */
  rewardedAdState: RewardedAdState;

  /** Load a rewarded ad */
  loadRewardedAd: () => Promise<void>;

  /** Show the loaded rewarded ad. Returns true if user earned reward. */
  showRewardedAd: () => Promise<boolean>;

  /** Grant an ad unlock for a puzzle (saves to database only, no state updates) */
  grantAdUnlock: (puzzleId: string) => Promise<void>;
}

/**
 * Props for the AdBanner component.
 */
export interface AdBannerProps {
  /** Position in the screen layout */
  position?: 'top' | 'bottom';
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the UnlockChoiceModal component.
 */
export interface UnlockChoiceModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Puzzle ID being unlocked */
  puzzleId: string;
  /** Puzzle date for display (YYYY-MM-DD) */
  puzzleDate: string;
  /** Game mode for navigation after unlock */
  gameMode: GameMode;
  /** Callback when unlock succeeds (for parent to refresh data) */
  /** Callback when unlock succeeds (for parent to refresh data) */
  onUnlockSuccess?: () => void;
  /** Whether to automatically trigger the ad flow on mount */
  autoTriggerAd?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Props for the PremiumUpsellBanner component (Home screen).
 */
export interface PremiumUpsellBannerProps {
  /** Callback when banner is pressed */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Rewarded ad callback types.
 */
export interface RewardedAdCallbacks {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
  onUserEarnedReward?: (reward: { type: string; amount: number }) => void;
}
