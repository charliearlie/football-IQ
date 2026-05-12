import type { WhoAmIScore } from "./scoring";

/**
 * Emoji grid for a Who Am I? result.
 * - 🟩 = winning clue (last revealed when won)
 * - 🟨 = revealed clue that wasn't the winning one
 * - ⬜ = clue not needed
 */
export function generateWhoAmIEmojiGrid(score: WhoAmIScore): string {
  const emojis: string[] = [];
  for (let i = 1; i <= score.maxPoints; i++) {
    if (i <= score.cluesRevealed) {
      emojis.push(i === score.cluesRevealed && score.won ? "🟩" : "🟨");
    } else {
      emojis.push("⬜");
    }
  }
  return emojis.join("");
}

export function generateWhoAmIShareText(
  score: WhoAmIScore,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const emojiGrid = generateWhoAmIEmojiGrid(score);

  const firstLine = score.won
    ? `I knew who it was after just ${score.cluesRevealed} clue${score.cluesRevealed === 1 ? "" : "s"}!`
    : "This one stumped me completely";

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i&date=${puzzleDate}`
    : "https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i";

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
