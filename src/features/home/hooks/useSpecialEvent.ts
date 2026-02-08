import { useEffect, useState } from 'react';
import { SPECIAL_EVENTS, SpecialEvent } from '../config/events';

/**
 * Hook to get the currently active special event.
 * Checks the start/end dates against the current time.
 *
 * @returns The active SpecialEvent or null if none are active.
 */
export function useSpecialEvent(): SpecialEvent | null {
  const [activeEvent, setActiveEvent] = useState<SpecialEvent | null>(null);

  useEffect(() => {
    const checkEvent = () => {
      const now = new Date();
      // Find the first event that is currently active
      const current = SPECIAL_EVENTS.find(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return now >= start && now <= end;
      });
      
      setActiveEvent(current || null);
    };

    checkEvent();
    
    // Optional: Set up an interval to check periodically if the app stays open across event boundaries?
    // For now, running once on mount/render is sufficient as events are likely daily/weekly.
  }, []);

  return activeEvent;
}
