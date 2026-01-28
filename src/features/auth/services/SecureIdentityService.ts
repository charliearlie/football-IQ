/**
 * SecureIdentityService
 *
 * Manages persistent identity credentials using expo-secure-store.
 * Credentials stored in Keychain (iOS) or Keystore (Android) survive app reinstalls.
 *
 * This enables automatic restoration of user accounts after reinstall:
 * 1. Store Supabase user ID and refresh token on sign-in
 * 2. On reinstall, retrieve credentials and restore session
 * 3. Same user ID = same progress, subscriptions, and data
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Keys used for SecureStore storage.
 * These are stable identifiers - do not change without migration.
 */
export const SECURE_KEYS = {
  USER_ID: 'football_iq_user_id',
  REFRESH_TOKEN: 'football_iq_refresh_token',
  ONBOARDING_COMPLETED: 'football_iq_onboarding_completed',
} as const;

/**
 * Stored credentials structure.
 */
export interface StoredCredentials {
  userId: string;
  refreshToken: string;
}

/**
 * Check if SecureStore is available on this platform.
 * SecureStore is not available on web.
 */
function isSecureStoreAvailable(): boolean {
  return Platform.OS !== 'web';
}

/**
 * Store Supabase authentication credentials securely.
 * These credentials survive app reinstalls.
 *
 * @param userId - Supabase user ID (UUID)
 * @param refreshToken - Supabase refresh token for session restoration
 */
export async function storeAuthCredentials(
  userId: string,
  refreshToken: string
): Promise<void> {
  if (!isSecureStoreAvailable()) {
    console.log('[SecureIdentity] SecureStore not available on web');
    return;
  }

  try {
    await SecureStore.setItemAsync(SECURE_KEYS.USER_ID, userId);
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
    console.log('[SecureIdentity] Credentials stored successfully');
  } catch (error) {
    // Log but don't throw - graceful degradation
    console.error('[SecureIdentity] Failed to store credentials:', error);
  }
}

/**
 * Retrieve stored authentication credentials.
 * Returns null if no credentials are stored or if retrieval fails.
 *
 * @returns Stored credentials or null
 */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
  if (!isSecureStoreAvailable()) {
    return null;
  }

  try {
    const userId = await SecureStore.getItemAsync(SECURE_KEYS.USER_ID);
    const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);

    // Both must be present for valid credentials
    if (!userId || !refreshToken) {
      return null;
    }

    return { userId, refreshToken };
  } catch (error) {
    console.error('[SecureIdentity] Failed to retrieve credentials:', error);
    return null;
  }
}

/**
 * Clear all stored authentication credentials.
 * Called during sign-out or account deletion.
 */
export async function clearStoredCredentials(): Promise<void> {
  if (!isSecureStoreAvailable()) {
    return;
  }

  try {
    await SecureStore.deleteItemAsync(SECURE_KEYS.USER_ID);
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    console.log('[SecureIdentity] Credentials cleared');
  } catch (error) {
    console.error('[SecureIdentity] Failed to clear credentials:', error);
  }
}

/**
 * Mark onboarding as completed in secure storage.
 * This flag survives reinstalls, preventing repeat onboarding.
 */
export async function setOnboardingCompleted(): Promise<void> {
  if (!isSecureStoreAvailable()) {
    return;
  }

  try {
    await SecureStore.setItemAsync(SECURE_KEYS.ONBOARDING_COMPLETED, 'true');
    console.log('[SecureIdentity] Onboarding completion flag stored');
  } catch (error) {
    console.error('[SecureIdentity] Failed to store onboarding flag:', error);
  }
}

/**
 * Check if onboarding was completed (survives reinstall).
 *
 * @returns true if onboarding was completed, false otherwise
 */
export async function isOnboardingCompletedSecure(): Promise<boolean> {
  if (!isSecureStoreAvailable()) {
    return false;
  }

  try {
    const value = await SecureStore.getItemAsync(SECURE_KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  } catch (error) {
    console.error('[SecureIdentity] Failed to check onboarding flag:', error);
    return false;
  }
}

/**
 * Update the refresh token in secure storage.
 * Called when Supabase refreshes the token.
 *
 * @param refreshToken - New refresh token
 */
export async function updateRefreshToken(refreshToken: string): Promise<void> {
  if (!isSecureStoreAvailable()) {
    return;
  }

  try {
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
    console.log('[SecureIdentity] Refresh token updated');
  } catch (error) {
    console.error('[SecureIdentity] Failed to update refresh token:', error);
  }
}
