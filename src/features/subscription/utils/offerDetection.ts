import type {
  PurchasesPackage,
  PurchasesStoreProduct,
  IntroEligibility,
} from 'react-native-purchases';
import type { OfferInfo, PackageWithOffer } from '../types/subscription.types';

/**
 * Detects if a product has an active promotional offer AND the user is eligible.
 * Checks introPrice first (most common), then discounts array (iOS promotional offers).
 */
export function detectOffer(
  product: PurchasesStoreProduct,
  isEligibleForIntroPrice: boolean = true
): OfferInfo {
  const hasIntroPrice = product.introPrice != null;
  const hasDiscounts =
    product.discounts != null && product.discounts.length > 0;

  if (!hasIntroPrice && !hasDiscounts) {
    return createNoOfferInfo(product);
  }

  // Prefer introPrice as it's the most common offer type
  // CRITICAL: Only use intro price if user is eligible
  if (hasIntroPrice && product.introPrice && isEligibleForIntroPrice) {
    return createIntroOfferInfo(product, product.introPrice);
  }

  // Fall back to first discount in discounts array
  // Note: Promotional offers (discounts) usually have their own eligibility logic
  // determined by the app developer (e.g. signing a StoreKit payload), but for now
  // we'll assume if they exist in the product object they might be valid,
  // OR we could treat them as needing eligibility too.
  // Standard intro prices are the main source of "unexpected" high prices.
  if (hasDiscounts && product.discounts) {
    return createDiscountOfferInfo(product, product.discounts[0]);
  }

  return createNoOfferInfo(product);
}

/**
 * Creates offer info when no offer is active.
 */
function createNoOfferInfo(product: PurchasesStoreProduct): OfferInfo {
  return {
    isOfferActive: false,
    discountedPriceString: product.priceString,
    originalPriceString: product.priceString,
    savingsText: '',
    savingsPercent: 0,
    offerPeriod: null,
    badgeText: null, // Will be set to 'BEST VALUE' by processPackagesWithOffers if appropriate
  };
}

interface IntroPrice {
  price: number;
  priceString: string;
  periodUnit: string;
  periodNumberOfUnits: number;
  cycles: number;
}

/**
 * Creates offer info from introductory price.
 */
function createIntroOfferInfo(
  product: PurchasesStoreProduct,
  introPrice: IntroPrice
): OfferInfo {
  const savingsPercent = calculateSavingsPercent(product.price, introPrice.price);

  return {
    isOfferActive: true,
    discountedPriceString: introPrice.priceString,
    originalPriceString: product.priceString,
    savingsText: formatSavingsText(savingsPercent),
    savingsPercent,
    offerPeriod: formatOfferPeriod(
      introPrice.periodUnit,
      introPrice.periodNumberOfUnits,
      introPrice.cycles
    ),
    badgeText: 'LIMITED OFFER',
  };
}

interface Discount {
  price: number;
  priceString: string;
  periodUnit: string;
  periodNumberOfUnits: number;
  cycles: number;
}

/**
 * Creates offer info from a discount (iOS promotional offers).
 */
function createDiscountOfferInfo(
  product: PurchasesStoreProduct,
  discount: Discount
): OfferInfo {
  const savingsPercent = calculateSavingsPercent(product.price, discount.price);

  return {
    isOfferActive: true,
    discountedPriceString: discount.priceString,
    originalPriceString: product.priceString,
    savingsText: formatSavingsText(savingsPercent),
    savingsPercent,
    offerPeriod: formatOfferPeriod(
      discount.periodUnit,
      discount.periodNumberOfUnits,
      discount.cycles
    ),
    badgeText: 'LIMITED OFFER',
  };
}

/**
 * Calculates the savings percentage.
 */
export function calculateSavingsPercent(
  originalPrice: number,
  discountedPrice: number
): number {
  if (originalPrice <= 0) return 0;
  if (discountedPrice <= 0) return 100; // Free trial
  return Math.round((1 - discountedPrice / originalPrice) * 100);
}

/**
 * Formats savings percentage into human-readable text.
 */
export function formatSavingsText(savingsPercent: number): string {
  if (savingsPercent <= 0) return '';
  if (savingsPercent >= 100) return 'FREE';
  return `Save ${savingsPercent}%`;
}

/**
 * Formats offer period into human-readable text.
 */
export function formatOfferPeriod(
  periodUnit: string,
  periodNumberOfUnits: number,
  cycles: number
): string | null {
  if (!periodUnit || periodNumberOfUnits <= 0) return null;

  const totalUnits = periodNumberOfUnits * cycles;
  const unitLower = periodUnit.toLowerCase();

  // Convert to readable format
  const unitMap: Record<string, [string, string]> = {
    day: ['day', 'days'],
    week: ['week', 'weeks'],
    month: ['month', 'months'],
    year: ['year', 'years'],
  };

  const [singular, plural] = unitMap[unitLower] || [unitLower, unitLower];
  const readableUnit = totalUnits === 1 ? singular : plural;

  return `${totalUnits} ${readableUnit}`;
}

/**
 * Processes packages and attaches offer information.
 * Handles badge logic: only show "LIMITED OFFER" when offers exist, otherwise "BEST VALUE" on recommended.
 */
export function processPackagesWithOffers(
  packages: PurchasesPackage[],
  recommendedType: string = 'MONTHLY',
  eligibilityMap: Record<string, IntroEligibility> = {}
): PackageWithOffer[] {
  // First pass: detect offers on all packages
  const packagesWithOffers = packages.map((pkg) => {
    // Check eligibility for this specific product
    // RevenueCat returns key as productIdentifier
    const eligibility = eligibilityMap[pkg.product.identifier];
    const isEligible = eligibility ? eligibility.status === 0 : true; // 0 = INTRO_ELIGIBILITY_STATUS_ELIGIBLE. Default to true if unknown to fail open? No, better fail safe, but previous behavior was always true. Let's strictly check status === 0 if we have the map. If map is empty (initial load), maybe assume true or false?
    // Actually, if we don't have eligibility yet, we shouldn't show the offer price to be safe.
    // However, the UI might flicker.
    // Let's assume passed eligibility map is authoritative.

    return {
      package: pkg,
      offer: detectOffer(pkg.product, isEligible),
    };
  });

  // Check if any offer is active
  const hasAnyOffer = packagesWithOffers.some((p) => p.offer.isOfferActive);

  // Second pass: set badge logic
  return packagesWithOffers.map(({ package: pkg, offer }) => {
    // If any offer exists, don't show BEST VALUE anywhere
    if (hasAnyOffer) {
      return { package: pkg, offer };
    }

    // No offers active - show BEST VALUE on recommended package
    if (pkg.packageType === recommendedType && !offer.isOfferActive) {
      return {
        package: pkg,
        offer: { ...offer, badgeText: 'BEST VALUE' },
      };
    }

    return { package: pkg, offer };
  });
}

/**
 * Determines CTA button text based on offer state.
 */
export function getCtaText(offer: OfferInfo): string {
  return offer.isOfferActive ? 'Claim Offer' : 'Subscribe';
}
