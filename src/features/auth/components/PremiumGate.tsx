/**
 * PremiumGate HOC
 *
 * Defense-in-depth wrapper for [puzzleId].tsx routes.
 * Protects against unauthorized deep-links (e.g., shared URLs, bookmarks).
 *
 * SIMPLIFIED IMPLEMENTATION:
 * - Prioritizes speed and stability over strict date checking for potential unauthorized users.
 * - If user is premium or ad-unlocked (checked via DB), access is immediate.
 * - Only checks remote puzzle date (which requires fetch) if basic checks fail.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { isPuzzleLocked, isWithinFreeWindow } from '@/features/archive/utils/dateGrouping';
import { getValidAdUnlocks, getPuzzle } from '@/lib/database';
import type { UnlockedPuzzle, ParsedLocalPuzzle } from '@/types/database';
import { colors } from '@/theme/colors';

interface PremiumGateProps {
  puzzleId: string;
  puzzleDate?: string; // NEW: Passed from navigation params for sync check
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function DefaultLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.pitchGreen} />
    </View>
  );
}

export function PremiumGate({
  puzzleId,
  puzzleDate: initialPuzzleDate,
  children,
  fallback,
}: PremiumGateProps): React.ReactElement {
  const router = useRouter();
  const { profile, isLoading: isAuthLoading } = useAuth();
  
  // State for ad unlocks - fetched from local DB
  const [adUnlocks, setAdUnlocks] = useState<UnlockedPuzzle[] | null>(null);
  
  // State for puzzle metadata - only needed if checks fail and we don't have date
  const [fetchedPuzzleDate, setFetchedPuzzleDate] = useState<string | null>(null);
  const [isPuzzleLoading, setIsPuzzleLoading] = useState(false);

  // Track if we've already navigated to avoid loops
  const hasNavigatedRef = useRef(false);

  // 1. Load Ad Unlocks immediately
  useEffect(() => {
    let active = true;
    getValidAdUnlocks()
      .then(unlocks => {
        if (active) setAdUnlocks(unlocks);
      })
      .catch(err => {
        console.error('[PremiumGate] Failed to load unlocks', err);
        if (active) setAdUnlocks([]);
      });
    return () => { active = false; };
  }, []);

  const isPremium = profile?.is_premium ?? false;
  // If adUnlocks is null, we are still loading. If array, we are loaded.
  const areAdUnlocksLoaded = adUnlocks !== null;
  const isAdUnlocked = adUnlocks?.some(u => u.puzzle_id === puzzleId) ?? false;
  
  // Use passed date or fetched date
  const puzzleDate = initialPuzzleDate || fetchedPuzzleDate;
  
  // 2. Authorization Logic (Synchronous & Async)
  // Check fast access conditions
  const isWithinFreeWindowCheck = puzzleDate ? isWithinFreeWindow(puzzleDate) : false;
  
  // Immediate Access if:
  // - Premium User
  // - Ad Unlocked (locally verified)
  // - Recent Puzzle (verified synchronously via prop)
  const canAccessFast = 
    areAdUnlocksLoaded && (isPremium || isAdUnlocked || isWithinFreeWindowCheck);

  // 3. Slow Path: Fetch Metadata if needed
  // Only fetch if we can't determine access synchronously and we don't have the date
  useEffect(() => {
    if (!areAdUnlocksLoaded) return;
    if (canAccessFast) return;
    if (puzzleDate) return; // We have date (passed or fetched), no need to fetch again
    if (isPuzzleLoading) return;

    setIsPuzzleLoading(true);
    getPuzzle(puzzleId)
      .then(p => {
        if (p) setFetchedPuzzleDate(p.puzzle_date);
        else console.warn('[PremiumGate] Puzzle not found for date check', puzzleId);
      })
      .catch(e => console.error('[PremiumGate] Puzzle fetch failed', e))
      .finally(() => setIsPuzzleLoading(false));

  }, [areAdUnlocksLoaded, canAccessFast, puzzleDate, isPuzzleLoading, puzzleId]);

  // 4. Decision Logic
  const isLoading = 
    isAuthLoading || 
    !areAdUnlocksLoaded || 
    (!canAccessFast && !puzzleDate && isPuzzleLoading);

  // Logic implies:
  // - If fast access -> render immediately
  // - If missing date -> wait for fetch
  // - If date known but locked -> redirect

  const isLocked = !canAccessFast && puzzleDate && isPuzzleLocked(
    puzzleDate,
    false, // isPremium checked in canAccessFast
    puzzleId,
    adUnlocks || []
  );

  const isMissing = !canAccessFast && !isPuzzleLoading && !puzzleDate;

  // 5. Navigation Side Effect
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (isLoading) return;

    if (isMissing) {
       console.log('[PremiumGate] Blocking: Missing puzzle');
       hasNavigatedRef.current = true;
       router.push({ pathname: '/premium-modal', params: { mode: 'blocked' } });
    } else if (isLocked) {
       console.log('[PremiumGate] Blocking: Locked puzzle');
       hasNavigatedRef.current = true;
       router.push({ 
         pathname: '/premium-modal', 
         params: { puzzleDate: puzzleDate!, mode: 'blocked' } 
       });
    }
  }, [isLoading, isMissing, isLocked, router, puzzleDate]);

  // Render
  if (canAccessFast) {
    return <>{children}</>;
  }

  if (isLoading || isMissing || isLocked) {
    return <>{fallback ?? <DefaultLoadingScreen />}</>;
  }

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
