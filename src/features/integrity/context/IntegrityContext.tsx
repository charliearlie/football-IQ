/**
 * IntegrityContext
 *
 * Provides time integrity checking throughout the app.
 * Renders a blocking overlay when clock tampering is detected.
 *
 * This provider should wrap PuzzleProvider in the component hierarchy
 * to ensure time validation happens before puzzle access.
 */

import React, {
  createContext,
  use,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initTimeSystem,
  syncServerTime,
  getAuthorizedDateUnsafe,
  onMidnight,
  TimeCheckResult,
} from '@/lib/time';
import { TimeTamperedOverlay } from '@/components/TimeTamperedOverlay';

// ============================================================================
// Types
// ============================================================================

interface IntegrityState {
  /** Current status of time integrity check */
  status: 'initializing' | 'verified' | 'offline' | 'tampered';
  /** The authorized date string (YYYY-MM-DD in local timezone) */
  authorizedDate: string;
  /** ISO timestamp of last successful check */
  lastCheckAt: string | null;
}

interface IntegrityContextValue extends IntegrityState {
  /** Manually trigger a time re-check (e.g., from retry button) */
  recheckTime: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const IntegrityContext = createContext<IntegrityContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface IntegrityGuardProviderProps {
  children: React.ReactNode;
}

export function IntegrityGuardProvider({
  children,
}: IntegrityGuardProviderProps) {
  const [state, setState] = useState<IntegrityState>({
    status: 'initializing',
    authorizedDate: getAuthorizedDateUnsafe(), // Optimistic local date
    lastCheckAt: null,
  });

  // Track AppState for foreground re-checks
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Update state from a TimeCheckResult
   */
  const updateFromResult = useCallback((result: TimeCheckResult) => {
    setState({
      status: result.status,
      authorizedDate: result.authorizedDate,
      lastCheckAt: new Date().toISOString(),
    });
  }, []);

  /**
   * Manually re-check time (for retry button)
   */
  const recheckTime = useCallback(async () => {
    const result = await syncServerTime();
    updateFromResult(result);
  }, [updateFromResult]);

  // Initial time check on mount
  useEffect(() => {
    initTimeSystem().then(updateFromResult);
  }, [updateFromResult]);

  // Re-check when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        // Only re-check when transitioning TO active state
        if (nextState === 'active' && appStateRef.current !== 'active') {
          console.log('[Integrity] App returned to foreground, re-checking time');
          const result = await syncServerTime();
          updateFromResult(result);
        }
        appStateRef.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [updateFromResult]);

  // Subscribe to midnight events to update authorized date
  useEffect(() => {
    const unsubscribe = onMidnight(() => {
      console.log('[Integrity] Midnight reached, updating authorized date');
      setState((prev) => ({
        ...prev,
        authorizedDate: getAuthorizedDateUnsafe(),
        lastCheckAt: new Date().toISOString(),
      }));
    });

    return unsubscribe;
  }, []);

  const contextValue: IntegrityContextValue = {
    ...state,
    recheckTime,
  };

  return (
    <IntegrityContext value={contextValue}>
      {children}
      {state.status === 'tampered' && (
        <TimeTamperedOverlay onRetry={recheckTime} />
      )}
    </IntegrityContext>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access time integrity state and actions
 *
 * @throws If used outside IntegrityGuardProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, authorizedDate, recheckTime } = useIntegrity();
 *
 *   if (status === 'tampered') {
 *     // Overlay is shown automatically, but you can handle this if needed
 *   }
 *
 *   // Use authorizedDate instead of new Date() for puzzle filtering
 *   const todaysPuzzles = puzzles.filter(p => p.puzzle_date === authorizedDate);
 * }
 * ```
 */
export function useIntegrity(): IntegrityContextValue {
  const context = use(IntegrityContext);

  if (!context) {
    throw new Error('useIntegrity must be used within IntegrityGuardProvider');
  }

  return context;
}
