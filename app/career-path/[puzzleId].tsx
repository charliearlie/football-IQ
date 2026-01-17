import { useLocalSearchParams, Redirect, Stack } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { CareerPathScreen } from '@/features/career-path';
import { extractSingleParam } from '@/lib/routeParams';

/**
 * Dynamic route for Career Path game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Supports review mode via `?review=true` query parameter.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function CareerPathRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; puzzleDate?: string; review?: string }>();
  const puzzleId = extractSingleParam(params.puzzleId);
  const puzzleDate = extractSingleParam(params.puzzleDate);
  const isReviewMode = params.review === 'true';

  // Guard against missing puzzleId (malformed deep links)
  if (!puzzleId) {
    return <Redirect href="/career-path" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId} puzzleDate={puzzleDate} gameMode="career_path">
        <CareerPathScreen puzzleId={puzzleId} isReviewMode={isReviewMode} />
      </PremiumGate>
    </>
  );
}
