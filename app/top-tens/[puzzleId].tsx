import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { TopTensScreen, PremiumOnlyGate } from '@/features/top-tens';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Top Tens game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Supports review mode via `?review=true` query parameter.
 *
 * Top Tens is a premium-only game mode. Non-premium users
 * are redirected to the premium modal regardless of puzzle date.
 */
export default function TopTensRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; review?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const isReviewMode = params.review === 'true';

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/top-tens" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumOnlyGate>
        <TopTensScreen puzzleId={puzzleId} isReviewMode={isReviewMode} />
      </PremiumOnlyGate>
    </>
  );
}
