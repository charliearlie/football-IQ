import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { BestDayInfo } from '../types/scoutReport.types';
import { isPerfectScore } from './iqCalculation';

/**
 * Find the user's best single day (most perfect scores).
 * Tie-breaks by most recent date.
 * Returns null if no perfects achieved.
 */
export function calculateBestDay(attempts: AttemptWithGameMode[]): BestDayInfo | null {
  // Group by puzzle_date
  const byDate = new Map<string, { total: number; perfects: number }>();

  for (const attempt of attempts) {
    const date = attempt.puzzle_date;
    const existing = byDate.get(date) ?? { total: 0, perfects: 0 };
    existing.total++;
    if (isPerfectScore(attempt.game_mode as GameMode, attempt.metadata)) {
      existing.perfects++;
    }
    byDate.set(date, existing);
  }

  // Find the best day
  let bestDate: string | null = null;
  let bestPerfects = 0;
  let bestTotal = 0;

  for (const [date, stats] of byDate) {
    if (stats.perfects > bestPerfects ||
        (stats.perfects === bestPerfects && date > (bestDate ?? ''))) {
      bestDate = date;
      bestPerfects = stats.perfects;
      bestTotal = stats.total;
    }
  }

  if (!bestDate || bestPerfects === 0) return null;

  return {
    date: bestDate,
    perfectCount: bestPerfects,
    totalGames: bestTotal,
  };
}
