import { Stack } from 'expo-router';
import { TopTensScreen, LastTensGate } from '@/features/top-tens';

/**
 * Static route for Last 10 — uses today's puzzle.
 *
 * Last 10 reuses the Top Tens engine. First play is free for everyone;
 * subsequent puzzles require premium (handled by LastTensGate).
 */
export default function LastTensIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LastTensGate>
        <TopTensScreen gameMode="last_tens" />
      </LastTensGate>
    </>
  );
}
