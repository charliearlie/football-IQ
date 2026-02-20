/**
 * localStorage-based play session tracker for web games.
 *
 * Tracks which games a user has played today (per device)
 * to enforce the one-play-per-day gate and personalize CTAs.
 *
 * Key format: footballiq_played_{gameSlug}_{YYYY-MM-DD}
 */

const KEY_PREFIX = "footballiq_played";

export interface PlayResult {
  won: boolean;
  shareText: string;
  timestamp: number;
}

function getKey(gameSlug: string, date: string): string {
  return `${KEY_PREFIX}_${gameSlug}_${date}`;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Mark a game as played for today.
 */
export function markPlayed(
  gameSlug: string,
  result: { won: boolean; shareText: string }
): void {
  if (typeof window === "undefined") return;

  const date = getToday();
  const key = getKey(gameSlug, date);
  const value: PlayResult = {
    won: result.won,
    shareText: result.shareText,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be full or disabled — silently fail
  }
}

/**
 * Check if a game has been played today.
 */
export function hasPlayedToday(gameSlug: string): boolean {
  if (typeof window === "undefined") return false;

  const date = getToday();
  const key = getKey(gameSlug, date);

  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Get the stored result for a played game.
 */
export function getPlayResult(
  gameSlug: string,
  date?: string
): PlayResult | null {
  if (typeof window === "undefined") return null;

  const d = date ?? getToday();
  const key = getKey(gameSlug, d);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PlayResult;
  } catch {
    return null;
  }
}

/**
 * Count the total number of distinct days the user has played any game.
 * Used for escalating CTA copy (day 7, day 30, etc.).
 */
export function getDaysPlayed(): number {
  if (typeof window === "undefined") return 0;

  const dates = new Set<string>();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;

      // Extract date from key: footballiq_played_{slug}_{YYYY-MM-DD}
      const parts = key.split("_");
      const dateStr = parts[parts.length - 1];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        dates.add(dateStr);
      }
    }
  } catch {
    return 0;
  }

  return dates.size;
}

/**
 * Count the number of consecutive days played up to and including today.
 * A streak is broken if any calendar day has no play session recorded.
 */
export function getConsecutiveStreak(): number {
  if (typeof window === "undefined") return 0;

  const allDates = new Set<string>();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;

      // Extract date from key: footballiq_played_{slug}_{YYYY-MM-DD}
      const parts = key.split("_");
      const dateStr = parts[parts.length - 1];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        allDates.add(dateStr);
      }
    }
  } catch {
    return 0;
  }

  // Walk backwards from today, counting consecutive days
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = cursor.toISOString().split("T")[0];
    if (!allDates.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Copy text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}
