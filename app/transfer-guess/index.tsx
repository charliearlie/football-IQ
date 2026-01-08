import { Stack } from 'expo-router';
import { TransferGuessScreen } from '@/features/transfer-guess';

/**
 * Static route for Transfer Guess - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function TransferGuessIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TransferGuessScreen />
    </>
  );
}
