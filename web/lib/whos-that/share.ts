import type { WhosThatScore } from "./scoring";
import type { GuessFeedback } from "./types";

/**
 * Generate emoji grid summary for a Who's That? result.
 * Each row: club + league + nationality + position + birth-year squares.
 */
export function generateWhosThatEmojiGrid(guesses: GuessFeedback[]): string {
  const colorToEmoji: Record<string, string> = {
    green: "🟩",
    yellow: "🟨",
    red: "🟥",
  };

  return guesses
    .map((g) =>
      [g.club, g.league, g.nationality, g.position, g.birthYear]
        .map((attr) => colorToEmoji[attr.color] ?? "⬜")
        .join("")
    )
    .join("\n");
}

/**
 * Generate share text for a Who's That? result.
 */
export function generateWhosThatShareText(
  score: WhosThatScore,
  guesses: GuessFeedback[],
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const emojiGrid = generateWhosThatEmojiGrid(guesses);

  const firstLine = score.won
    ? score.guessCount === 1
      ? "Got it in one!"
      : `Got it in ${score.guessCount}/${score.maxPoints} guesses`
    : `Couldn't crack it in ${score.maxPoints} tries`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/whos-that?ref=share&mode=whos-that&date=${puzzleDate}`
    : "https://football-iq.app/play/whos-that?ref=share&mode=whos-that";

  return [
    "Football IQ — Who's That?",
    firstLine,
    dateStr,
    "",
    emojiGrid,
    "",
    `${score.points}/${score.maxPoints} IQ`,
    playUrl,
  ].join("\n");
}
