import type {
  PurchasesStoreProduct,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  detectOffer,
  calculateSavingsPercent,
  formatSavingsText,
  formatOfferPeriod,
  processPackagesWithOffers,
  getCtaText,
} from '../utils/offerDetection';
import type { OfferInfo } from '../types/subscription.types';

// Helper to create mock product
function createMockProduct(
  overrides: Partial<PurchasesStoreProduct> = {}
): PurchasesStoreProduct {
  return {
    identifier: 'com.app.monthly',
    title: 'Monthly Subscription',
    description: 'Full access for one month',
    price: 5.99,
    priceString: '$5.99',
    currencyCode: 'USD',
    introPrice: null,
    discounts: null,
    productCategory: null,
    productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
    subscriptionPeriod: 'P1M',
    ...overrides,
  } as PurchasesStoreProduct;
}

// Helper to create mock intro price
function createMockIntroPrice(overrides: Record<string, unknown> = {}) {
  return {
    price: 2.99,
    priceString: '$2.99',
    cycles: 1,
    period: 'P1M',
    periodUnit: 'MONTH',
    periodNumberOfUnits: 1,
    ...overrides,
  };
}

// Helper to create mock package
function createMockPackage(
  packageType: string = 'MONTHLY',
  productOverrides: Partial<PurchasesStoreProduct> = {}
): PurchasesPackage {
  return {
    identifier: `$rc_${packageType.toLowerCase()}`,
    packageType,
    product: createMockProduct(productOverrides),
    offeringIdentifier: 'default_offering',
    presentedOfferingContext: {
      offeringIdentifier: 'default_offering',
      placementIdentifier: null,
      targetingContext: null,
    },
  } as PurchasesPackage;
}

describe('detectOffer', () => {
  describe('when no offer exists', () => {
    it('returns isOfferActive: false', () => {
      const product = createMockProduct();
      const result = detectOffer(product);

      expect(result.isOfferActive).toBe(false);
    });

    it('returns same price for both original and discounted', () => {
      const product = createMockProduct({ priceString: '$5.99' });
      const result = detectOffer(product);

      expect(result.originalPriceString).toBe('$5.99');
      expect(result.discountedPriceString).toBe('$5.99');
    });

    it('returns empty savings text', () => {
      const product = createMockProduct();
      const result = detectOffer(product);

      expect(result.savingsText).toBe('');
      expect(result.savingsPercent).toBe(0);
    });

    it('returns null badge text', () => {
      const product = createMockProduct();
      const result = detectOffer(product);

      expect(result.badgeText).toBeNull();
    });
  });

  describe('when introductory offer exists', () => {
    it('returns isOfferActive: true', () => {
      const product = createMockProduct({
        introPrice: createMockIntroPrice(),
      });
      const result = detectOffer(product);

      expect(result.isOfferActive).toBe(true);
    });

    it('returns correct discounted and original prices', () => {
      const product = createMockProduct({
        price: 5.99,
        priceString: '$5.99',
        introPrice: createMockIntroPrice({
          price: 2.99,
          priceString: '$2.99',
        }),
      });
      const result = detectOffer(product);

      expect(result.originalPriceString).toBe('$5.99');
      expect(result.discountedPriceString).toBe('$2.99');
    });

    it('calculates correct savings percentage', () => {
      const product = createMockProduct({
        price: 10.0,
        introPrice: createMockIntroPrice({ price: 5.0 }),
      });
      const result = detectOffer(product);

      expect(result.savingsPercent).toBe(50);
      expect(result.savingsText).toBe('Save 50%');
    });

    it('returns LIMITED OFFER badge', () => {
      const product = createMockProduct({
        introPrice: createMockIntroPrice(),
      });
      const result = detectOffer(product);

      expect(result.badgeText).toBe('LIMITED OFFER');
    });

    it('formats offer period correctly', () => {
      const product = createMockProduct({
        introPrice: createMockIntroPrice({
          periodUnit: 'MONTH',
          periodNumberOfUnits: 3,
          cycles: 1,
        }),
      });
      const result = detectOffer(product);

      expect(result.offerPeriod).toBe('3 months');
    });
  });

  describe('free trial offers', () => {
    it('shows FREE for 100% discount', () => {
      const product = createMockProduct({
        price: 5.99,
        introPrice: createMockIntroPrice({
          price: 0,
          priceString: '$0.00',
        }),
      });
      const result = detectOffer(product);

      expect(result.savingsPercent).toBe(100);
      expect(result.savingsText).toBe('FREE');
    });
  });

  describe('when discounts array exists (iOS promotional offers)', () => {
    it('returns isOfferActive: true when discounts present', () => {
      const product = createMockProduct({
        introPrice: null,
        discounts: [
          {
            identifier: 'promo_1',
            price: 3.99,
            priceString: '$3.99',
            cycles: 1,
            period: 'P1M',
            periodUnit: 'MONTH',
            periodNumberOfUnits: 1,
          },
        ],
      });
      const result = detectOffer(product);

      expect(result.isOfferActive).toBe(true);
    });

    it('prefers introPrice over discounts when both exist', () => {
      const product = createMockProduct({
        price: 10.0,
        priceString: '$10.00',
        introPrice: createMockIntroPrice({
          price: 2.0,
          priceString: '$2.00',
        }),
        discounts: [
          {
            identifier: 'promo_1',
            price: 5.0,
            priceString: '$5.00',
            cycles: 1,
            period: 'P1M',
            periodUnit: 'MONTH',
            periodNumberOfUnits: 1,
          },
        ],
      });
      const result = detectOffer(product);

      // Should use introPrice, not discounts
      expect(result.discountedPriceString).toBe('$2.00');
      expect(result.savingsPercent).toBe(80);
    });
  });
});

describe('calculateSavingsPercent', () => {
  it('calculates 50% savings correctly', () => {
    expect(calculateSavingsPercent(10, 5)).toBe(50);
  });

  it('calculates 25% savings correctly', () => {
    expect(calculateSavingsPercent(8, 6)).toBe(25);
  });

  it('rounds to nearest integer', () => {
    expect(calculateSavingsPercent(10, 3.33)).toBe(67);
  });

  it('returns 0 for same price', () => {
    expect(calculateSavingsPercent(5, 5)).toBe(0);
  });

  it('returns 100 for free', () => {
    expect(calculateSavingsPercent(5, 0)).toBe(100);
  });

  it('handles zero original price gracefully', () => {
    expect(calculateSavingsPercent(0, 5)).toBe(0);
  });

  it('handles negative prices gracefully', () => {
    expect(calculateSavingsPercent(-5, 3)).toBe(0);
  });
});

describe('formatSavingsText', () => {
  it('formats regular savings', () => {
    expect(formatSavingsText(50)).toBe('Save 50%');
  });

  it('returns FREE for 100%', () => {
    expect(formatSavingsText(100)).toBe('FREE');
  });

  it('returns empty string for 0', () => {
    expect(formatSavingsText(0)).toBe('');
  });

  it('returns empty string for negative', () => {
    expect(formatSavingsText(-10)).toBe('');
  });
});

describe('formatOfferPeriod', () => {
  it('formats single month', () => {
    expect(formatOfferPeriod('MONTH', 1, 1)).toBe('1 month');
  });

  it('formats multiple months', () => {
    expect(formatOfferPeriod('MONTH', 3, 1)).toBe('3 months');
  });

  it('multiplies by cycles', () => {
    expect(formatOfferPeriod('WEEK', 1, 4)).toBe('4 weeks');
  });

  it('handles year period', () => {
    expect(formatOfferPeriod('YEAR', 1, 1)).toBe('1 year');
  });

  it('handles day period', () => {
    expect(formatOfferPeriod('DAY', 7, 1)).toBe('7 days');
  });

  it('returns null for invalid input', () => {
    expect(formatOfferPeriod('', 0, 0)).toBeNull();
  });

  it('returns null for zero units', () => {
    expect(formatOfferPeriod('MONTH', 0, 1)).toBeNull();
  });
});

describe('processPackagesWithOffers', () => {
  it('attaches offer info to each package', () => {
    const packages = [createMockPackage('MONTHLY'), createMockPackage('ANNUAL')];

    const result = processPackagesWithOffers(packages);

    expect(result).toHaveLength(2);
    expect(result[0].offer).toBeDefined();
    expect(result[1].offer).toBeDefined();
  });

  it('sets BEST VALUE badge on recommended package when no offers active', () => {
    const packages = [createMockPackage('MONTHLY'), createMockPackage('ANNUAL')];

    const result = processPackagesWithOffers(packages, 'MONTHLY');

    expect(result[0].offer.badgeText).toBe('BEST VALUE');
    expect(result[1].offer.badgeText).toBeNull();
  });

  it('removes BEST VALUE when any offer is active', () => {
    const annualProduct = createMockPackage('ANNUAL', {
      identifier: 'com.app.annual',
      introPrice: createMockIntroPrice(),
    });
    const packages = [
      createMockPackage('MONTHLY'),
      annualProduct,
    ];
    const eligibility = {
      'com.app.annual': { status: 2, description: 'ELIGIBLE' },
    };

    const result = processPackagesWithOffers(packages, 'MONTHLY', eligibility);

    // Monthly should NOT have BEST VALUE because Annual has an offer
    expect(result[0].offer.badgeText).toBeNull();
    // Annual should have LIMITED OFFER
    expect(result[1].offer.badgeText).toBe('LIMITED OFFER');
  });

  it('handles multiple offers - each shows LIMITED OFFER', () => {
    const packages = [
      createMockPackage('MONTHLY', {
        identifier: 'com.app.monthly',
        introPrice: createMockIntroPrice({ price: 2.99, priceString: '$2.99' }),
      }),
      createMockPackage('ANNUAL', {
        identifier: 'com.app.annual',
        introPrice: createMockIntroPrice({ price: 14.99, priceString: '$14.99' }),
      }),
    ];
    const eligibility = {
      'com.app.monthly': { status: 2, description: 'ELIGIBLE' },
      'com.app.annual': { status: 2, description: 'ELIGIBLE' },
    };

    const result = processPackagesWithOffers(packages, 'MONTHLY', eligibility);

    expect(result[0].offer.badgeText).toBe('LIMITED OFFER');
    expect(result[1].offer.badgeText).toBe('LIMITED OFFER');
  });

  it('preserves package reference in result', () => {
    const packages = [createMockPackage('MONTHLY')];

    const result = processPackagesWithOffers(packages);

    expect(result[0].package).toBe(packages[0]);
  });

  describe('eligibility map handling', () => {
    const annualWithIntro = createMockPackage('ANNUAL', {
      identifier: 'com.app.annual',
      price: 17.99,
      priceString: '$17.99',
      introPrice: createMockIntroPrice({ price: 9.99, priceString: '$9.99' }),
    });

    it('shows intro price when user is eligible (status 2)', () => {
      const eligibility = {
        'com.app.annual': { status: 2, description: 'ELIGIBLE' },
      };

      const result = processPackagesWithOffers([annualWithIntro], 'ANNUAL', eligibility);

      expect(result[0].offer.isOfferActive).toBe(true);
      expect(result[0].offer.discountedPriceString).toBe('$9.99');
      expect(result[0].offer.originalPriceString).toBe('$17.99');
    });

    it('hides intro price when user is ineligible (status 1)', () => {
      const eligibility = {
        'com.app.annual': { status: 1, description: 'INELIGIBLE' },
      };

      const result = processPackagesWithOffers([annualWithIntro], 'ANNUAL', eligibility);

      expect(result[0].offer.isOfferActive).toBe(false);
      expect(result[0].offer.discountedPriceString).toBe('$17.99');
    });

    it('hides intro price when status is unknown (status 0)', () => {
      const eligibility = {
        'com.app.annual': { status: 0, description: 'UNKNOWN' },
      };

      const result = processPackagesWithOffers([annualWithIntro], 'ANNUAL', eligibility);

      expect(result[0].offer.isOfferActive).toBe(false);
      expect(result[0].offer.discountedPriceString).toBe('$17.99');
    });

    it('hides intro price when eligibility map is empty', () => {
      const result = processPackagesWithOffers([annualWithIntro], 'ANNUAL', {});

      expect(result[0].offer.isOfferActive).toBe(false);
      expect(result[0].offer.discountedPriceString).toBe('$17.99');
    });
  });
});

describe('getCtaText', () => {
  it('returns "Claim Offer" when offer is active', () => {
    const offer: OfferInfo = {
      isOfferActive: true,
      discountedPriceString: '$2.99',
      originalPriceString: '$5.99',
      savingsText: 'Save 50%',
      savingsPercent: 50,
      offerPeriod: '1 month',
      badgeText: 'LIMITED OFFER',
    };

    expect(getCtaText(offer)).toBe('Claim Offer');
  });

  it('returns "Subscribe" when no offer', () => {
    const offer: OfferInfo = {
      isOfferActive: false,
      discountedPriceString: '$5.99',
      originalPriceString: '$5.99',
      savingsText: '',
      savingsPercent: 0,
      offerPeriod: null,
      badgeText: null,
    };

    expect(getCtaText(offer)).toBe('Subscribe');
  });
});
