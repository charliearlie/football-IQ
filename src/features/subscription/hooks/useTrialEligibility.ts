/**
 * Trial Eligibility Hook
 *
 * Checks whether the user is eligible for a free trial via RevenueCat.
 * Used on the home screen to show "TRY FREE" instead of "GO PRO" on locked cards.
 * Caches result for the session — trial eligibility doesn't change mid-session.
 */

import { useState, useEffect, useRef } from 'react';
import Purchases, { INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import { PREMIUM_OFFERING_ID } from '@/config/revenueCat';

interface TrialEligibilityResult {
  /** Whether the user can start a free trial */
  isTrialEligible: boolean;
  /** Whether eligibility is still being checked */
  isLoading: boolean;
}

/** Module-level cache — persists across remounts within the same session */
let cachedResult: boolean | null = null;

export function useTrialEligibility(): TrialEligibilityResult {
  const [isTrialEligible, setIsTrialEligible] = useState(cachedResult ?? false);
  const [isLoading, setIsLoading] = useState(cachedResult === null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Skip if already cached
    if (cachedResult !== null) return;

    async function check() {
      try {
        const offerings = await Purchases.getOfferings();
        const offering = offerings.all[PREMIUM_OFFERING_ID] || offerings.current;

        if (!offering?.availablePackages.length) {
          if (isMounted.current) {
            cachedResult = false;
            setIsTrialEligible(false);
            setIsLoading(false);
          }
          return;
        }

        const productIds = offering.availablePackages.map(p => p.product.identifier);
        const eligibilityMap = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);

        // Trial eligible if ANY product has an eligible intro offer
        const eligible = Object.values(eligibilityMap).some(
          e => e.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        );

        if (isMounted.current) {
          cachedResult = eligible;
          setIsTrialEligible(eligible);
          setIsLoading(false);
        }
      } catch {
        // Safe fallback: show "GO PRO" (not trial)
        if (isMounted.current) {
          cachedResult = false;
          setIsTrialEligible(false);
          setIsLoading(false);
        }
      }
    }

    check();

    return () => {
      isMounted.current = false;
    };
  }, []);

  return { isTrialEligible, isLoading };
}
