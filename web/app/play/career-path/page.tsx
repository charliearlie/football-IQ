import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_CAREER_PUZZLE } from "@/lib/constants";
import type { CareerPathContent } from "@/types/careerPath";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { CareerPathGame } from "@/components/play/CareerPathGame";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Career Path | Football IQ",
  description:
    "Guess the player from their career history. Play free daily on the web.",
  openGraph: {
    title: "Career Path — Football IQ",
    description:
      "Guess the player from their career history. Play free daily.",
    type: "website",
    images: [
      {
        url: "https://football-iq.app/api/og/play/career-path",
        width: 1200,
        height: 630,
        alt: "Football IQ Career Path",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Path — Football IQ",
    description:
      "Guess the player from their career history. Play free daily.",
    images: ["https://football-iq.app/api/og/play/career-path"],
  },
};

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function CareerPathPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const puzzle = await fetchDailyPuzzle("career_path", params.date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content =
    (puzzle?.content as unknown as CareerPathContent) ??
    FALLBACK_CAREER_PUZZLE;

  return (
    <GamePageShell
      title="Career Path"
      gameSlug="career-path"
    >
      <PlayedTodayGate gameSlug="career-path">
        <CareerPathGame
          careerSteps={content.career_steps}
          answer={content.answer}
          puzzleDate={puzzleDate}
        />
      </PlayedTodayGate>
    </GamePageShell>
  );
}
