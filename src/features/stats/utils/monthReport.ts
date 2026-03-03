import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { MonthReport } from '../types/scoutReport.types';
import { isPerfectScore } from './iqCalculation';

/**
 * Calculate stats for the current calendar month.
 */
export function calculateMonthReport(attempts: AttemptWithGameMode[]): MonthReport {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Filter attempts to current month by puzzle_date
  const monthAttempts = attempts.filter(a => {
    const date = new Date(a.puzzle_date);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  // Count unique days played
  const uniqueDays = new Set(monthAttempts.map(a => a.puzzle_date));

  // Count perfects
  let perfectScores = 0;
  let iqEarned = 0;
  for (const attempt of monthAttempts) {
    if (isPerfectScore(attempt.game_mode as GameMode, attempt.metadata)) {
      perfectScores++;
    }
    iqEarned += attempt.score ?? 0;
  }

  return {
    gamesPlayed: monthAttempts.length,
    perfectScores,
    iqEarned: Math.round(iqEarned),
    daysPlayed: uniqueDays.size,
    totalDaysInMonth,
    monthLabel,
  };
}
