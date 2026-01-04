/**
 * AdMob Unit IDs Configuration
 *
 * Contains test and production ad unit IDs for iOS and Android.
 * Test IDs are used in development (__DEV__), production IDs in release builds.
 */

import { Platform } from 'react-native';
import { AdUnitType } from '../types/ads.types';

/**
 * AdMob test ad unit IDs.
 * These are Google's official test IDs that always return test ads.
 * @see https://developers.google.com/admob/android/test-ads
 * @see https://developers.google.com/admob/ios/test-ads
 */
const TEST_AD_UNIT_IDS = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  rewarded: {
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
  },
} as const;

/**
 * Production ad unit IDs.
 * These should be created in the AdMob console for Football IQ app.
 * TODO: Replace with actual production ad unit IDs once created.
 */
const PRODUCTION_AD_UNIT_IDS = {
  banner: {
    // TODO: Create banner ad units in AdMob console
    ios: 'ca-app-pub-9426782115883407/BANNER_IOS',
    android: 'ca-app-pub-9426782115883407/BANNER_ANDROID',
  },
  rewarded: {
    // TODO: Create rewarded ad units in AdMob console
    ios: 'ca-app-pub-9426782115883407/REWARDED_IOS',
    android: 'ca-app-pub-9426782115883407/REWARDED_ANDROID',
  },
} as const;

/**
 * Get the appropriate ad unit ID for the current environment and platform.
 *
 * @param type - The type of ad unit ('banner' or 'rewarded')
 * @returns The ad unit ID string, or null if platform is not supported
 *
 * @example
 * ```typescript
 * const bannerId = getAdUnitId('banner');
 * const rewardedId = getAdUnitId('rewarded');
 * ```
 */
export function getAdUnitId(type: AdUnitType): string | null {
  // Only iOS and Android are supported
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }

  const platform = Platform.OS as 'ios' | 'android';
  const adUnitIds = __DEV__ ? TEST_AD_UNIT_IDS : PRODUCTION_AD_UNIT_IDS;

  return adUnitIds[type][platform];
}

/**
 * Check if ads are supported on the current platform.
 */
export function isAdsSupportedPlatform(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * AdMob App IDs (configured in app.json).
 * Included here for reference.
 */
export const ADMOB_APP_IDS = {
  ios: 'ca-app-pub-9426782115883407~8797195643',
  android: 'ca-app-pub-9426782115883407~1712062487',
} as const;
