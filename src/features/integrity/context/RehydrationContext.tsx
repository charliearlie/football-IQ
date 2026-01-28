/**
 * RehydrationContext
 *
 * Manages data rehydration lifecycle after app reinstall.
 *
 * This provider sits between IntegrityGuardProvider and PuzzleProvider,
 * ensuring data is restored before the app tries to use it.
 *
 * Flow:
 * 1. Wait for auth to initialize
 * 2. Check if rehydration is needed (empty SQLite, has Supabase data)
 * 3. If needed, show loading screen and perform rehydration
 * 4. Once complete, render children
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/features/auth';
import { isDatabaseReady } from '@/lib/database';
import {
  needsRehydration,
  performRehydration,
  RehydrationResult,
} from '../services/RehydrationService';
import { RehydrationLoadingScreen } from '../components/RehydrationLoadingScreen';

/**
 * Rehydration status values.
 */
type RehydrationStatus =
  | 'idle' // Initial state, waiting for auth
  | 'checking' // Checking if rehydration is needed
  | 'rehydrating' // Actively restoring data
  | 'complete' // Rehydration finished (or not needed)
  | 'error'; // Rehydration failed

/**
 * Context value for rehydration state.
 */
interface RehydrationContextValue {
  /** Current rehydration status */
  status: RehydrationStatus;
  /** Number of attempts restored (if rehydration occurred) */
  attemptsRestored: number;
  /** Error if rehydration failed */
  error: Error | null;
  /** Manually trigger rehydration check (for retry) */
  retryRehydration: () => Promise<void>;
}

const RehydrationContext = createContext<RehydrationContextValue | null>(null);

interface RehydrationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that manages data rehydration after reinstall.
 *
 * Shows a loading screen while restoring data, then renders children.
 */
export function RehydrationProvider({ children }: RehydrationProviderProps) {
  const { user, isInitialized } = useAuth();
  const [status, setStatus] = useState<RehydrationStatus>('idle');
  const [attemptsRestored, setAttemptsRestored] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Prevent double-execution
  const hasChecked = useRef(false);

  /**
   * Check if rehydration is needed and perform it.
   * Waits for database to be ready before proceeding.
   */
  const checkAndRehydrate = useCallback(async () => {
    if (!user?.id) {
      console.log('[RehydrationProvider] No user ID, skipping rehydration check');
      setStatus('complete');
      return;
    }

    // Wait for database to be ready (with timeout)
    const maxWaitMs = 5000;
    const pollIntervalMs = 100;
    const startTime = Date.now();

    while (!isDatabaseReady()) {
      if (Date.now() - startTime > maxWaitMs) {
        console.error('[RehydrationProvider] Database not ready after 5s, skipping rehydration');
        setStatus('complete');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    console.log('[RehydrationProvider] Database ready, checking rehydration for user:', user.id);
    setStatus('checking');
    setError(null);

    try {
      const needs = await needsRehydration(user.id);
      console.log('[RehydrationProvider] needsRehydration:', needs);

      if (!needs) {
        console.log('[RehydrationProvider] No rehydration needed');
        setStatus('complete');
        return;
      }

      console.log('[RehydrationProvider] Rehydration needed, starting...');
      setStatus('rehydrating');

      const result: RehydrationResult = await performRehydration(user.id);

      if (result.success) {
        setAttemptsRestored(result.attemptsRehydrated);
        setStatus('complete');
        console.log(
          `[RehydrationProvider] Rehydration complete: ${result.attemptsRehydrated} attempts`
        );
      } else {
        setError(result.error ?? new Error('Rehydration failed'));
        setStatus('error');
        console.error('[RehydrationProvider] Rehydration failed:', result.error);
      }
    } catch (err) {
      console.error('[RehydrationProvider] Unexpected error:', err);
      setError(err as Error);
      setStatus('error');
    }
  }, [user?.id]);

  /**
   * Retry rehydration (for error recovery).
   */
  const retryRehydration = useCallback(async () => {
    hasChecked.current = false;
    await checkAndRehydrate();
  }, [checkAndRehydrate]);

  // Run rehydration check once auth is ready
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (hasChecked.current) {
      return;
    }

    hasChecked.current = true;
    checkAndRehydrate();
  }, [isInitialized, checkAndRehydrate]);

  const value: RehydrationContextValue = {
    status,
    attemptsRestored,
    error,
    retryRehydration,
  };

  const showOverlay = status === 'idle' || status === 'checking' || status === 'rehydrating';

  return (
    <RehydrationContext.Provider value={value}>
      {children}
      {showOverlay && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          {status === 'rehydrating' ? <RehydrationLoadingScreen /> : null}
        </View>
      )}
    </RehydrationContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#0A101C', // colors.stadiumNavy
    zIndex: 99999,
  },
});

/**
 * Hook to access rehydration state.
 */
export function useRehydration(): RehydrationContextValue {
  const context = useContext(RehydrationContext);
  if (!context) {
    throw new Error('useRehydration must be used within a RehydrationProvider');
  }
  return context;
}
