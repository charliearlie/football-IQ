/**
 * RevenueCat Configuration
 *
 * Provides environment-specific API keys for RevenueCat SDK.
 * Uses __DEV__ to differentiate between sandbox and production.
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
 * The offering ID configured in RevenueCat dashboard.
 */
export const PREMIUM_OFFERING_ID = 'ofrng32f02b6286';

/**
 * The entitlement identifier that grants premium access.
 */
export const PREMIUM_ENTITLEMENT_ID = 'premium_access';

/**
 * Returns the appropriate RevenueCat API key based on environment.
 * Uses __DEV__ global to determine environment.
 *
 * @returns The sandbox key in development, production key otherwise
 */
export function getRevenueCatApiKey(): string {
  return __DEV__ ? REVENUECAT_API_KEYS.sandbox : REVENUECAT_API_KEYS.production;
}
