import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TicTacToeScreen } from '@/features/tic-tac-toe';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Tic Tac Toe game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Supports review mode via `?review=true` query parameter.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TicTacToeRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; puzzleDate?: string; review?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const puzzleDate = extractSingleParam(params.puzzleDate);
  const isReviewMode = params.review === 'true';

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/tic-tac-toe" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId} puzzleDate={puzzleDate} gameMode="tic_tac_toe">
        <TicTacToeScreen puzzleId={puzzleId} isReviewMode={isReviewMode} />
      </PremiumGate>
    </>
  );
}
