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
import { useRehydration } from '@/features/integrity';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
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

  // Network connectivity
  const { isConnected } = useNetworkStatus();

  // Track which user we've synced for to prevent re-syncing on callback recreation
  const syncedForUserRef = useRef<string | null>(null);
  // Track whether initial sync was skipped due to being offline
  const skippedInitialSyncRef = useRef(false);
  // Track offline→online transitions for attempt flushing
  const wasDisconnectedRef = useRef(false);

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
      console.log('[PuzzleContext] Loaded', localPuzzles.length, 'puzzles from SQLite');
      if (__DEV__ && localPuzzles.length > 0) {
        // Log the career_path puzzle specifically for debugging
        const careerPath = localPuzzles.find(p => p.game_mode === 'career_path');
        if (careerPath) {
          console.log('[PuzzleContext] career_path puzzle:', careerPath.id, 'updated_at:', careerPath.updated_at);
        }
      }
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
    console.log('[PuzzleContext] syncPuzzles starting, userId:', userId, 'isPremium:', isPremium);
    setSyncStatus('syncing');
    setError(null);

    try {
      const result = await syncPuzzlesFromSupabase({
        userId,
        isPremium,
        lastSyncedAt,
      });
      console.log('[PuzzleContext] syncPuzzles result:', result.success, 'count:', result.syncedCount);

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
    if (isConnected === false) {
      console.log('[PuzzleContext] Light sync skipped (offline)');
      return;
    }

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
  }, [isConnected, isPremium, refreshLocalPuzzles]);

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
      console.log('[PuzzleContext] Hydrating from SQLite...');
      await refreshLocalPuzzles();
      setHasHydrated(true);
      console.log('[PuzzleContext] Hydration complete');
    }
    hydrate();
  }, [refreshLocalPuzzles]);

  // Listen for rehydration completion (from fresh install logic)
  // This ensures the UI updates immediately after data is restored
  const { status: rehydrationStatus } = useRehydration();
  useEffect(() => {
    if (rehydrationStatus === 'complete') {
      console.log('[PuzzleContext] Rehydration complete, refreshing local puzzles');
      refreshLocalPuzzles();
    }
  }, [rehydrationStatus, refreshLocalPuzzles]);

  // Auto-sync when user becomes available (or changes)
  useEffect(() => {
    console.log('[PuzzleContext] User check - userId:', userId, 'isConnected:', isConnected, 'syncedForUser:', syncedForUserRef.current);
    if (userId && syncedForUserRef.current !== userId) {
      if (isConnected === false) {
        // Offline: skip remote sync, leave syncStatus as 'idle' so local data renders
        console.log('[PuzzleContext] Offline - skipping initial sync, using local data');
        syncedForUserRef.current = userId;
        skippedInitialSyncRef.current = true;
      } else {
        console.log('[PuzzleContext] Triggering initial puzzle sync');
        syncedForUserRef.current = userId;
        syncPuzzles();
      }
    }
  }, [userId, isConnected, syncPuzzles]);

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

  // Reconnection: sync puzzles and attempts when we come back online
  useEffect(() => {
    if (isConnected === false) {
      wasDisconnectedRef.current = true;
    }

    if (isConnected === true && userId) {
      // Trigger deferred puzzle sync if initial sync was skipped
      if (skippedInitialSyncRef.current) {
        console.log('[PuzzleContext] Back online - triggering deferred puzzle sync');
        skippedInitialSyncRef.current = false;
        syncPuzzles();
      }

      // Flush unsynced attempts after any offline period
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        console.log('[PuzzleContext] Network reconnected - flushing unsynced attempts');
        syncAttempts().catch((err) => {
          console.warn('[PuzzleContext] Reconnection attempt sync failed:', err);
        });
      }
    }
  }, [isConnected, userId, syncPuzzles, syncAttempts]);

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

          // Also flush any unsynced attempts on foreground return
          if (isConnected !== false && userId) {
            syncAttempts().catch((err) => {
              console.warn('[PuzzleContext] Foreground attempt sync failed:', err);
            });
          }
        }
        appStateRef.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [doLightSync, syncAttempts, isConnected, userId]);

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
