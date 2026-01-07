import { useLocalSearchParams, Redirect } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TransferGuessScreen } from '@/features/transfer-guess';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Transfer Guess game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TransferGuessRoute() {
  const params = useLocalSearchParams<{ puzzleId: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/transfer-guess" />;
  }

  return (
    <PremiumGate puzzleId={puzzleId}>
      <TransferGuessScreen puzzleId={puzzleId} />
    </PremiumGate>
  );
}
