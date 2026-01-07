/**
 * PremiumGate HOC
 *
 * Defense-in-depth wrapper for [puzzleId].tsx routes.
 * Protects against unauthorized deep-links (e.g., shared URLs, bookmarks).
 *
 * Checks:
 * 1. If puzzle exists (RLS may have blocked it)
 * 2. If user has access based on premium status and puzzle date
 *
 * If unauthorized, navigates to the premium modal and goes back when closed.
 */

import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePuzzle } from '@/features/puzzles/hooks/usePuzzle';
import { isPuzzleLocked } from '@/features/archive/utils/dateGrouping';
import { colors } from '@/theme/colors';

/**
 * Props for the PremiumGate component.
 */
interface PremiumGateProps {
  /** The puzzle ID from the route parameter */
  puzzleId: string;
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
 * PremiumGate - Route protection component.
 *
 * Wraps puzzle screens to enforce premium access at the route level.
 * This provides defense-in-depth against unauthorized deep-links.
 *
 * @example
 * ```tsx
 * // app/career-path/[puzzleId].tsx
 * export default function CareerPathRoute() {
 *   const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
 *
 *   return (
 *     <PremiumGate puzzleId={puzzleId}>
 *       <CareerPathScreen puzzleId={puzzleId} />
 *     </PremiumGate>
 *   );
 * }
 * ```
 */
export function PremiumGate({
  puzzleId,
  children,
  fallback,
}: PremiumGateProps): React.ReactElement {
  const router = useRouter();
  const { profile, isLoading: isAuthLoading } = useAuth();
  const { puzzle, isLoading: isPuzzleLoading } = usePuzzle(puzzleId);

  // Guard against re-triggering navigation
  const hasNavigatedRef = useRef(false);

  const isPremium = profile?.is_premium ?? false;
  const isLoading = isAuthLoading || isPuzzleLoading;

  // Check premium access using client-side logic
  const isLocked = !isLoading && puzzle && isPuzzleLocked(puzzle.puzzle_date, isPremium);
  const isMissing = !isLoading && !puzzle;

  // Navigate to premium modal when blocked (missing or locked puzzle)
  // Uses push instead of replace to preserve navigation history
  useEffect(() => {
    // Guard: only navigate once to prevent infinite loops
    if (hasNavigatedRef.current) return;

    if (isMissing) {
      hasNavigatedRef.current = true;
      router.push({
        pathname: '/premium-modal',
        params: { mode: 'blocked' },
      });
    } else if (isLocked && puzzle) {
      hasNavigatedRef.current = true;
      router.push({
        pathname: '/premium-modal',
        params: { puzzleDate: puzzle.puzzle_date, mode: 'blocked' },
      });
    }
  }, [isMissing, isLocked, puzzle, router]);

  // Reset navigation guard when user becomes authorized (e.g., premium upgrade)
  useEffect(() => {
    if (!isLocked && !isMissing && !isLoading) {
      hasNavigatedRef.current = false;
    }
  }, [isLocked, isMissing, isLoading]);

  // Handle loading state or blocked state (show loading while redirecting)
  if (isLoading || isMissing || isLocked) {
    return <>{fallback ?? <DefaultLoadingScreen />}</>;
  }

  // User is authorized - render protected content
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
