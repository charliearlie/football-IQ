import { Stack, useLocalSearchParams } from 'expo-router';
import { ConnectionsScreen } from '@/features/connections';

/**
 * Dynamic route for Connections game with specific puzzle ID.
 *
 * Supports review mode via `?review=true` query parameter.
 */
export default function ConnectionsPuzzleRoute() {
  const params = useLocalSearchParams<{ puzzleId: string; review?: string }>();
  const isReviewMode = params.review === 'true';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ConnectionsScreen puzzleId={params.puzzleId} isReviewMode={isReviewMode} />
    </>
  );
}
