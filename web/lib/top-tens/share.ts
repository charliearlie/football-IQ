import type { RankSlotState, TopTensScore } from "./types";

export type TopTensVariant = "top-tens" | "last-tens";

/**
 * Generate share text for a Top Tens / Last Tens game result.
 *
 * @param title - The puzzle title (e.g. "Top 10 Premier League Goalscorers")
 * @param rankSlots - The 10 rank slot states (found = ✅, autoRevealed = ⬜)
 * @param score - The final score
 * @param puzzleDate - Optional ISO date (YYYY-MM-DD); used in the play URL
 * @param variant - Which game variant (controls the share URL slug)
 */
export function generateTopTensShareText(
  title: string,
  rankSlots: RankSlotState[],
  score: TopTensScore,
  puzzleDate?: string,
  variant: TopTensVariant = "top-tens"
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const grid = rankSlots
    .map((slot) => (slot.found ? "✅" : "⬜"))
    .join("");

  const firstLine = score.won
    ? `Jackpot! I got all 10 on ${title}`
    : `${title} — ${score.foundCount}/10 found`;

  const baseUrl = `https://football-iq.app/play/${variant}`;
  const playUrl = puzzleDate
    ? `${baseUrl}?ref=share&date=${puzzleDate}`
    : `${baseUrl}?ref=share`;

  return [
    firstLine,
    dateStr,
    "",
    grid,
    "",
    `${score.points}/${score.maxPoints} IQ`,
    playUrl,
  ].join("\n");
}
