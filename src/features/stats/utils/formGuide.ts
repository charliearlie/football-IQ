import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { FormGuideEntry, FormGuideResult } from '../types/scoutReport.types';
import { isPerfectScore, normalizeScore } from './iqCalculation';

/**
 * Calculate the form guide from the most recent 10 completed attempts.
 * Returns entries ordered most recent first.
 */
export function calculateFormGuide(attempts: AttemptWithGameMode[]): FormGuideEntry[] {
  // Sort by completed_at DESC, take last 10
  const sorted = [...attempts]
    .filter(a => a.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 10);

  return sorted.map(attempt => {
    const gameMode = attempt.game_mode as GameMode;
    let result: FormGuideResult;

    if (isPerfectScore(gameMode, attempt.metadata)) {
      result = 'perfect';
    } else if (normalizeScore(gameMode, attempt.metadata) > 0) {
      result = 'completed';
    } else {
      result = 'failed';
    }

    return {
      gameMode,
      result,
      completedAt: attempt.completed_at!,
    };
  });
}
