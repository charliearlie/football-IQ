/**
 * RevenueCat Configuration Tests
 *
 * Verifies correct API key selection based on environment.
 */

import {
  getRevenueCatApiKey,
  REVENUECAT_API_KEYS,
  PREMIUM_OFFERING_ID,
  PREMIUM_ENTITLEMENT_ID,
} from '../revenueCat';

describe('RevenueCat Configuration', () => {
  const originalDev = (global as any).__DEV__;

  afterEach(() => {
    (global as any).__DEV__ = originalDev;
  });

  describe('getRevenueCatApiKey', () => {
    it('returns sandbox key when __DEV__ is true', () => {
      (global as any).__DEV__ = true;

      const key = getRevenueCatApiKey();

      expect(key).toBe(REVENUECAT_API_KEYS.sandbox);
      expect(key).toBe('test_otNRIIDWLJwJlzISdCbUzGtwwlD');
    });

    it('returns production key when __DEV__ is false', () => {
      (global as any).__DEV__ = false;

      const key = getRevenueCatApiKey();

      expect(key).toBe(REVENUECAT_API_KEYS.production);
      expect(key).toBe('appl_QWyaHOEVWcyFzTWkykxesWlqhDo');
    });
  });

  describe('constants', () => {
    it('exports correct offering ID', () => {
      expect(PREMIUM_OFFERING_ID).toBe('default_offering');
    });

    it('exports correct entitlement ID', () => {
      expect(PREMIUM_ENTITLEMENT_ID).toBe('Football IQ Pro');
    });

    it('has both sandbox and production keys defined', () => {
      expect(REVENUECAT_API_KEYS.sandbox).toBeDefined();
      expect(REVENUECAT_API_KEYS.production).toBeDefined();
      expect(REVENUECAT_API_KEYS.sandbox).not.toBe(REVENUECAT_API_KEYS.production);
    });
  });
});
