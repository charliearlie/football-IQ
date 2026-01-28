/**
 * RevenueCat Sync Tests
 *
 * Tests for entitlement checking and Supabase sync logic.
 */

import { CustomerInfo } from 'react-native-purchases';
import {
  checkPremiumEntitlement,
  syncPremiumToSupabase,
  identifyUser,
  logOutUser,
  addCustomerInfoListener,
  silentRestorePurchases,
} from '../services/SubscriptionSync';
import { mockPurchases, mockSupabaseFrom } from '../../../../jest-setup';

// Get mock of default export
const Purchases = mockPurchases;

describe('SubscriptionSync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPremiumEntitlement', () => {
    it('returns hasPremium: true when Football IQ Pro entitlement is active', () => {
      const customerInfo = {
        entitlements: {
          active: {
            'Football IQ Pro': {
              identifier: 'Football IQ Pro',
              isActive: true,
              expirationDate: '2025-12-31T00:00:00Z',
            },
          },
        },
      } as unknown as CustomerInfo;

      const result = checkPremiumEntitlement(customerInfo);

      expect(result.hasPremium).toBe(true);
      expect(result.expirationDate).toBe('2025-12-31T00:00:00Z');
    });

    it('returns hasPremium: false when Football IQ Pro entitlement is not present', () => {
      const customerInfo = {
        entitlements: {
          active: {},
        },
      } as unknown as CustomerInfo;

      const result = checkPremiumEntitlement(customerInfo);

      expect(result.hasPremium).toBe(false);
      expect(result.expirationDate).toBeNull();
    });

    it('returns hasPremium: false when entitlements object is empty', () => {
      const customerInfo = {
        entitlements: {
          active: {},
        },
      } as unknown as CustomerInfo;

      const result = checkPremiumEntitlement(customerInfo);

      expect(result.hasPremium).toBe(false);
    });

    it('handles lifetime subscription with null expiration', () => {
      const customerInfo = {
        entitlements: {
          active: {
            'Football IQ Pro': {
              identifier: 'Football IQ Pro',
              isActive: true,
              expirationDate: null,
            },
          },
        },
      } as unknown as CustomerInfo;

      const result = checkPremiumEntitlement(customerInfo);

      expect(result.hasPremium).toBe(true);
      expect(result.expirationDate).toBeNull();
    });

    it('ignores other entitlements when checking for Football IQ Pro', () => {
      const customerInfo = {
        entitlements: {
          active: {
            other_entitlement: {
              identifier: 'other_entitlement',
              isActive: true,
            },
          },
        },
      } as unknown as CustomerInfo;

      const result = checkPremiumEntitlement(customerInfo);

      expect(result.hasPremium).toBe(false);
    });
  });

  describe('syncPremiumToSupabase', () => {
    it('updates profile to premium when isPremium is true', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ update: mockUpdate });

      const result = await syncPremiumToSupabase('user-123', true);

      expect(result.error).toBeNull();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_premium: true,
          premium_purchased_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('updates profile to non-premium when isPremium is false', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ update: mockUpdate });

      const result = await syncPremiumToSupabase('user-123', false);

      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_premium: false,
          premium_purchased_at: null,
        })
      );
    });

    it('returns error when Supabase update fails', async () => {
      const mockError = { message: 'Database error' };
      const mockEq = jest.fn().mockResolvedValue({ error: mockError });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabaseFrom.mockReturnValue({ update: mockUpdate });

      const result = await syncPremiumToSupabase('user-123', true);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Database error');
    });
  });

  describe('identifyUser', () => {
    it('calls Purchases.logIn with userId', async () => {
      const mockCustomerInfo = {
        entitlements: { active: {} },
      };
      Purchases.logIn.mockResolvedValue({ customerInfo: mockCustomerInfo });

      const result = await identifyUser('user-123');

      expect(Purchases.logIn).toHaveBeenCalledWith('user-123');
      expect(result.customerInfo).toBe(mockCustomerInfo);
      expect(result.error).toBeNull();
    });

    it('returns error when logIn fails', async () => {
      Purchases.logIn.mockRejectedValue(new Error('Network error'));

      const result = await identifyUser('user-123');

      expect(result.customerInfo).toBeNull();
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('logOutUser', () => {
    it('calls Purchases.logOut', async () => {
      Purchases.logOut.mockResolvedValue(undefined);

      const result = await logOutUser();

      expect(Purchases.logOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('returns error when logOut fails', async () => {
      Purchases.logOut.mockRejectedValue(new Error('Logout failed'));

      const result = await logOutUser();

      expect(result.error?.message).toBe('Logout failed');
    });
  });

  describe('addCustomerInfoListener', () => {
    it('wraps Purchases.addCustomerInfoUpdateListener', () => {
      const mockUnsubscribe = jest.fn();
      Purchases.addCustomerInfoUpdateListener.mockReturnValue(mockUnsubscribe);
      const callback = jest.fn();

      const unsubscribe = addCustomerInfoListener(callback);

      expect(Purchases.addCustomerInfoUpdateListener).toHaveBeenCalledWith(callback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});

describe('silentRestorePurchases', () => {
    it('returns hasPremium: true when restore finds active subscription', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {
            'Football IQ Pro': {
              identifier: 'Football IQ Pro',
              isActive: true,
              expirationDate: null,
            },
          },
        },
      } as unknown as CustomerInfo;
      Purchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const result = await silentRestorePurchases();

      expect(Purchases.restorePurchases).toHaveBeenCalled();
      expect(result.hasPremium).toBe(true);
      expect(result.customerInfo).toBe(mockCustomerInfo);
    });

    it('returns hasPremium: false when no active subscription found', async () => {
      const mockCustomerInfo = {
        entitlements: { active: {} },
      } as unknown as CustomerInfo;
      Purchases.restorePurchases.mockResolvedValue(mockCustomerInfo);

      const result = await silentRestorePurchases();

      expect(result.hasPremium).toBe(false);
      expect(result.customerInfo).toBe(mockCustomerInfo);
    });

    it('returns hasPremium: false when restore throws error (no purchases)', async () => {
      Purchases.restorePurchases.mockRejectedValue(new Error('No purchases to restore'));

      const result = await silentRestorePurchases();

      expect(result.hasPremium).toBe(false);
      expect(result.customerInfo).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      Purchases.restorePurchases.mockRejectedValue(new Error('Network error'));

      const result = await silentRestorePurchases();

      expect(result.hasPremium).toBe(false);
      expect(result.customerInfo).toBeNull();
    });
  });

describe('Entitlement Sync Integration', () => {
  it('overwrites existing mock premium when RevenueCat says not premium', () => {
    // Scenario: User had mock premium, RevenueCat says no entitlement
    const customerInfo = {
      entitlements: { active: {} },
    } as unknown as CustomerInfo;

    const { hasPremium } = checkPremiumEntitlement(customerInfo);

    // Should report not premium regardless of previous state
    expect(hasPremium).toBe(false);
  });

  it('grants premium when RevenueCat has active entitlement', () => {
    // Scenario: User purchases via RevenueCat
    const customerInfo = {
      entitlements: {
        active: {
          'Football IQ Pro': { isActive: true, expirationDate: null },
        },
      },
    } as unknown as CustomerInfo;

    const { hasPremium } = checkPremiumEntitlement(customerInfo);

    expect(hasPremium).toBe(true);
  });
});
