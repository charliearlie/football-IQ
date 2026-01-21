import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/features/auth';
import { getAllPuzzles } from '@/lib/database';
import { onMidnight } from '@/lib/time';
import { syncPuzzlesFromSupabase } from '../services/puzzleSyncService';
import { syncAttemptsToSupabase } from '../services/attemptSyncService';
import { syncCatalogFromSupabase } from '@/features/archive/services/catalogSyncService';
import { performLightSync } from '../services/puzzleLightSyncService';
import {
  PuzzleContextValue,
  SyncStatus,
  SyncResult,
  ParsedLocalPuzzle,
} from '../types/puzzle.types';

const LAST_SYNC_KEY = '@puzzles_last_synced_at';

const PuzzleContext = createContext<PuzzleContextValue | null>(null);

interface PuzzleProviderProps {
  children: React.ReactNode;
}

/**
 * Provides puzzle state and sync functionality to the app.
 *
 * On mount:
 * 1. Loads cached puzzles from SQLite
 * 2. Loads lastSyncedAt from AsyncStorage
 * 3. Triggers sync with Supabase (if user is authenticated)
 */
export function PuzzleProvider({ children }: PuzzleProviderProps) {
  // State
  const [puzzles, setPuzzles] = useState<ParsedLocalPuzzle[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Toast state for puzzle update notifications
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [updatedPuzzleCount, setUpdatedPuzzleCount] = useState(0);

  // Get auth context for user info
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;
  const isPremium = profile?.is_premium ?? false;

  // Track which user we've synced for to prevent re-syncing on callback recreation
  const syncedForUserRef = useRef<string | null>(null);

  // Light sync cooldown and AppState tracking
  const lastLightSyncAtRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const LIGHT_SYNC_COOLDOWN_MS = 30000; // 30 seconds

  /**
   * Refresh puzzles from local SQLite database.
   */
  const refreshLocalPuzzles = useCallback(async (): Promise<void> => {
    try {
      const localPuzzles = await getAllPuzzles();
      setPuzzles(localPuzzles);
    } catch (err) {
      console.error('Failed to load local puzzles:', err);
      // Don't set error state - this is a silent refresh
    }
  }, []);

  /**
   * Sync puzzles from Supabase to local SQLite.
   */
  const syncPuzzles = useCallback(async (): Promise<SyncResult> => {
    setSyncStatus('syncing');
    setError(null);

    try {
      const result = await syncPuzzlesFromSupabase({
        userId,
        isPremium,
        lastSyncedAt,
      });

      if (result.success) {
        setSyncStatus('success');

        // Update last synced timestamp
        const timestamp = new Date().toISOString();
        setLastSyncedAt(timestamp);
        await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp);

        // Sync puzzle catalog for Archive screen (runs in parallel, non-blocking)
        syncCatalogFromSupabase().catch((err) => {
          console.warn('Catalog sync failed:', err);
        });

        // Refresh local puzzles to reflect new data
        await refreshLocalPuzzles();
      } else {
        setSyncStatus('error');
        setError(result.error ?? null);
      }

      return result;
    } catch (err) {
      setSyncStatus('error');
      const syncError = err as Error;
      setError(syncError);
      return { success: false, error: syncError };
    }
  }, [userId, isPremium, lastSyncedAt, refreshLocalPuzzles]);

  /**
   * Sync local attempts to Supabase.
   * Supports both authenticated and anonymous users.
   * Requires userId to be available (auth must be initialized).
   */
  const syncAttempts = useCallback(async (): Promise<SyncResult> => {
    try {
      // Guard: Don't sync if auth hasn't provided a user ID yet
      // Anonymous users via signInAnonymously() have a persistent user.id
      if (!userId) {
        if (__DEV__) {
          console.log('[PuzzleContext] Skipping attempt sync - no user ID available');
        }
        return { success: true, syncedCount: 0 };
      }
      const result = await syncAttemptsToSupabase(userId);
      return result;
    } catch (err) {
      return { success: false, error: err as Error };
    }
  }, [userId]);

  /**
   * Perform a light sync to detect stale puzzles.
   * Uses cooldown to prevent rapid-fire checks on quick foreground/background cycles.
   */
  const doLightSync = useCallback(async () => {
    const now = Date.now();
    if (now - lastLightSyncAtRef.current < LIGHT_SYNC_COOLDOWN_MS) {
      console.log('[PuzzleContext] Light sync skipped (cooldown)');
      return;
    }

    lastLightSyncAtRef.current = now;

    try {
      const result = await performLightSync(isPremium);

      if (result.updatedCount > 0) {
        console.log(
          `[PuzzleContext] Light sync found ${result.updatedCount} stale puzzle(s)`
        );

        // Refresh local state to reflect updated puzzles
        await refreshLocalPuzzles();

        // Show toast notification
        setUpdatedPuzzleCount(result.updatedCount);
        setShowUpdateToast(true);
      }
    } catch (err) {
      console.error('[PuzzleContext] Light sync failed:', err);
    }
  }, [isPremium, refreshLocalPuzzles]);

  /**
   * Dismiss the puzzle update toast.
   */
  const dismissUpdateToast = useCallback(() => {
    setShowUpdateToast(false);
  }, []);

  // Load lastSyncedAt from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((value) => {
      if (value) {
        setLastSyncedAt(value);
      }
    });
  }, []);

  // Load puzzles from SQLite on mount and mark as hydrated
  useEffect(() => {
    async function hydrate() {
      await refreshLocalPuzzles();
      setHasHydrated(true);
    }
    hydrate();
  }, [refreshLocalPuzzles]);

  // Auto-sync when user becomes available (or changes)
  useEffect(() => {
    if (userId && syncedForUserRef.current !== userId) {
      syncedForUserRef.current = userId;
      syncPuzzles();
    }
  }, [userId, syncPuzzles]);

  // Reset sync tracking when user logs out
  useEffect(() => {
    if (!userId) {
      syncedForUserRef.current = null;
    }
  }, [userId]);

  // Subscribe to midnight events for automatic puzzle refresh
  // This ensures users see new daily puzzles at midnight without app restart
  useEffect(() => {
    const unsubscribe = onMidnight(() => {
      console.log('[PuzzleContext] Midnight reached, refreshing puzzles');
      syncPuzzles();
    });

    return unsubscribe;
  }, [syncPuzzles]);

  // Re-check for stale puzzles when app returns to foreground
  // This catches CMS edits made while the app was backgrounded
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        // Only trigger when transitioning TO active state
        if (nextState === 'active' && appStateRef.current !== 'active') {
          console.log(
            '[PuzzleContext] App returned to foreground, checking for updates'
          );
          doLightSync();
        }
        appStateRef.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [doLightSync]);

  const value = useMemo<PuzzleContextValue>(
    () => ({
      puzzles,
      syncStatus,
      lastSyncedAt,
      error,
      hasHydrated,
      syncPuzzles,
      syncAttempts,
      refreshLocalPuzzles,
      showUpdateToast,
      updatedPuzzleCount,
      dismissUpdateToast,
    }),
    [
      puzzles,
      syncStatus,
      lastSyncedAt,
      error,
      hasHydrated,
      syncPuzzles,
      syncAttempts,
      refreshLocalPuzzles,
      showUpdateToast,
      updatedPuzzleCount,
      dismissUpdateToast,
    ]
  );

  return (
    <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>
  );
}

/**
 * Hook to access puzzle state and actions.
 * Must be used within a PuzzleProvider.
 */
export function usePuzzleContext(): PuzzleContextValue {
  const context = useContext(PuzzleContext);
  if (!context) {
    throw new Error('usePuzzleContext must be used within a PuzzleProvider');
  }
  return context;
}
