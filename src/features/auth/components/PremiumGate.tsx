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

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePuzzle } from '@/features/puzzles/hooks/usePuzzle';
import { isPuzzleLocked } from '@/features/archive/utils/dateGrouping';
import { getValidAdUnlocks } from '@/lib/database';
import type { UnlockedPuzzle } from '@/types/database';
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

  // Local state for ad unlocks (fetched directly from database)
  const [adUnlocks, setAdUnlocks] = useState<UnlockedPuzzle[]>([]);
  const [isLoadingUnlocks, setIsLoadingUnlocks] = useState(true);

  // Guard against re-triggering navigation
  const hasNavigatedRef = useRef(false);

  const isPremium = profile?.is_premium ?? false;
  const isLoading = isAuthLoading || isPuzzleLoading || isLoadingUnlocks;

  // Fetch ad unlocks directly from database
  useEffect(() => {
    const fetchUnlocks = async () => {
      try {
        const unlocks = await getValidAdUnlocks();
        setAdUnlocks(unlocks);
      } catch (error) {
        console.error('[PremiumGate] Failed to load ad unlocks:', error);
      } finally {
        setIsLoadingUnlocks(false);
      }
    };
    fetchUnlocks();
  }, []);

  // Check if puzzle is ad-unlocked (doesn't require puzzle data from context)
  const isAdUnlocked = adUnlocks?.some(u => u.puzzle_id === puzzleId) ?? false;

  // Check premium access using client-side logic
  // Pass puzzleId and adUnlocks to check for ad-unlocked puzzles
  // CRITICAL: Ad-unlocked puzzles are never locked, even if puzzle data is missing
  const isLocked = !isLoading && puzzle && !isAdUnlocked && isPuzzleLocked(
    puzzle.puzzle_date,
    isPremium,
    puzzleId,
    adUnlocks
  );
  // CRITICAL: Don't treat ad-unlocked puzzles as "missing" even if not in PuzzleContext
  // (Archive puzzles aren't in PuzzleContext - only today's puzzles are)
  const isMissing = !isLoading && !puzzle && !isAdUnlocked;

  // Diagnostic logging
  console.log('[PremiumGate] Check:', {
    puzzleId,
    puzzleDate: puzzle?.puzzle_date,
    isPremium,
    adUnlocksCount: adUnlocks?.length ?? 0,
    isAdUnlocked,
    isLocked,
    isMissing,
  });

  // Navigate to premium modal when blocked (missing or locked puzzle)
  // Uses push instead of replace to preserve navigation history
  useEffect(() => {
    // Guard: only navigate once to prevent infinite loops
    if (hasNavigatedRef.current) return;

    // NEVER navigate away if puzzle is ad-unlocked - let the puzzle screen handle missing state
    // This fixes race condition where SQLite fetch completes after PremiumGate renders
    if (isAdUnlocked) {
      return;
    }

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
  }, [isMissing, isLocked, puzzle, router, isAdUnlocked]);

  // NOTE: Previously had a useEffect to reset hasNavigatedRef when user becomes authorized.
  // This was REMOVED because it caused race conditions with ad unlocks - the guard would
  // reset while puzzle was still loading, causing infinite re-render loops and app freeze.
  // The guard doesn't need to reset because:
  // - Premium upgrade: user navigates back, component remounts with fresh ref
  // - Ad unlock: user navigates from archive screen, this is a fresh mount

  // Handle loading state or blocked state (show loading while redirecting)
  // EXCEPTION: Don't show loading screen for ad-unlocked puzzles - let puzzle screen handle it
  // This fixes race condition where PremiumGate finishes loading but puzzle is still fetching from SQLite
  if ((isLoading || isMissing || isLocked) && !isAdUnlocked) {
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
