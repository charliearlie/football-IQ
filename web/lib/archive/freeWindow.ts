/**
 * Free-access window for archive puzzles.
 *
 * Mirrors the mobile constant in `src/features/archive/utils/dateGrouping.ts`.
 * The window includes today + the (N-1) previous days, so the default
 * `FREE_WINDOW_DAYS = 3` means today and the last two days are free.
 */
export const FREE_WINDOW_DAYS = 3;

/**
 * Today's date as a `YYYY-MM-DD` string in the server's local timezone.
 * Centralised so tests can stub it via vi.useFakeTimers().
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Returns true when a puzzle date is inside the free-access window
 * (today inclusive). Accepts ISO-date strings; ignores time-of-day.
 */
export function isWithinFreeWindow(
  puzzleDate: string,
  today: string = getTodayDateString(),
  windowDays: number = FREE_WINDOW_DAYS,
): boolean {
  // YYYY-MM-DD strings compare lexicographically in date order.
  const puzzleMs = Date.parse(puzzleDate);
  const todayMs = Date.parse(today);
  if (Number.isNaN(puzzleMs) || Number.isNaN(todayMs)) return false;

  const diffDays = Math.floor((todayMs - puzzleMs) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < windowDays;
}

/**
 * Master "is this day locked" predicate for the archive UI.
 * Mirrors `isPuzzleLocked` on mobile minus the rewarded-ad path (web doesn't
 * support AdSense rewarded surfaces, so we offer upgrade-only per the spec).
 */
export function isPuzzleLocked(args: {
  puzzleDate: string;
  isPremium: boolean;
  today?: string;
  /** Whether the user has already completed this puzzle (permanent unlock). */
  hasCompletedAttempt?: boolean;
}): boolean {
  if (args.hasCompletedAttempt) return false;
  if (args.isPremium) return false;
  if (isWithinFreeWindow(args.puzzleDate, args.today)) return false;
  return true;
}
