/**
 * The Thread Scoring Logic
 *
 * Scoring System (hint-based, 10-point scale):
 * - 0 hints revealed: 10 points
 * - 1 hint revealed:   6 points
 * - 2 hints revealed:  4 points
 * - 3 hints revealed:  2 points
 * - Give up:           0 points
 *
 * Wrong guesses are free — score is purely based on hints revealed.
 */

/** Points awarded per number of hints revealed (index = hintsRevealed) */
const HINT_SCORES = [10, 6, 4, 2] as const;

/**
 * Score object for The Thread game
 */
export interface ThreadScore {
  /** Points earned (0 to 10) */
  points: number;
  /** Maximum possible points (always 10) */
  maxPoints: number;
  /** Number of guesses made */
  guessCount: number;
  /** Whether the player won */
  won: boolean;
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
}

/**
 * Calculate the score for a Thread puzzle attempt.
 *
 * @param guessCount - Number of guesses made
 * @param won - Whether the player guessed correctly
 * @param hintsRevealed - Number of hidden brands revealed (0-3)
 * @returns ThreadScore object with points and metadata
 */
export function calculateThreadScore(
  guessCount: number,
  won: boolean,
  hintsRevealed: number = 0
): ThreadScore {
  const maxPoints = 10;

  if (!won) {
    return {
      points: 0,
      maxPoints,
      guessCount,
      won: false,
      hintsRevealed,
    };
  }

  const clamped = Math.max(0, Math.min(3, hintsRevealed));
  const points = HINT_SCORES[clamped];

  return {
    points,
    maxPoints,
    guessCount,
    won: true,
    hintsRevealed: clamped,
  };
}

/**
 * Format score for display as "X/10" string.
 *
 * @param score - The ThreadScore object
 * @returns Formatted string like "6/10"
 */
export function formatThreadScore(score: ThreadScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Generate emoji grid for sharing results.
 *
 * Uses 3-slot hint grid:
 * - 🧵 = The Thread header
 * - 🔒 = Hidden brand (not revealed)
 * - 🔓 = Hint revealed
 * - 💀 = Give up
 *
 * Examples:
 * - 0 hints: 🧵 🔒🔒🔒 Perfect!
 * - 1 hint:  🧵 🔓🔒🔒 Great!
 * - 2 hints: 🧵 🔓🔓🔒 Good!
 * - 3 hints: 🧵 🔓🔓🔓 Close!
 * - Give up: 🧵 💀 DNF
 *
 * @param score - The ThreadScore object
 * @returns Emoji string for sharing
 */
export function generateThreadEmojiGrid(score: ThreadScore): string {
  const THREAD_EMOJI = "🧵";
  const LOCKED = "🔒";
  const UNLOCKED = "🔓";
  const TOTAL_HINTS = 3;

  if (!score.won) {
    return `${THREAD_EMOJI} 💀 DNF`;
  }

  const revealed = Math.max(0, Math.min(TOTAL_HINTS, score.hintsRevealed));
  const grid =
    UNLOCKED.repeat(revealed) + LOCKED.repeat(TOTAL_HINTS - revealed);

  let label: string;
  if (score.points === 10) label = "Perfect!";
  else if (score.points >= 6) label = "Great!";
  else if (score.points >= 4) label = "Good!";
  else label = "Close!";

  return `${THREAD_EMOJI} ${grid} ${label}`;
}
