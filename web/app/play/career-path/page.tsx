import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_CAREER_PUZZLE } from "@/lib/constants";
import type { CareerPathContent } from "@/types/careerPath";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { CareerPathGame } from "@/components/play/CareerPathGame";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

const today = () => new Date().toISOString().split("T")[0];

export async function generateMetadata(): Promise<Metadata> {
  const ogDate = today();
  return {
    title: "Guess the Footballer from Career History",
    description:
      "Can you name the player from their career moves? A new career path puzzle every day. Free to play in your browser. No app download needed.",
    alternates: {
      canonical: "https://football-iq.app/play/career-path",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Guess the Footballer from Career History | Football IQ",
      description:
        "Can you name the player from their career moves? A new career path puzzle daily. Play free in your browser.",
      url: "https://football-iq.app/play/career-path",
      type: "website",
      images: [
        {
          url: `/api/og/play/career-path?date=${ogDate}`,
          width: 1200,
          height: 630,
          alt: "Career Path - Guess the footballer from their career history",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Guess the Footballer from Career History | Football IQ",
      description:
        "Can you name the player from their career moves? A new career path puzzle daily. Play free in your browser.",
      images: [`/api/og/play/career-path?date=${ogDate}`],
    },
  };
}

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
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Career Path - Guess the Footballer",
              description:
                "Guess the footballer from their career history. A new puzzle every day.",
              url: "https://football-iq.app/play/career-path",
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
                  name: "Career Path",
                  item: "https://football-iq.app/play/career-path",
                },
              ],
            },
          ],
        }}
      />
      <GamePageShell title="Career Path" gameSlug="career-path">
        <PlayedTodayGate gameSlug="career-path">
          <CareerPathGame
            careerSteps={content.career_steps}
            answer={content.answer}
            puzzleDate={puzzleDate}
          />
        </PlayedTodayGate>
      </GamePageShell>
    </>
  );
}
