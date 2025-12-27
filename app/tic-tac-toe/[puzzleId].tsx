import { useLocalSearchParams } from 'expo-router';
import { TicTacToeScreen } from '@/features/tic-tac-toe';

/**
 * Dynamic route for Tic Tac Toe game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 */
export default function TicTacToeRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return <TicTacToeScreen puzzleId={puzzleId} />;
}
