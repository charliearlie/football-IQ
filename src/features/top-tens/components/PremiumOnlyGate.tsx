/**
 * PremiumOnlyGate - Gate for premium-only game modes.
 *
 * Unlike PremiumGate which checks puzzle date, this component
 * blocks all access for non-premium users regardless of when
 * the puzzle was published.
 *
 * Used for premium-exclusive game modes like Top Tens.
 *
 * Supports ad-unlock flow: if a puzzleId is provided, checks
 * the local database for valid ad unlocks.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { getValidAdUnlocks } from '@/lib/database';
import type { UnlockedPuzzle } from '@/types/database';
import { colors } from '@/theme/colors';

/**
 * Props for the PremiumOnlyGate component.
 */
interface PremiumOnlyGateProps {
  /** The protected content to render when authorized */
  children: React.ReactNode;
  /** Optional custom loading component */
  fallback?: React.ReactNode;
  /** Optional puzzle ID to check for ad unlocks */
  puzzleId?: string;
}

/**
 * Default loading screen component.
 */
function DefaultLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.pitchGreen} />
    </View>
  );
}

/**
 * DEV ONLY: Bypass premium gate for testing on simulator.
 * Set to true to skip premium check in development.
 */
const DEV_BYPASS_PREMIUM = __DEV__ && false; // Set to false to test real premium gating

/**
 * PremiumOnlyGate - Route protection for premium-only game modes.
 *
 * Blocks all non-premium users from accessing the content, redirecting
 * them to the premium modal with a "premium_only" mode indicator.
 *
 * In development mode, set DEV_BYPASS_PREMIUM to true to skip the check.
 *
 * @example
 * ```tsx
 * // app/top-tens/index.tsx
 * export default function TopTensIndexRoute() {
 *   return (
 *     <PremiumOnlyGate>
 *       <TopTensScreen />
 *     </PremiumOnlyGate>
 *   );
 * }
 * ```
 */
export function PremiumOnlyGate({
  children,
  fallback,
  puzzleId,
}: PremiumOnlyGateProps): React.ReactElement {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();
  const hasNavigatedRef = useRef(false);

  // Load ad unlocks from database
  const [adUnlocks, setAdUnlocks] = useState<UnlockedPuzzle[] | null>(null);

  useEffect(() => {
    let active = true;
    getValidAdUnlocks()
      .then((unlocks) => {
        if (active) setAdUnlocks(unlocks);
      })
      .catch((err) => {
        console.error('[PremiumOnlyGate] Failed to load unlocks', err);
        if (active) setAdUnlocks([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // In dev mode with bypass enabled, treat user as premium
  const isPremium = DEV_BYPASS_PREMIUM || (profile?.is_premium ?? false);

  // Check if this puzzle is ad-unlocked
  const areAdUnlocksLoaded = adUnlocks !== null;
  const isAdUnlocked = puzzleId
    ? (adUnlocks?.some((u) => u.puzzle_id === puzzleId) ?? false)
    : false;

  // User has access if premium OR ad-unlocked
  const hasAccess = isPremium || isAdUnlocked;
  const isLoading = authLoading || !areAdUnlocksLoaded;

  // Redirect non-premium users to premium modal
  useEffect(() => {
    if (hasNavigatedRef.current || isLoading) return;

    if (!hasAccess) {
      hasNavigatedRef.current = true;
      router.push({
        pathname: '/premium-modal',
        params: { mode: 'premium_only' },
      });
    }
  }, [hasAccess, isLoading, router]);

  // Reset navigation guard when user gains access
  useEffect(() => {
    if (hasAccess && !isLoading) {
      hasNavigatedRef.current = false;
    }
  }, [hasAccess, isLoading]);

  // Show loading while checking auth/unlocks or redirecting
  if (isLoading || !hasAccess) {
    return <>{fallback ?? <DefaultLoadingScreen />}</>;
  }

  // User has access - render protected content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
