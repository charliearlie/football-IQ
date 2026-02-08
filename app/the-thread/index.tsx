import { Stack } from "expo-router";
import { TheThreadScreen } from "@/features/the-thread";

/**
 * Static route for The Thread - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function TheThreadIndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TheThreadScreen />
    </>
  );
}
