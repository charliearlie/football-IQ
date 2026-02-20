import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_QUIZ_PUZZLE } from "@/lib/constants";
import type { TopicalQuizContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

const today = () => new Date().toISOString().split("T")[0];

export async function generateMetadata(): Promise<Metadata> {
  const ogDate = today();
  return {
    title: "Football Topical Quiz - Test Your Football Knowledge",
    description:
      "5 questions on recent football news, results, and events. How closely do you follow the beautiful game? Free to play in your browser, no sign-up needed.",
    alternates: {
      canonical: "https://football-iq.app/play/topical-quiz",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Football Topical Quiz | Football IQ",
      description:
        "5 questions on recent football news, results, and events. How closely do you follow the beautiful game?",
      url: "https://football-iq.app/play/topical-quiz",
      type: "website",
      images: [
        {
          url: `/api/og/play/topical-quiz?date=${ogDate}`,
          width: 1200,
          height: 630,
          alt: "Topical Quiz - Football quiz on recent news and events",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Football Topical Quiz | Football IQ",
      description:
        "5 questions on recent football news, results, and events. How closely do you follow the beautiful game?",
      images: [`/api/og/play/topical-quiz?date=${ogDate}`],
    },
  };
}

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
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Football Topical Quiz - Test Your Knowledge",
              description:
                "5 questions on recent football news, results, and events.",
              url: "https://football-iq.app/play/topical-quiz",
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
                  name: "Topical Quiz",
                  item: "https://football-iq.app/play/topical-quiz",
                },
              ],
            },
          ],
        }}
      />
      <GamePageShell title="Topical Quiz" gameSlug="topical-quiz">
        <PlayedTodayGate gameSlug="topical-quiz">
          <TopicalQuizGame content={content} puzzleDate={puzzleDate} />
        </PlayedTodayGate>
      </GamePageShell>
    </>
  );
}
