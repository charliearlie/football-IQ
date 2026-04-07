import { Stack } from 'expo-router';
import { WhosThatScreen } from '@/features/whos-that';

/**
 * Static route for Who's That? — uses today's puzzle.
 */
export default function WhosThatIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WhosThatScreen />
    </>
  );
}
