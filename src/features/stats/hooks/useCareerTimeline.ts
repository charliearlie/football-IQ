import { useState, useEffect, useCallback } from 'react';
import { getTierHistory } from '@/lib/database';
import { TierHistoryEntry } from '../types/scoutReport.types';

export function useCareerTimeline() {
  const [history, setHistory] = useState<TierHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = await getTierHistory();
      setHistory(
        rows.map(r => ({
          id: r.id,
          tierNumber: r.tier_number,
          tierName: r.tier_name,
          reachedAt: r.reached_at,
          totalIqAtTransition: r.total_iq_at_transition,
        }))
      );
    } catch (err) {
      console.error('Failed to load tier history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { history, isLoading, refresh: load };
}
