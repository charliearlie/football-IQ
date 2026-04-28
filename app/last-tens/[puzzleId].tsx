import { useLocalSearchParams, Redirect, Stack, Href } from 'expo-router';
import { TopTensScreen, LastTensGate } from '@/features/top-tens';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Last 10 with a specific puzzle ID.
 * Supports review mode via `?review=true`.
 */
export default function LastTensRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; review?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const isReviewMode = params.review === 'true';

  if (!puzzleId) {
    // Type-cast: expo-router's auto-generated route map regenerates on
    // `expo start`; until then the new `/last-tens` route is absent.
    return <Redirect href={'/last-tens' as Href} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LastTensGate puzzleId={puzzleId}>
        <TopTensScreen
          puzzleId={puzzleId}
          isReviewMode={isReviewMode}
          gameMode="last_tens"
        />
      </LastTensGate>
    </>
  );
}
