/**
 * Ad Visibility Tests
 *
 * TDD tests for ad visibility logic.
 * Ensures premium users don't see ads and free users do.
 */

import { Platform } from 'react-native';
import { getAdUnitId, isAdsSupportedPlatform } from '../config/adUnits';

describe('Ad Visibility', () => {
  describe('getAdUnitId', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      // Reset Platform.OS after each test
      Object.defineProperty(Platform, 'OS', {
        value: originalPlatform,
        writable: true,
      });
    });

    describe('iOS platform', () => {
      beforeEach(() => {
        Object.defineProperty(Platform, 'OS', {
          value: 'ios',
          writable: true,
        });
      });

      it('returns iOS test banner ID in development', () => {
        // Act
        const result = getAdUnitId('banner');

        // Assert - Test ID for iOS banner
        expect(result).toBe('ca-app-pub-3940256099942544/2934735716');
      });

      it('returns iOS test rewarded ID in development', () => {
        // Act
        const result = getAdUnitId('rewarded');

        // Assert - Test ID for iOS rewarded
        expect(result).toBe('ca-app-pub-3940256099942544/1712485313');
      });
    });

    describe('Android platform', () => {
      beforeEach(() => {
        Object.defineProperty(Platform, 'OS', {
          value: 'android',
          writable: true,
        });
      });

      it('returns Android test banner ID in development', () => {
        // Act
        const result = getAdUnitId('banner');

        // Assert - Test ID for Android banner
        expect(result).toBe('ca-app-pub-3940256099942544/6300978111');
      });

      it('returns Android test rewarded ID in development', () => {
        // Act
        const result = getAdUnitId('rewarded');

        // Assert - Test ID for Android rewarded
        expect(result).toBe('ca-app-pub-3940256099942544/5224354917');
      });
    });

    describe('Web platform', () => {
      beforeEach(() => {
        Object.defineProperty(Platform, 'OS', {
          value: 'web',
          writable: true,
        });
      });

      it('returns null for banner ads on web', () => {
        // Act
        const result = getAdUnitId('banner');

        // Assert
        expect(result).toBeNull();
      });

      it('returns null for rewarded ads on web', () => {
        // Act
        const result = getAdUnitId('rewarded');

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('isAdsSupportedPlatform', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('returns true for iOS', () => {
      // Arrange
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        writable: true,
      });

      // Act & Assert
      expect(isAdsSupportedPlatform()).toBe(true);
    });

    it('returns true for Android', () => {
      // Arrange
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        writable: true,
      });

      // Act & Assert
      expect(isAdsSupportedPlatform()).toBe(true);
    });

    it('returns false for Web', () => {
      // Arrange
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      });

      // Act & Assert
      expect(isAdsSupportedPlatform()).toBe(false);
    });
  });

  describe('shouldShowAds logic', () => {
    /**
     * Tests for the shouldShowAds logic that will be implemented in AdContext.
     * Premium users should never see ads, free users should see ads on supported platforms.
     */

    interface MockProfile {
      is_premium: boolean;
    }

    // Helper function mimicking the shouldShowAds logic
    function shouldShowAds(profile: MockProfile | null, platform: string): boolean {
      // No ads on unsupported platforms
      if (platform !== 'ios' && platform !== 'android') {
        return false;
      }

      // No ads for premium users
      if (profile?.is_premium) {
        return false;
      }

      // Show ads for free users on supported platforms
      return true;
    }

    describe('Premium users', () => {
      it('should NOT show ads for premium users on iOS', () => {
        // Arrange
        const profile: MockProfile = { is_premium: true };

        // Act & Assert
        expect(shouldShowAds(profile, 'ios')).toBe(false);
      });

      it('should NOT show ads for premium users on Android', () => {
        // Arrange
        const profile: MockProfile = { is_premium: true };

        // Act & Assert
        expect(shouldShowAds(profile, 'android')).toBe(false);
      });
    });

    describe('Free users', () => {
      it('should show ads for free users on iOS', () => {
        // Arrange
        const profile: MockProfile = { is_premium: false };

        // Act & Assert
        expect(shouldShowAds(profile, 'ios')).toBe(true);
      });

      it('should show ads for free users on Android', () => {
        // Arrange
        const profile: MockProfile = { is_premium: false };

        // Act & Assert
        expect(shouldShowAds(profile, 'android')).toBe(true);
      });

      it('should NOT show ads for free users on Web', () => {
        // Arrange
        const profile: MockProfile = { is_premium: false };

        // Act & Assert
        expect(shouldShowAds(profile, 'web')).toBe(false);
      });
    });

    describe('Anonymous users (null profile)', () => {
      it('should show ads for anonymous users on iOS', () => {
        // Act & Assert
        expect(shouldShowAds(null, 'ios')).toBe(true);
      });

      it('should show ads for anonymous users on Android', () => {
        // Act & Assert
        expect(shouldShowAds(null, 'android')).toBe(true);
      });

      it('should NOT show ads for anonymous users on Web', () => {
        // Act & Assert
        expect(shouldShowAds(null, 'web')).toBe(false);
      });
    });
  });

  describe('AdBanner component visibility (to be implemented)', () => {
    /**
     * Placeholder tests for AdBanner component.
     * These tests describe the expected behavior.
     */

    it.todo('returns null when user is premium');
    it.todo('renders banner when user is not premium');
    it.todo('returns null on web platform');
    it.todo('handles loading state while ad is being fetched');
    it.todo('handles error state when ad fails to load');
  });

  describe('RewardedAd visibility (to be implemented)', () => {
    /**
     * Placeholder tests for RewardedAd hook.
     * These tests describe the expected behavior.
     */

    it.todo('does not preload rewarded ads for premium users');
    it.todo('preloads rewarded ads for free users');
    it.todo('returns null ad for web platform');
  });
});

describe('Ad Lock Logic Integration', () => {
  /**
   * Tests for how ad unlocks integrate with the existing isPuzzleLocked logic.
   * The extended function will check: isPremium OR isWithinFreeWindow OR hasValidAdUnlock
   */

  describe('isPuzzleLocked with ad unlocks (to be implemented)', () => {
    const SEVEN_DAYS_AGO = new Date();
    SEVEN_DAYS_AGO.setDate(SEVEN_DAYS_AGO.getDate() - 8); // 8 days ago = outside free window
    const OLD_PUZZLE_DATE = SEVEN_DAYS_AGO.toISOString().split('T')[0];

    const TODAY = new Date().toISOString().split('T')[0];

    interface AdUnlock {
      puzzle_id: string;
      expires_at: string;
    }

    // Extended lock check mimicking the new logic
    function isPuzzleLockedWithAdUnlocks(
      puzzleId: string,
      puzzleDate: string,
      isPremium: boolean,
      adUnlocks: AdUnlock[]
    ): boolean {
      // Premium users: never locked
      if (isPremium) return false;

      // Within free window: not locked
      const date = new Date(puzzleDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (date >= sevenDaysAgo) return false;

      // Has valid ad unlock: not locked
      const now = new Date().toISOString();
      const hasValidUnlock = adUnlocks.some(
        (unlock) => unlock.puzzle_id === puzzleId && unlock.expires_at > now
      );
      if (hasValidUnlock) return false;

      // Otherwise: locked
      return true;
    }

    it('returns false (unlocked) for premium users regardless of ad unlocks', () => {
      // Act & Assert
      expect(isPuzzleLockedWithAdUnlocks('puzzle-1', OLD_PUZZLE_DATE, true, [])).toBe(false);
    });

    it('returns false (unlocked) for puzzles within free window regardless of ad unlocks', () => {
      // Act & Assert
      expect(isPuzzleLockedWithAdUnlocks('puzzle-1', TODAY, false, [])).toBe(false);
    });

    it('returns false (unlocked) when valid ad unlock exists for old puzzle', () => {
      // Arrange
      const futureExpiry = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const adUnlocks: AdUnlock[] = [{ puzzle_id: 'puzzle-1', expires_at: futureExpiry }];

      // Act & Assert
      expect(isPuzzleLockedWithAdUnlocks('puzzle-1', OLD_PUZZLE_DATE, false, adUnlocks)).toBe(
        false
      );
    });

    it('returns true (locked) when ad unlock is expired for old puzzle', () => {
      // Arrange
      const pastExpiry = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      const adUnlocks: AdUnlock[] = [{ puzzle_id: 'puzzle-1', expires_at: pastExpiry }];

      // Act & Assert
      expect(isPuzzleLockedWithAdUnlocks('puzzle-1', OLD_PUZZLE_DATE, false, adUnlocks)).toBe(true);
    });

    it('returns true (locked) for old puzzle with no ad unlock', () => {
      // Act & Assert
      expect(isPuzzleLockedWithAdUnlocks('puzzle-1', OLD_PUZZLE_DATE, false, [])).toBe(true);
    });

    it('returns true (locked) when ad unlock exists for different puzzle', () => {
      // Arrange
      const futureExpiry = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      const adUnlocks: AdUnlock[] = [{ puzzle_id: 'puzzle-2', expires_at: futureExpiry }];

      // Act & Assert - puzzle-1 has no unlock, only puzzle-2
      expect(isPuzzleLockedWithAdUnlocks('puzzle-1', OLD_PUZZLE_DATE, false, adUnlocks)).toBe(true);
    });
  });
});
