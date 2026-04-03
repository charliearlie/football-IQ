import { Stack } from 'expo-router';
import { HigherLowerScreen } from '@/features/higher-lower';

/**
 * Static route for Higher/Lower — uses today's puzzle.
 */
export default function HigherLowerIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HigherLowerScreen />
    </>
  );
}
