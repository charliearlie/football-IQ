/**
 * SecureIdentityService Tests
 *
 * Tests for secure credential storage that survives app reinstalls.
 * Uses expo-secure-store (Keychain on iOS, Keystore on Android).
 */

import { Platform } from 'react-native';
import { mockSecureStore } from '../../../../jest-setup';
import {
  storeAuthCredentials,
  getStoredCredentials,
  clearStoredCredentials,
  setOnboardingCompleted,
  isOnboardingCompletedSecure,
  SECURE_KEYS,
} from '../services/SecureIdentityService';

describe('SecureIdentityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeAuthCredentials', () => {
    it('stores userId and refreshToken in SecureStore', async () => {
      await storeAuthCredentials('user-123', 'refresh-token-abc');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.USER_ID,
        'user-123'
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.REFRESH_TOKEN,
        'refresh-token-abc'
      );
    });

    it('handles SecureStore errors gracefully', async () => {
      mockSecureStore.setItemAsync.mockRejectedValueOnce(
        new Error('Keychain unavailable')
      );

      // Should not throw
      await expect(
        storeAuthCredentials('user-123', 'refresh-token-abc')
      ).resolves.not.toThrow();
    });
  });

  describe('getStoredCredentials', () => {
    it('returns credentials when both userId and refreshToken are present', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('user-123')
        .mockResolvedValueOnce('refresh-token-abc');

      const result = await getStoredCredentials();

      expect(result).toEqual({
        userId: 'user-123',
        refreshToken: 'refresh-token-abc',
      });
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.USER_ID
      );
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.REFRESH_TOKEN
      );
    });

    it('returns null when SecureStore is empty', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getStoredCredentials();

      expect(result).toBeNull();
    });

    it('returns null when only userId is present (partial data)', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce('user-123')
        .mockResolvedValueOnce(null);

      const result = await getStoredCredentials();

      expect(result).toBeNull();
    });

    it('returns null when only refreshToken is present (partial data)', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('refresh-token-abc');

      const result = await getStoredCredentials();

      expect(result).toBeNull();
    });

    it('returns null when SecureStore throws an error', async () => {
      mockSecureStore.getItemAsync.mockRejectedValueOnce(
        new Error('Keychain locked')
      );

      const result = await getStoredCredentials();

      expect(result).toBeNull();
    });
  });

  describe('clearStoredCredentials', () => {
    it('removes all stored credentials from SecureStore', async () => {
      await clearStoredCredentials();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.USER_ID
      );
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.REFRESH_TOKEN
      );
    });

    it('handles SecureStore errors gracefully', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValueOnce(
        new Error('Delete failed')
      );

      await expect(clearStoredCredentials()).resolves.not.toThrow();
    });
  });

  describe('setOnboardingCompleted', () => {
    it('stores onboarding completion flag in SecureStore', async () => {
      await setOnboardingCompleted();

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.ONBOARDING_COMPLETED,
        'true'
      );
    });

    it('handles SecureStore errors gracefully', async () => {
      mockSecureStore.setItemAsync.mockRejectedValueOnce(
        new Error('Keychain unavailable')
      );

      await expect(setOnboardingCompleted()).resolves.not.toThrow();
    });
  });

  describe('isOnboardingCompletedSecure', () => {
    it('returns true when onboarding flag is set to true', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce('true');

      const result = await isOnboardingCompletedSecure();

      expect(result).toBe(true);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        SECURE_KEYS.ONBOARDING_COMPLETED
      );
    });

    it('returns false when onboarding flag is not set', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await isOnboardingCompletedSecure();

      expect(result).toBe(false);
    });

    it('returns false when SecureStore throws an error', async () => {
      mockSecureStore.getItemAsync.mockRejectedValueOnce(
        new Error('Keychain locked')
      );

      const result = await isOnboardingCompletedSecure();

      expect(result).toBe(false);
    });
  });

  describe('Platform-specific behavior', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform });
    });

    it('stores credentials on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });

      await storeAuthCredentials('user-123', 'token-abc');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('stores credentials on Android', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });

      await storeAuthCredentials('user-123', 'token-abc');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });
});

describe('Reinstall Scenario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credentials survive simulated reinstall (SecureStore persists)', async () => {
    // First install: store credentials
    await storeAuthCredentials('user-original', 'refresh-original');

    // Simulate reinstall: AsyncStorage is cleared, but SecureStore persists
    // SecureStore still has the values
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce('user-original')
      .mockResolvedValueOnce('refresh-original');

    // App checks SecureStore on launch
    const credentials = await getStoredCredentials();

    expect(credentials).toEqual({
      userId: 'user-original',
      refreshToken: 'refresh-original',
    });
  });

  it('onboarding flag survives simulated reinstall', async () => {
    // First install: complete onboarding
    await setOnboardingCompleted();

    // Simulate reinstall: AsyncStorage cleared, SecureStore persists
    mockSecureStore.getItemAsync.mockResolvedValueOnce('true');

    // App checks SecureStore on launch
    const completed = await isOnboardingCompletedSecure();

    expect(completed).toBe(true);
  });
});
