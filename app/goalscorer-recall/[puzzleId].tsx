import { Stack, useLocalSearchParams } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { GoalscorerRecallScreen } from '@/features/goalscorer-recall';

/**
 * Dynamic route for Goalscorer Recall game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function GoalscorerRecallRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGate puzzleId={puzzleId}>
        <GoalscorerRecallScreen puzzleId={puzzleId} />
      </PremiumGate>
    </>
  );
}
