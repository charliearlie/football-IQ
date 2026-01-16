import { Stack } from 'expo-router';
import { StartingXIScreen } from '@/features/starting-xi';

/**
 * Static route for Starting XI - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function StartingXIIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StartingXIScreen />
    </>
  );
}
