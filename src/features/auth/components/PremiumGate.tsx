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
 * If unauthorized, shows the PremiumUpsellModal instead of the game screen.
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePuzzle } from '@/features/puzzles/hooks/usePuzzle';
import { isPuzzleLocked } from '@/features/archive/utils/dateGrouping';
import { PremiumUpsellModal } from '@/features/archive/components/PremiumUpsellModal';
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

  const isPremium = profile?.is_premium ?? false;
  const isLoading = isAuthLoading || isPuzzleLoading;

  // Handle loading state
  if (isLoading) {
    return <>{fallback ?? <DefaultLoadingScreen />}</>;
  }

  // Handle missing puzzle (RLS may have blocked it, or invalid ID)
  if (!puzzle) {
    return (
      <PremiumUpsellModal
        visible={true}
        onClose={() => router.back()}
        mode="blocked"
        testID="premium-gate-blocked"
      />
    );
  }

  // Check premium access using client-side logic
  const isLocked = isPuzzleLocked(puzzle.puzzle_date, isPremium);

  if (isLocked) {
    return (
      <PremiumUpsellModal
        visible={true}
        onClose={() => router.back()}
        puzzleDate={puzzle.puzzle_date}
        mode="locked"
        testID="premium-gate-locked"
      />
    );
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
