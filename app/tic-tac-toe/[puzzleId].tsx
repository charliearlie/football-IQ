import { useLocalSearchParams } from 'expo-router';
import { PremiumGate } from '@/features/auth';
import { TicTacToeScreen } from '@/features/tic-tac-toe';

/**
 * Dynamic route for Tic Tac Toe game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 *
 * Wrapped with PremiumGate for defense-in-depth protection:
 * - Prevents deep-link bypass of premium gating
 * - Shows upsell modal if puzzle is locked for free users
 */
export default function TicTacToeRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return (
    <PremiumGate puzzleId={puzzleId}>
      <TicTacToeScreen puzzleId={puzzleId} />
    </PremiumGate>
  );
}
