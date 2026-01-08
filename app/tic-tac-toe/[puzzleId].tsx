import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TicTacToeScreen } from '@/features/tic-tac-toe';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Tic Tac Toe game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TicTacToeRoute() {
  const params = useLocalSearchParams<{ puzzleId: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/tic-tac-toe" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId}>
        <TicTacToeScreen puzzleId={puzzleId} />
      </PremiumGate>
    </>
  );
}
