import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { CareerPathScreen } from '@/features/career-path';
import { PremiumOnlyGate } from '@/features/top-tens';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Career Path Pro game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Supports review mode via `?review=true` query parameter.
 *
 * Career Path Pro is a premium-only game mode. Non-premium users
 * are redirected to the premium modal regardless of puzzle date.
 */
export default function CareerPathProRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; review?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const isReviewMode = params.review === 'true';

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/career-path-pro" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumOnlyGate>
        <CareerPathScreen
          puzzleId={puzzleId}
          isReviewMode={isReviewMode}
          gameMode="career_path_pro"
        />
      </PremiumOnlyGate>
    </>
  );
}
