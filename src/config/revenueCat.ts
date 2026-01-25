/**
 * RevenueCat Configuration
 *
 * Provides environment-specific API keys for RevenueCat SDK.
 *
 * Environment selection priority:
 * 1. EXPO_PUBLIC_REVENUECAT_ENV override ('sandbox' or 'production')
 * 2. __DEV__ flag (true = sandbox, false = production)
 *
 * IMPORTANT for TestFlight:
 * - TestFlight has __DEV__ = false (production build)
 * - But sandbox Apple accounts create purchases in RevenueCat SANDBOX
 * - To test IAP on TestFlight, set EXPO_PUBLIC_REVENUECAT_ENV=sandbox in build
 */

/**
 * RevenueCat API keys per environment.
 */
export const REVENUECAT_API_KEYS = {
  /** Sandbox API key for development/testing */
  sandbox: 'test_otNRIIDWLJwJlzISdCbUzGtwwlD',
  /** Production API key for App Store releases */
  production: 'appl_QWyaHOEVWcyFzTWkykxesWlqhDo',
} as const;

/**
 * The offering identifier configured in RevenueCat dashboard.
 * Note: This is the human-readable identifier, NOT the internal ID (ofrng...).
 */
export const PREMIUM_OFFERING_ID = 'default_offering';

/**
 * The entitlement identifier that grants premium access.
 * Must match the entitlement ID in RevenueCat dashboard exactly.
 */
export const PREMIUM_ENTITLEMENT_ID = 'Football IQ Pro';

/**
 * Determines the current RevenueCat environment.
 *
 * @returns 'sandbox' or 'production'
 */
export function getRevenueCatEnvironment(): 'sandbox' | 'production' {
  // Check for explicit environment override (useful for TestFlight testing)
  const envOverride = process.env.EXPO_PUBLIC_REVENUECAT_ENV;
  if (envOverride === 'sandbox' || envOverride === 'production') {
    return envOverride;
  }

  // Default: sandbox in development, production otherwise
  return __DEV__ ? 'sandbox' : 'production';
}

/**
 * Returns the appropriate RevenueCat API key based on environment.
 *
 * @returns The sandbox key in development/testing, production key for App Store
 */
export function getRevenueCatApiKey(): string {
  const env = getRevenueCatEnvironment();
  return REVENUECAT_API_KEYS[env];
}
