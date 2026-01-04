/**
 * Ads Feature Module
 *
 * Provides ad monetization functionality including:
 * - Banner ads on game screens (non-premium users only)
 * - Rewarded ads for unlocking archived puzzles
 * - Premium upsell banner on Home screen
 * - Ad unlock tracking with 24-hour expiry
 */

// Types
export * from './types/ads.types';

// Config
export { getAdUnitId, isAdsSupportedPlatform, ADMOB_APP_IDS } from './config/adUnits';

// Services
export {
  grantPuzzleUnlock,
  checkPuzzleUnlock,
  getAllValidUnlocks,
  isPuzzleInUnlocks,
  revokePuzzleUnlock,
  clearAllUnlocks,
  getUnlockTimeRemaining,
} from './services/adUnlockService';

// Context
export { AdProvider, useAds, useAdsOptional } from './context/AdContext';

// Hooks (to be implemented)
// export { useAdUnlock } from './hooks/useAdUnlock';
// export { useRewardedAd } from './hooks/useRewardedAd';

// Components
export { UnlockChoiceModal } from './components/UnlockChoiceModal';
export { AdBanner } from './components/AdBanner';
export { PremiumUpsellBanner } from './components/PremiumUpsellBanner';
