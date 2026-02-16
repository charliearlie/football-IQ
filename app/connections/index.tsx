import { Stack } from 'expo-router';
import { ConnectionsScreen } from '@/features/connections';

export default function ConnectionsIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ConnectionsScreen />
    </>
  );
}
