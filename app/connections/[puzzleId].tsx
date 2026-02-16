import { Stack, useLocalSearchParams } from 'expo-router';
import { ConnectionsScreen } from '@/features/connections';

export default function ConnectionsPuzzleRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ConnectionsScreen puzzleId={puzzleId} />
    </>
  );
}
