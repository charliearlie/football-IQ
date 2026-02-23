import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_TRANSFER_PUZZLE } from "@/lib/constants";
import type { TransferGuessContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TransferGuessGame } from "@/components/play/TransferGuessGame";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

const today = () => new Date().toISOString().split("T")[0];

export async function generateMetadata(): Promise<Metadata> {
  const ogDate = today();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ogImage = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/og-images/transfer-guess/${ogDate}.png`
    : `/api/og/play/transfer-guess?date=${ogDate}`;
  return {
    title: "Guess the Football Transfer - Daily Transfer Quiz",
    description:
      "Name the player from a single transfer. New transfer puzzle every day. Test your football transfer knowledge. Free to play, no download required.",
    alternates: {
      canonical: "https://football-iq.app/play/transfer-guess",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Guess the Football Transfer | Football IQ",
      description:
        "Name the player from a single transfer. New transfer puzzle every day. Test your transfer knowledge.",
      url: "https://football-iq.app/play/transfer-guess",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Transfer Guess - Name the player from the transfer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Guess the Football Transfer | Football IQ",
      description:
        "Name the player from a single transfer. New transfer puzzle every day. Test your transfer knowledge.",
      images: [ogImage],
    },
  };
}

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
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Transfer Guess - Name the Football Transfer",
              description:
                "Name the player from a single transfer. A new puzzle every day.",
              url: "https://football-iq.app/play/transfer-guess",
              isAccessibleForFree: true,
              provider: {
                "@type": "Organization",
                name: "Football IQ",
                url: "https://football-iq.app",
              },
              typicalAgeRange: "13-",
              inLanguage: "en",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Football IQ",
                  item: "https://football-iq.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Transfer Guess",
                  item: "https://football-iq.app/play/transfer-guess",
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does the football transfer guessing game work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You see the two clubs involved in a transfer and the transfer fee. Guess which player made the move. You can reveal hints like the year, position, and nationality to help, but each hint lowers your maximum score.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is there a daily football transfer quiz?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Football IQ publishes a new Transfer Guess puzzle every day. Identify the player from a real transfer using clubs, fee, and optional hints. Free to play at football-iq.app.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is Transfer Guess?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Transfer Guess is a daily football quiz where you name the player behind a real transfer. You start with clubs and fee, then choose to reveal hints like year, position, and nationality. Fewer hints mean more points.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <GamePageShell title="Transfer Guess" gameSlug="transfer-guess">
        <PlayedTodayGate gameSlug="transfer-guess">
          <TransferGuessGame content={content} puzzleDate={puzzleDate} />
        </PlayedTodayGate>
      </GamePageShell>
    </>
  );
}
