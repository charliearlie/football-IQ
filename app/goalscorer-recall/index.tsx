import { GoalscorerRecallScreen } from '@/features/goalscorer-recall';

/**
 * Static route for Goalscorer Recall - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function GoalscorerRecallIndexRoute() {
  return <GoalscorerRecallScreen />;
}
