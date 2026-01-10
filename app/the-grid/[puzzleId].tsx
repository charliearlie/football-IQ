import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TheGridScreen } from '@/features/the-grid';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for The Grid game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TheGridRoute() {
  const params = useLocalSearchParams<{ puzzleId: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/the-grid" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId}>
        <TheGridScreen puzzleId={puzzleId} />
      </PremiumGate>
    </>
  );
}
