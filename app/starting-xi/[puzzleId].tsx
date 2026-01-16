import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { StartingXIScreen } from '@/features/starting-xi';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Starting XI game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function StartingXIRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; puzzleDate?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const puzzleDate = extractSingleParam(params.puzzleDate);

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/starting-xi" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId} puzzleDate={puzzleDate}>
        <StartingXIScreen puzzleId={puzzleId} />
      </PremiumGate>
    </>
  );
}
