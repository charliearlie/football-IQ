// Types
export type { OfferInfo, PackageWithOffer } from './types/subscription.types';

// Utilities
export {
  detectOffer,
  calculateSavingsPercent,
  formatSavingsText,
  formatOfferPeriod,
  processPackagesWithOffers,
  getCtaText,
} from './utils/offerDetection';
