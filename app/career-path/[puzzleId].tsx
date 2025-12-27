import { useLocalSearchParams } from 'expo-router';
import { CareerPathScreen } from '@/features/career-path';

/**
 * Dynamic route for Career Path game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 */
export default function CareerPathRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return <CareerPathScreen puzzleId={puzzleId} />;
}
