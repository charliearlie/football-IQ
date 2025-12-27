import { useLocalSearchParams } from 'expo-router';
import { TopicalQuizScreen } from '@/features/topical-quiz';

/**
 * Dynamic route for Topical Quiz game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 */
export default function TopicalQuizRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return <TopicalQuizScreen puzzleId={puzzleId} />;
}
