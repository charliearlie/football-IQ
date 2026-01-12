import type { PurchasesPackage } from 'react-native-purchases';

/**
 * Information about an active promotional offer.
 */
export interface OfferInfo {
  /** Whether a promotional offer is currently active */
  isOfferActive: boolean;
  /** The discounted price string (e.g., "$2.99") */
  discountedPriceString: string;
  /** The original/full price string (e.g., "$5.99") */
  originalPriceString: string;
  /** Human-readable savings text (e.g., "Save 50%") */
  savingsText: string;
  /** Savings percentage as number (e.g., 50) */
  savingsPercent: number;
  /** Offer period description (e.g., "3 months") */
  offerPeriod: string | null;
  /** Badge text to display */
  badgeText: 'LIMITED OFFER' | 'BEST VALUE' | null;
}

/**
 * Package with offer information attached.
 */
export interface PackageWithOffer {
  package: PurchasesPackage;
  offer: OfferInfo;
}
