import { Stack } from 'expo-router';
import { CareerPathScreen } from '@/features/career-path';
import { PremiumOnlyGate } from '@/features/top-tens';

/**
 * Static route for Career Path Pro - uses today's puzzle.
 *
 * Career Path Pro is a premium-only game mode. Non-premium users
 * are redirected to the premium modal.
 */
export default function CareerPathProIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumOnlyGate>
        <CareerPathScreen gameMode="career_path_pro" />
      </PremiumOnlyGate>
    </>
  );
}
