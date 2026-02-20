import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_CONNECTIONS_PUZZLE } from "@/lib/constants";
import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
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
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content =
    (puzzle?.content as unknown as ConnectionsContent) ??
    FALLBACK_CONNECTIONS_PUZZLE;

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
                  name: "Connections",
                  item: "https://football-iq.app/play/connections",
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
