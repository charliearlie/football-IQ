import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { BalldeScreen } from '@/features/balldle';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Balldle game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection.
 */
export default function BalldeRoute() {
  const params = useLocalSearchParams<{
    puzzleId: string;
    puzzleDate?: string;
    review?: string;
  }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const puzzleDate = extractSingleParam(params.puzzleDate);
  const isReviewMode = params.review === 'true';

  if (!puzzleId) {
    return <Redirect href="/balldle" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId} puzzleDate={puzzleDate} gameMode="balldle">
        <BalldeScreen puzzleId={puzzleId} isReviewMode={isReviewMode} />
      </PremiumGate>
    </>
  );
}
