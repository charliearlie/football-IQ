import { Stack, useLocalSearchParams } from 'expo-router';
import { TimelineScreen } from '@/features/timeline';

export default function TimelinePuzzleRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TimelineScreen puzzleId={puzzleId} />
    </>
  );
}
