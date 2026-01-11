/**
 * PremiumOnlyGate - Gate for premium-only game modes.
 *
 * Unlike PremiumGate which checks puzzle date, this component
 * blocks all access for non-premium users regardless of when
 * the puzzle was published.
 *
 * Used for premium-exclusive game modes like Top Tens.
 */

import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';

/**
 * Props for the PremiumOnlyGate component.
 */
interface PremiumOnlyGateProps {
  /** The protected content to render when authorized */
  children: React.ReactNode;
  /** Optional custom loading component */
  fallback?: React.ReactNode;
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
const DEV_BYPASS_PREMIUM = __DEV__ && true; // Set to false to test real premium gating

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
}: PremiumOnlyGateProps): React.ReactElement {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const hasNavigatedRef = useRef(false);

  // In dev mode with bypass enabled, treat user as premium
  const isPremium = DEV_BYPASS_PREMIUM || (profile?.is_premium ?? false);

  // Redirect non-premium users to premium modal
  useEffect(() => {
    if (hasNavigatedRef.current || isLoading) return;

    if (!isPremium) {
      hasNavigatedRef.current = true;
      router.push({
        pathname: '/premium-modal',
        params: { mode: 'premium_only' },
      });
    }
  }, [isPremium, isLoading, router]);

  // Reset navigation guard when user becomes premium
  useEffect(() => {
    if (isPremium && !isLoading) {
      hasNavigatedRef.current = false;
    }
  }, [isPremium, isLoading]);

  // Show loading while checking auth or redirecting
  if (isLoading || !isPremium) {
    return <>{fallback ?? <DefaultLoadingScreen />}</>;
  }

  // User is premium - render protected content
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
