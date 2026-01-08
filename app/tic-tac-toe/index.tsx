import { Stack } from 'expo-router';
import { TicTacToeScreen } from '@/features/tic-tac-toe';

/**
 * Static route for Tic Tac Toe - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function TicTacToeIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TicTacToeScreen />
    </>
  );
}
