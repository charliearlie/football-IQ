import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_TRANSFER_PUZZLE } from "@/lib/constants";
import type { TransferGuessContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TransferGuessGame } from "@/components/play/TransferGuessGame";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Transfer Guess | Football IQ",
  description:
    "Guess the player from a single transfer. Play free daily on the web.",
  openGraph: {
    title: "Transfer Guess — Football IQ",
    description:
      "Guess the player from a single transfer. Play free daily.",
    type: "website",
    images: [
      {
        url: "https://football-iq.app/api/og/play/transfer-guess",
        width: 1200,
        height: 630,
        alt: "Football IQ Transfer Guess",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transfer Guess — Football IQ",
    description:
      "Guess the player from a single transfer. Play free daily.",
    images: ["https://football-iq.app/api/og/play/transfer-guess"],
  },
};

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TransferGuessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const puzzle = await fetchDailyPuzzle("guess_the_transfer", params.date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content =
    (puzzle?.content as unknown as TransferGuessContent) ??
    FALLBACK_TRANSFER_PUZZLE;

  return (
    <GamePageShell
      title="Transfer Guess"
      gameSlug="transfer-guess"
    >
      <PlayedTodayGate gameSlug="transfer-guess">
        <TransferGuessGame
          content={content}
          puzzleDate={puzzleDate}
        />
      </PlayedTodayGate>
    </GamePageShell>
  );
}
