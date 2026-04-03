import { Stack } from 'expo-router';
import { BalldeScreen } from '@/features/balldle';

/**
 * Static route for Balldle — uses today's puzzle.
 */
export default function BalldeIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BalldeScreen />
    </>
  );
}
