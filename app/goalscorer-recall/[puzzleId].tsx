import { useLocalSearchParams } from 'expo-router';
import { GoalscorerRecallScreen } from '@/features/goalscorer-recall';

/**
 * Dynamic route for Goalscorer Recall game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 */
export default function GoalscorerRecallRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return <GoalscorerRecallScreen puzzleId={puzzleId} />;
}
