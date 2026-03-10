import { Metadata } from "next";
import { fetchDailyPuzzle, fetchNextPuzzleDate } from "@/lib/fetchDailyPuzzle";
import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
import { NoPuzzleToday } from "@/components/play/NoPuzzleToday";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

const today = () => new Date().toISOString().split("T")[0];

export async function generateMetadata(): Promise<Metadata> {
  const ogDate = today();
  // Connections isn't guaranteed daily — use dynamic route as primary
  const ogImage = `/api/og/play/connections?date=${ogDate}`;
  return {
    title: "Football Connections - Group Players into Categories",
    description:
      "Group 16 footballers into 4 hidden categories. A daily football connections puzzle. Like NYT Connections but for football fans. Free to play.",
    alternates: {
      canonical: "https://football-iq.app/play/connections",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Football Connections Puzzle | Football IQ",
      description:
        "Group 16 footballers into 4 hidden categories. A daily football connections puzzle. Free to play.",
      url: "https://football-iq.app/play/connections",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Football Connections - Group 16 players into 4 categories",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Football Connections Puzzle | Football IQ",
      description:
        "Group 16 footballers into 4 hidden categories. A daily football connections puzzle. Free to play.",
      images: [ogImage],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function ConnectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const puzzle = await fetchDailyPuzzle("connections", params.date);

  // No live puzzle for today (only applies when not viewing a specific date)
  if (!puzzle && !params.date) {
    const nextDate = await fetchNextPuzzleDate("connections");
    return (
      <GamePageShell title="Connections" gameSlug="connections">
        <NoPuzzleToday
          gameSlug="connections"
          gameTitle="Connections"
          nextDate={nextDate}
        />
      </GamePageShell>
    );
  }

  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content = puzzle?.content as unknown as ConnectionsContent;

  // No puzzle for a specific historical date
  if (!content) {
    const nextDate = await fetchNextPuzzleDate("connections");
    return (
      <GamePageShell title="Connections" gameSlug="connections">
        <NoPuzzleToday
          gameSlug="connections"
          gameTitle="Connections"
          nextDate={nextDate}
        />
      </GamePageShell>
    );
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Football Connections - Group Players by Category",
              description:
                "Group 16 footballers into 4 hidden categories. A daily football connections puzzle.",
              url: "https://football-iq.app/play/connections",
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
                  name: "Play",
                  item: "https://football-iq.app/play",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Connections",
                  item: "https://football-iq.app/play/connections",
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How is Football Connections different from NYT Connections?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Football Connections uses 16 footballers instead of words. Group them into 4 hidden categories based on what they share — same club, same country, same award, or other connections. It is entirely football-themed with a new puzzle daily.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is there a free daily football connections puzzle?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Football IQ publishes a new Connections puzzle regularly at football-iq.app/play/connections. Free to play in your browser with no account needed.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do you play Football Connections?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Select 4 footballers from a grid of 16 that share a hidden connection and submit your guess. Correct groups reveal with a colour. You have 4 mistakes before the game ends. Categories range from easy (yellow) to very hard (purple).",
                  },
                },
              ],
            },
          ],
        }}
      />
      <GamePageShell title="Connections" gameSlug="connections">
        <PlayedTodayGate gameSlug="connections">
          <ConnectionsGame content={content} puzzleDate={puzzleDate} />
        </PlayedTodayGate>
      </GamePageShell>
    </>
  );
}
