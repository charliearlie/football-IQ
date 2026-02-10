/**
 * AdBanner Component
 *
 * Displays a banner ad at the bottom of game screens for non-premium users.
 * Returns null for premium users, web platform, or if ads are not supported.
 *
 * Uses Google AdMob's adaptive banner which automatically sizes to fit
 * the device width while maintaining proper aspect ratio.
 */

import React, { useState, ComponentType } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdUnitId, isAdsSupportedPlatform } from '../config/adUnits';
import { useAdsOptional } from '../context/AdContext';
import { AdBannerProps } from '../types/ads.types';
import { colors } from '@/theme';

/**
 * Props for the BannerAd component from react-native-google-mobile-ads.
 * Defined locally to avoid importing the module on unsupported platforms.
 */
interface BannerAdProps {
  unitId: string;
  size: string;
  requestOptions?: {
    requestNonPersonalizedAdsOnly?: boolean;
  };
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
}

/**
 * BannerAdSize constants from react-native-google-mobile-ads.
 */
interface BannerAdSizeType {
  ANCHORED_ADAPTIVE_BANNER: string;
  BANNER: string;
  LARGE_BANNER: string;
  MEDIUM_RECTANGLE: string;
  FULL_BANNER: string;
  LEADERBOARD: string;
}

// Conditionally import AdMob components only on native platforms
let BannerAd: ComponentType<BannerAdProps> | null = null;
let BannerAdSize: BannerAdSizeType | null = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require('react-native-google-mobile-ads') as {
      BannerAd: ComponentType<BannerAdProps>;
      BannerAdSize: BannerAdSizeType;
    };
    BannerAd = mobileAds.BannerAd;
    BannerAdSize = mobileAds.BannerAdSize;
  } catch {
    // Module not available, ads will be disabled
  }
}

/**
 * AdBanner - Banner ad component for game screens.
 *
 * @example
 * ```tsx
 * <View style={styles.container}>
 *   <GameContent />
 *   <AdBanner testID="game-ad-banner" />
 * </View>
 * ```
 */
export function AdBanner({ position = 'bottom', testID }: AdBannerProps) {
  const insets = useSafeAreaInsets();
  const ads = useAdsOptional();
  const [_adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't show if ads are not supported or user is premium
  if (!isAdsSupportedPlatform()) {
    return null;
  }

  // Don't show if AdProvider is not available or user is premium
  if (!ads || !ads.shouldShowAds) {
    return null;
  }

  // Don't show if BannerAd component is not available
  if (!BannerAd || !BannerAdSize) {
    return null;
  }

  const adUnitId = getAdUnitId('banner');
  if (!adUnitId) {
    return null;
  }

  // Calculate container style based on position
  const containerStyle = [
    styles.container,
    position === 'bottom' && { paddingBottom: insets.bottom },
    position === 'top' && { paddingTop: insets.top },
    // Hide container if ad failed to load
    adError && styles.hidden,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
          setAdError(false);
        }}
        onAdFailedToLoad={(error: Error) => {
          console.warn('[AdBanner] Failed to load:', error.message);
          setAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 70,
    overflow: 'hidden',
    backgroundColor: colors.stadiumNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
});
