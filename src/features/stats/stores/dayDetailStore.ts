/**
 * Module-level store for passing CalendarDay data to the
 * day-detail-sheet formSheet route.
 *
 * Set before navigation, read by the route on mount.
 * Avoids serializing complex gameModes array into URL params.
 */
import { CalendarDay } from '../types/calendar.types';

let _pendingDay: CalendarDay | null = null;

export function setDayDetailData(day: CalendarDay): void {
  _pendingDay = day;
}

export function getDayDetailData(): CalendarDay | null {
  return _pendingDay;
}

export function clearDayDetailData(): void {
  _pendingDay = null;
}
