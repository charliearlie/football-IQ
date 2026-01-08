import { Stack } from 'expo-router';
import { TopicalQuizScreen } from '@/features/topical-quiz';

/**
 * Static route for Topical Quiz game.
 * Loads today's quiz puzzle.
 */
export default function TopicalQuizIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TopicalQuizScreen />
    </>
  );
}
