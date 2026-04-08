import { Metadata } from "next";
import { fetchDailyPuzzle, fetchNextPuzzleDate } from "@/lib/fetchDailyPuzzle";
import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
import { NoPuzzleToday } from "@/components/play/NoPuzzleToday";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";

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
      canonical: "https://www.football-iq.app/play/connections",
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
      url: "https://www.football-iq.app/play/connections",
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
  const content = puzzle?.content as unknown as ConnectionsContent | undefined;
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const hasContent = !!content;

  const nextDate =
    !hasContent ? await fetchNextPuzzleDate("connections") : null;

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
              url: "https://www.football-iq.app/play/connections",
              isAccessibleForFree: true,
              provider: {
                "@type": "Organization",
                name: "Football IQ",
                url: "https://www.football-iq.app",
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
                  item: "https://www.football-iq.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Play",
                  item: "https://www.football-iq.app/play",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Connections",
                  item: "https://www.football-iq.app/play/connections",
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
        {hasContent ? (
          <PlayedTodayGate gameSlug="connections">
            <ConnectionsGame content={content} puzzleDate={puzzleDate} />
          </PlayedTodayGate>
        ) : (
          <NoPuzzleToday
            gameSlug="connections"
            gameTitle="Connections"
            nextDate={nextDate}
          />
        )}
      </GamePageShell>
      <HowToPlay
        title="Connections"
        rules={[
          "A grid of 16 footballers is displayed. Find the 4 groups of 4 that share a hidden connection.",
          "Select 4 players and submit your guess. Correct groups are revealed with a colour.",
          "Categories are colour-coded from easy (yellow) to very hard (purple).",
          "You have 4 lives — each wrong guess costs one life.",
          "The game ends when all groups are found or you run out of lives.",
        ]}
        tips={[
          "Start with the group you're most confident about to avoid wasting lives.",
          "Connections can be anything: same club, same nationality, same shirt number, same award.",
          "If 3 players obviously fit, look carefully at which 4th player completes the group.",
        ]}
        keywords="Football Connections is a daily puzzle game inspired by NYT Connections. Group 16 footballers into 4 hidden categories. A new football connections puzzle every day."
      />
    </>
  );
}
