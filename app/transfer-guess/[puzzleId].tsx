import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TransferGuessScreen } from '@/features/transfer-guess';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Transfer Guess game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Supports review mode via `?review=true` query parameter.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TransferGuessRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; puzzleDate?: string; review?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const puzzleDate = extractSingleParam(params.puzzleDate);
  const isReviewMode = params.review === 'true';

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/transfer-guess" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId} puzzleDate={puzzleDate} gameMode="guess_the_transfer">
        <TransferGuessScreen puzzleId={puzzleId} isReviewMode={isReviewMode} />
      </PremiumGate>
    </>
  );
}
