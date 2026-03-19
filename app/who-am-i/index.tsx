import { Stack } from 'expo-router';
import { WhoAmIScreen } from '@/features/who-am-i';

/**
 * Static route for Who Am I? - uses today's puzzle.
 */
export default function WhoAmIIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WhoAmIScreen />
    </>
  );
}
