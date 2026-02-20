import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_QUIZ_PUZZLE } from "@/lib/constants";
import type { TopicalQuizContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Topical Quiz | Football IQ",
  description:
    "5 questions on this week's football headlines. Play free daily on the web.",
  openGraph: {
    title: "Topical Quiz — Football IQ",
    description:
      "5 questions on this week's football headlines. Play free daily.",
    type: "website",
    images: [
      {
        url: "https://football-iq.app/api/og/play/topical-quiz",
        width: 1200,
        height: 630,
        alt: "Football IQ Topical Quiz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Topical Quiz — Football IQ",
    description:
      "5 questions on this week's football headlines. Play free daily.",
    images: ["https://football-iq.app/api/og/play/topical-quiz"],
  },
};

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TopicalQuizPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const puzzle = await fetchDailyPuzzle("topical_quiz", params.date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content =
    (puzzle?.content as unknown as TopicalQuizContent) ??
    FALLBACK_QUIZ_PUZZLE;

  return (
    <GamePageShell
      title="Topical Quiz"
      gameSlug="topical-quiz"
    >
      <PlayedTodayGate gameSlug="topical-quiz">
        <TopicalQuizGame content={content} puzzleDate={puzzleDate} />
      </PlayedTodayGate>
    </GamePageShell>
  );
}
