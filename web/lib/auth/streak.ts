/**
 * Web streak helpers.
 *
 * Web streaks live in localStorage (no auth required to play). When a user
 * reaches a 3-day streak we surface the magic-link signup prompt with the
 * streak-protection framing — see `shouldPromptForSignup()`.
 *
 * The localStorage key matches what `playSession.ts` writes after each game.
 * Callers should treat this module as the canonical read-side; do not
 * read the raw key elsewhere.
 */

const STREAK_PROMPT_DISMISSED_KEY = "fiq.signupPrompt.dismissedAt";
const STREAK_PROMPT_COOLDOWN_DAYS = 7;
const STREAK_PROMPT_THRESHOLD = 3;

interface PlayStreakSnapshot {
  currentStreak: number;
  lastPlayedDate: string | null;
}

/**
 * Reads the current streak from localStorage. Mirrors the shape used by
 * `playSession.ts` so we read straight from the same source of truth.
 */
export function readPlayStreak(): PlayStreakSnapshot {
  if (typeof window === "undefined") return { currentStreak: 0, lastPlayedDate: null };
  try {
    const raw = window.localStorage.getItem("fiq.playSession");
    if (!raw) return { currentStreak: 0, lastPlayedDate: null };
    const parsed = JSON.parse(raw) as Partial<PlayStreakSnapshot>;
    return {
      currentStreak:
        typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      lastPlayedDate: parsed.lastPlayedDate ?? null,
    };
  } catch {
    return { currentStreak: 0, lastPlayedDate: null };
  }
}

/**
 * Returns true if we should show the magic-link signup prompt right now.
 *
 * Logic:
 *   1. User must be unauthenticated (caller checks before invoking).
 *   2. Current streak must be >= STREAK_PROMPT_THRESHOLD (default 3).
 *   3. Prompt was either never shown or dismissed >7 days ago.
 *
 * The cooldown prevents nagging users who say "no thanks" — they get one
 * prompt, then get left alone for a week.
 */
export function shouldPromptForSignup(): boolean {
  if (typeof window === "undefined") return false;
  const { currentStreak } = readPlayStreak();
  if (currentStreak < STREAK_PROMPT_THRESHOLD) return false;

  const dismissedAt = window.localStorage.getItem(STREAK_PROMPT_DISMISSED_KEY);
  if (!dismissedAt) return true;

  const dismissedTs = Number(dismissedAt);
  if (!Number.isFinite(dismissedTs)) return true;

  const cooldownMs = STREAK_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedTs > cooldownMs;
}

/** Marks the prompt as dismissed for the cooldown window. */
export function markSignupPromptDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STREAK_PROMPT_DISMISSED_KEY,
    String(Date.now()),
  );
}
