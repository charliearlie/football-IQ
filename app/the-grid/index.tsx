import { Stack } from 'expo-router';
import { TheGridScreen } from '@/features/the-grid';

/**
 * Static route for The Grid - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function TheGridIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TheGridScreen />
    </>
  );
}
