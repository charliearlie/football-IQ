import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/features/auth';
import { getAllPuzzles } from '@/lib/database';
import { syncPuzzlesFromSupabase } from '../services/puzzleSyncService';
import { syncAttemptsToSupabase } from '../services/attemptSyncService';
import { syncCatalogFromSupabase } from '@/features/archive/services/catalogSyncService';
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

  // Get auth context for user info
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;
  const isPremium = profile?.is_premium ?? false;

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
   */
  const syncAttempts = useCallback(async (): Promise<SyncResult> => {
    if (!userId) {
      return { success: false, error: new Error('User not authenticated') };
    }

    try {
      const result = await syncAttemptsToSupabase(userId);
      return result;
    } catch (err) {
      return { success: false, error: err as Error };
    }
  }, [userId]);

  // Load lastSyncedAt from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((value) => {
      if (value) {
        setLastSyncedAt(value);
      }
    });
  }, []);

  // Load puzzles from SQLite on mount
  useEffect(() => {
    refreshLocalPuzzles();
  }, [refreshLocalPuzzles]);

  // Auto-sync when user becomes available
  useEffect(() => {
    if (userId) {
      syncPuzzles();
    }
  }, [userId]); // Intentionally not including syncPuzzles to avoid re-syncing on every render

  const value = useMemo<PuzzleContextValue>(
    () => ({
      puzzles,
      syncStatus,
      lastSyncedAt,
      error,
      syncPuzzles,
      syncAttempts,
      refreshLocalPuzzles,
    }),
    [
      puzzles,
      syncStatus,
      lastSyncedAt,
      error,
      syncPuzzles,
      syncAttempts,
      refreshLocalPuzzles,
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
