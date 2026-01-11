import { Stack } from 'expo-router';
import { TopTensScreen, PremiumOnlyGate } from '@/features/top-tens';

/**
 * Static route for Top Tens - uses today's puzzle.
 *
 * Top Tens is a premium-only game mode. Non-premium users
 * are redirected to the premium modal.
 */
export default function TopTensIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumOnlyGate>
        <TopTensScreen />
      </PremiumOnlyGate>
    </>
  );
}
