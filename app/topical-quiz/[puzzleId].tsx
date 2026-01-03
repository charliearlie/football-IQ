import { useLocalSearchParams } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TopicalQuizScreen } from '@/features/topical-quiz';

/**
 * Dynamic route for Topical Quiz game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TopicalQuizRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return (
    <PremiumGate puzzleId={puzzleId}>
      <TopicalQuizScreen puzzleId={puzzleId} />
    </PremiumGate>
  );
}
