import { Stack } from 'expo-router';
import { TimelineScreen } from '@/features/timeline';

export default function TimelineIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TimelineScreen />
    </>
  );
}
