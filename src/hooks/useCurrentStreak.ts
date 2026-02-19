/**
 * Lightweight hook that returns the current streak count.
 *
 * Reuses calculateStreak from useUserStats without the heavier
 * freeze management, milestone awards, and stat tracking.
 * Refreshes when onStatsChanged fires (after game completion).
 */

import { useState, useEffect } from 'react';
import { getAllCompletedAttemptsWithDates } from '@/lib/database';
import { getUsedFreezeDates } from '@/features/streaks/services/streakFreezeService';
import { calculateStreak } from '@/features/home/hooks/useUserStats';
import { onStatsChanged } from '@/lib/statsEvents';

export function useCurrentStreak(): number {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const attempts = await getAllCompletedAttemptsWithDates();
        const freezeDates = await getUsedFreezeDates();
        const { current } = calculateStreak(
          attempts.map((a) => a.puzzle_date),
          freezeDates
        );
        setStreak(current);
      } catch {
        // Don't crash if streak calculation fails
      }
    };
    load();
    return onStatsChanged(load);
  }, []);

  return streak;
}
