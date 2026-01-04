/**
 * AdBanner Component
 *
 * Displays a banner ad at the bottom of game screens for non-premium users.
 * Returns null for premium users, web platform, or if ads are not supported.
 *
 * Uses Google AdMob's adaptive banner which automatically sizes to fit
 * the device width while maintaining proper aspect ratio.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdUnitId, isAdsSupportedPlatform } from '../config/adUnits';
import { useAdsOptional } from '../context/AdContext';
import { AdBannerProps } from '../types/ads.types';
import { colors, spacing } from '@/theme';

// Conditionally import AdMob components only on native platforms
let BannerAd: any = null;
let BannerAdSize: any = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    const mobileAds = require('react-native-google-mobile-ads');
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
  const [adLoaded, setAdLoaded] = useState(false);
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
    backgroundColor: colors.stadiumNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
});
