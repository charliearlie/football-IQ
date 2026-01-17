/**
 * Time Integrity Module
 *
 * Provides server-authoritative time checking to prevent clock manipulation.
 * Uses worldtimeapi.org as primary source with Supabase RPC fallback.
 *
 * Key features:
 * - Drift detection: Compares client time vs server time (timezone-agnostic)
 * - Local dates: Returns user's local date for puzzle display (Wordle-style)
 * - Midnight subscription: Fires at user's local midnight for puzzle refresh
 * - Offline fallback: Uses cached time when network unavailable
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { supabase } from './supabase';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = '@time_integrity_cache';
const DRIFT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 3000; // 3 second timeout per source
const WORLDTIME_API = 'https://worldtimeapi.org/api/timezone/Etc/UTC';

// ============================================================================
// Types
// ============================================================================

interface TimeCache {
  serverTime: string; // ISO string
  clientTime: string; // ISO string
  authorizedDate: string; // YYYY-MM-DD local
}

export interface TimeCheckResult {
  status: 'verified' | 'offline' | 'tampered';
  authorizedDate: string;
  driftMs: number;
  source: 'worldtime' | 'supabase' | 'cache' | 'none';
}

type MidnightCallback = () => void;

// ============================================================================
// Module State
// ============================================================================

let cachedDriftMs: number = 0;
let lastCheckStatus: TimeCheckResult['status'] = 'offline';
let lastAuthorizedDate: string = getLocalDateString(new Date());
let midnightSubscribers: Set<MidnightCallback> = new Set();
let midnightTimeoutId: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date): string {
  return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local timezone
}

/**
 * Calculate milliseconds until next local midnight
 */
function calculateMsToLocalMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Local midnight
  return tomorrow.getTime() - now.getTime();
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================================================
// Time Source Functions
// ============================================================================

/**
 * Fetch current UTC time from worldtimeapi.org
 */
async function fetchWorldTime(): Promise<Date | null> {
  try {
    const response = await fetchWithTimeout(WORLDTIME_API, FETCH_TIMEOUT_MS);
    if (!response.ok) return null;

    const data = await response.json();
    // worldtimeapi returns { datetime: "2024-01-17T12:34:56.789012+00:00", ... }
    if (data.datetime) {
      return new Date(data.datetime);
    }
    return null;
  } catch (error) {
    console.log('[Time] worldtimeapi.org failed:', error);
    return null;
  }
}

/**
 * Fetch current UTC time from Supabase RPC
 */
async function fetchSupabaseTime(): Promise<Date | null> {
  try {
    const { data, error } = await supabase.rpc('get_server_time');

    if (error) {
      console.log('[Time] Supabase RPC failed:', error);
      return null;
    }

    if (data) {
      return new Date(data);
    }
    return null;
  } catch (error) {
    console.log('[Time] Supabase RPC exception:', error);
    return null;
  }
}

/**
 * Load cached time data from AsyncStorage
 */
async function loadCachedTime(): Promise<TimeCache | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as TimeCache;
    }
    return null;
  } catch (error) {
    console.log('[Time] Failed to load cache:', error);
    return null;
  }
}

/**
 * Save time data to AsyncStorage cache
 */
async function saveCachedTime(cache: TimeCache): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.log('[Time] Failed to save cache:', error);
  }
}

// ============================================================================
// Midnight Scheduling
// ============================================================================

/**
 * Schedule the next midnight check
 */
function scheduleMidnightCheck(): void {
  // Clear any existing timeout
  if (midnightTimeoutId) {
    clearTimeout(midnightTimeoutId);
    midnightTimeoutId = null;
  }

  const msUntilMidnight = calculateMsToLocalMidnight();
  console.log(
    `[Time] Scheduling midnight check in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`
  );

  midnightTimeoutId = setTimeout(async () => {
    console.log('[Time] Midnight reached, syncing time and notifying subscribers');

    // Re-sync server time
    await syncServerTime();

    // Update authorized date
    lastAuthorizedDate = getLocalDateString(new Date());

    // Notify all subscribers
    midnightSubscribers.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[Time] Midnight callback error:', error);
      }
    });

    // Schedule next midnight
    scheduleMidnightCheck();
  }, msUntilMidnight);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize the time system - call once at app startup
 *
 * This performs the initial time check and sets up midnight scheduling.
 * Non-blocking - returns quickly even if network is slow.
 */
export async function initTimeSystem(): Promise<TimeCheckResult> {
  if (isInitialized) {
    return {
      status: lastCheckStatus,
      authorizedDate: lastAuthorizedDate,
      driftMs: cachedDriftMs,
      source: 'cache',
    };
  }

  const result = await syncServerTime();
  isInitialized = true;

  // Start midnight scheduling
  scheduleMidnightCheck();

  return result;
}

/**
 * Sync with server time and update drift calculation
 *
 * Call this when:
 * - App returns to foreground
 * - User taps "Try Again" on tampered overlay
 */
export async function syncServerTime(): Promise<TimeCheckResult> {
  const clientNow = new Date();
  const clientNowMs = clientNow.getTime();

  // Try worldtimeapi.org first
  let serverTime = await fetchWorldTime();
  let source: TimeCheckResult['source'] = 'worldtime';

  // Fallback to Supabase RPC
  if (!serverTime) {
    serverTime = await fetchSupabaseTime();
    source = 'supabase';
  }

  // If we got server time, calculate drift
  if (serverTime) {
    const serverMs = serverTime.getTime();
    cachedDriftMs = clientNowMs - serverMs;

    const localDate = getLocalDateString(clientNow);

    // Persist for offline use
    await saveCachedTime({
      serverTime: serverTime.toISOString(),
      clientTime: clientNow.toISOString(),
      authorizedDate: localDate,
    });

    // Check for tampering
    if (Math.abs(cachedDriftMs) > DRIFT_THRESHOLD_MS) {
      lastCheckStatus = 'tampered';
      lastAuthorizedDate = localDate;

      // Log to Sentry
      Sentry.addBreadcrumb({
        category: 'time_integrity',
        message: 'Clock tampering detected',
        level: 'warning',
        data: { driftMs: cachedDriftMs, source },
      });

      Sentry.captureMessage('Time tampering detected', {
        level: 'warning',
        tags: {
          drift_minutes: String(Math.round(cachedDriftMs / 60000)),
          drift_direction: cachedDriftMs > 0 ? 'ahead' : 'behind',
        },
        extra: {
          clientTime: clientNow.toISOString(),
          serverTime: serverTime.toISOString(),
          driftMs: cachedDriftMs,
        },
      });

      return {
        status: 'tampered',
        authorizedDate: localDate,
        driftMs: cachedDriftMs,
        source,
      };
    }

    // Time verified
    lastCheckStatus = 'verified';
    lastAuthorizedDate = localDate;

    console.log(`[Time] Verified, drift: ${Math.round(cachedDriftMs / 1000)}s (source: ${source})`);

    return {
      status: 'verified',
      authorizedDate: localDate,
      driftMs: cachedDriftMs,
      source,
    };
  }

  // Offline fallback - check against cache
  const cached = await loadCachedTime();

  if (cached) {
    const lastClientTimeMs = new Date(cached.clientTime).getTime();

    // If client clock went backward, that's tampering
    if (clientNowMs < lastClientTimeMs) {
      lastCheckStatus = 'tampered';

      Sentry.captureMessage('Time tampering detected (offline backward)', {
        level: 'warning',
        tags: {
          detection_type: 'offline_backward',
        },
        extra: {
          clientTime: clientNow.toISOString(),
          cachedClientTime: cached.clientTime,
        },
      });

      return {
        status: 'tampered',
        authorizedDate: cached.authorizedDate,
        driftMs: lastClientTimeMs - clientNowMs,
        source: 'cache',
      };
    }

    // Clock moved forward normally - allow with cached date
    lastCheckStatus = 'offline';
    lastAuthorizedDate = getLocalDateString(clientNow);

    console.log('[Time] Offline, using cached verification');

    return {
      status: 'offline',
      authorizedDate: lastAuthorizedDate,
      driftMs: 0,
      source: 'cache',
    };
  }

  // No network, no cache - first-time offline user, allow access
  lastCheckStatus = 'offline';
  lastAuthorizedDate = getLocalDateString(clientNow);

  console.log('[Time] Offline with no cache, allowing access');

  return {
    status: 'offline',
    authorizedDate: lastAuthorizedDate,
    driftMs: 0,
    source: 'none',
  };
}

/**
 * Check if device time appears tampered
 *
 * Returns true if the last check detected tampering.
 * Use this for quick synchronous checks after initialization.
 */
export function isTimeTampered(): boolean {
  return lastCheckStatus === 'tampered';
}

/**
 * Get the authorized date string (YYYY-MM-DD in LOCAL timezone)
 *
 * This is the safe date to use for puzzle filtering.
 * Throws if time is tampered - caller should handle this.
 */
export function getAuthorizedDate(): string {
  if (lastCheckStatus === 'tampered') {
    throw new Error('Time tampered - cannot provide authorized date');
  }
  return lastAuthorizedDate;
}

/**
 * Get the authorized date, with fallback for tampered state
 *
 * Use this when you need a date even in tampered state (e.g., for display).
 * The tampered overlay should still block interaction.
 */
export function getAuthorizedDateUnsafe(): string {
  return lastAuthorizedDate;
}

/**
 * Get the current time check status
 */
export function getTimeStatus(): TimeCheckResult['status'] {
  return lastCheckStatus;
}

/**
 * Get the current drift in milliseconds
 */
export function getTimeDriftMs(): number {
  return cachedDriftMs;
}

/**
 * Subscribe to midnight (local timezone) events
 *
 * The callback will be invoked at the user's local midnight,
 * which is when puzzles should refresh.
 *
 * @returns Unsubscribe function
 */
export function onMidnight(callback: MidnightCallback): () => void {
  midnightSubscribers.add(callback);

  return () => {
    midnightSubscribers.delete(callback);
  };
}

/**
 * Clean up resources (for testing or app shutdown)
 */
export function cleanupTimeSystem(): void {
  if (midnightTimeoutId) {
    clearTimeout(midnightTimeoutId);
    midnightTimeoutId = null;
  }
  midnightSubscribers.clear();
  isInitialized = false;
}
