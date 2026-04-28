/**
 * LastTensGate - Soft gate for the Last 10 game mode.
 *
 * Last 10 is a discovery-driven feature: every user gets one free play (their
 * "intro"), and after that the mode requires premium. Users can always resume
 * the puzzle they used their free play on, so an in-progress puzzle is never
 * orphaned by the gate.
 *
 * Access matrix:
 * - Premium → always allowed
 * - Non-premium with zero last_tens attempts → allowed (free intro)
 * - Non-premium with attempts on this puzzle → allowed (resume)
 * - Non-premium with attempts on a different puzzle → blocked → archive paywall
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { getDatabase } from '@/lib/database';
import { colors } from '@/theme/colors';

interface LastTensGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Specific puzzle ID for resume detection. Omit for today's puzzle. */
  puzzleId?: string;
}

const DEV_BYPASS_PREMIUM = __DEV__ && false;

interface AttemptCheck {
  hasAnyAttempt: boolean;
  hasAttemptOnThisPuzzle: boolean;
}

export function LastTensGate({
  children,
  fallback,
  puzzleId,
}: LastTensGateProps): React.ReactElement {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();
  const hasNavigatedRef = useRef(false);

  const [attemptCheck, setAttemptCheck] = useState<AttemptCheck | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAttempts() {
      try {
        const database = getDatabase();
        // Count last_tens attempts overall and on this specific puzzle.
        const rows = await database.getAllAsync<{
          total: number;
          this_puzzle: number;
        }>(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN a.puzzle_id = ? THEN 1 ELSE 0 END) AS this_puzzle
           FROM attempts a
           JOIN puzzles p ON a.puzzle_id = p.id
           WHERE p.game_mode = 'last_tens'`,
          [puzzleId ?? '']
        );
        const row = rows[0];
        if (!active) return;
        setAttemptCheck({
          hasAnyAttempt: (row?.total ?? 0) > 0,
          hasAttemptOnThisPuzzle: (row?.this_puzzle ?? 0) > 0,
        });
      } catch (err) {
        console.warn('[LastTensGate] Failed to query attempts', err);
        // Optimistic: allow on first ever load if the query fails.
        if (active) {
          setAttemptCheck({ hasAnyAttempt: false, hasAttemptOnThisPuzzle: false });
        }
      }
    }

    checkAttempts();
    return () => {
      active = false;
    };
  }, [puzzleId]);

  const isPremium = DEV_BYPASS_PREMIUM || (profile?.is_premium ?? false);
  const isLoading = authLoading || attemptCheck === null;

  const hasAccess =
    isPremium ||
    !attemptCheck ||
    !attemptCheck.hasAnyAttempt ||
    attemptCheck.hasAttemptOnThisPuzzle;

  useEffect(() => {
    if (hasNavigatedRef.current || isLoading) return;
    if (!hasAccess) {
      hasNavigatedRef.current = true;
      router.replace({
        pathname: '/(tabs)/archive',
        params: {
          showUnlock: 'true',
          unlockPuzzleId: puzzleId ?? '',
          unlockGameMode: 'last_tens',
        },
      });
    }
  }, [hasAccess, isLoading, router, puzzleId]);

  useEffect(() => {
    if (hasAccess && !isLoading) {
      hasNavigatedRef.current = false;
    }
  }, [hasAccess, isLoading]);

  if (isLoading || !hasAccess) {
    return <>{fallback ?? <DefaultLoadingScreen />}</>;
  }

  return <>{children}</>;
}

function DefaultLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.pitchGreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
