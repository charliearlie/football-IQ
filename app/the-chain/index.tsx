import { Stack } from 'expo-router';
import { TheChainScreen } from '@/features/the-chain';

/**
 * Static route for The Chain - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function TheChainIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TheChainScreen />
    </>
  );
}
