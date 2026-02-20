import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_CONNECTIONS_PUZZLE } from "@/lib/constants";
import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Connections | Football IQ",
  description:
    "Group 16 players into 4 categories. Play free daily on the web.",
  openGraph: {
    title: "Connections — Football IQ",
    description:
      "Group 16 players into 4 categories. Play free daily.",
    type: "website",
    images: [
      {
        url: "https://football-iq.app/api/og/play/connections",
        width: 1200,
        height: 630,
        alt: "Football IQ Connections",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Connections — Football IQ",
    description:
      "Group 16 players into 4 categories. Play free daily.",
    images: ["https://football-iq.app/api/og/play/connections"],
  },
};

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function ConnectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const puzzle = await fetchDailyPuzzle("connections", params.date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content =
    (puzzle?.content as unknown as ConnectionsContent) ??
    FALLBACK_CONNECTIONS_PUZZLE;

  return (
    <GamePageShell
      title="Connections"
      gameSlug="connections"
    >
      <PlayedTodayGate gameSlug="connections">
        <ConnectionsGame content={content} puzzleDate={puzzleDate} />
      </PlayedTodayGate>
    </GamePageShell>
  );
}
