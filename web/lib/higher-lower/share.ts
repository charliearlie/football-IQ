import type { HigherLowerScore } from "./scoring";

/** Generate emoji string. ✅ = correct, ❌ = wrong. */
export function generateHigherLowerEmojiGrid(results: boolean[]): string {
  return results.map((r) => (r ? "✅" : "❌")).join("");
}

/** Generate share text for a Higher/Lower result. */
export function generateHigherLowerShareText(
  score: HigherLowerScore,
  results: boolean[],
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const emojiGrid = generateHigherLowerEmojiGrid(results);

  const firstLine = score.won
    ? "I got a perfect 10 in Higher/Lower!"
    : `I scored ${score.points}/10 in Higher/Lower!`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/higher-lower?ref=share&date=${puzzleDate}`
    : "https://football-iq.app?ref=share";

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
