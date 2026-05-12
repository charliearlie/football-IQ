import type { ThreadScore } from "./scoring";
import type { ThreadType } from "@/lib/schemas/puzzle-schemas";

/**
 * Emoji grid: 🧵 + 3 hint slots (🔓 revealed, 🔒 hidden) + a one-word label.
 * On a loss the grid collapses to 🧵 💀 DNF.
 */
export function generateThreadEmojiGrid(score: ThreadScore): string {
  const THREAD = "🧵";
  const LOCKED = "🔒";
  const UNLOCKED = "🔓";
  const TOTAL_HINTS = 3;

  if (!score.won) {
    return `${THREAD} 💀 DNF`;
  }

  const revealed = Math.max(0, Math.min(TOTAL_HINTS, score.hintsRevealed));
  const grid = UNLOCKED.repeat(revealed) + LOCKED.repeat(TOTAL_HINTS - revealed);

  let label: string;
  if (score.points === 10) label = "Perfect!";
  else if (score.points >= 6) label = "Great!";
  else if (score.points >= 4) label = "Good!";
  else label = "Close!";

  return `${THREAD} ${grid} ${label}`;
}

export function generateThreadShareText(
  score: ThreadScore,
  threadType: ThreadType,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const threadTypeDisplay = threadType === "sponsor" ? "Kit Sponsor" : "Kit Supplier";
  const emojiGrid = generateThreadEmojiGrid(score);

  const firstLine = score.won
    ? `I traced this ${threadTypeDisplay.toLowerCase()} thread with ${score.hintsRevealed} hint${score.hintsRevealed === 1 ? "" : "s"}`
    : `This ${threadTypeDisplay.toLowerCase()} thread had me stumped`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/the-thread?ref=share&date=${puzzleDate}`
    : "https://football-iq.app/play/the-thread?ref=share";

  return [
    firstLine,
    dateStr,
    "",
    emojiGrid,
    "",
    `${score.points}/${score.maxPoints} IQ`,
    playUrl,
  ].join("\n");
}
