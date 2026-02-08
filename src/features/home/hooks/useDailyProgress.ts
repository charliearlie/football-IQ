import { DailyPuzzleCard } from './useDailyPuzzles';

export interface DailyProgressResult {
  percent: number;
  completedCount: number;
  totalCount: number;
  countString: string;
  isComplete: boolean;
}

/**
 * Calculates daily progress based on puzzle cards.
 *
 * @param cards - Array of daily puzzle cards
 * @returns Progress object with percentage and formatted string
 */
export function useDailyProgress(cards: DailyPuzzleCard[]): DailyProgressResult {
  if (!cards || cards.length === 0) {
    return {
      percent: 0,
      completedCount: 0,
      totalCount: 0,
      countString: '0 / 0',
      isComplete: false,
    };
  }

  const totalCount = cards.length;
  // Filter for cards that are 'done'
  const completedCount = cards.filter((card) => card.status === 'done').length;
  
  const percent = Math.round((completedCount / totalCount) * 100);
  
  return {
    percent,
    completedCount,
    totalCount,
    countString: `${completedCount} / ${totalCount}`,
    isComplete: completedCount === totalCount && totalCount > 0,
  };
}
