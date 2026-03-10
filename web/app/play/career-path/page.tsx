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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ogImage = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/og-images/career-path/${ogDate}.png`
    : `/api/og/play/career-path?date=${ogDate}`;
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
          url: ogImage,
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
      images: [ogImage],
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
                  name: "Play",
                  item: "https://football-iq.app/play",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Career Path",
                  item: "https://football-iq.app/play/career-path",
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does the Career Path football quiz work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You are shown a footballer's career history with the player's name hidden. Guess the player from the clubs and years shown. Each wrong guess reveals the next career step as a hint. A new puzzle appears every day.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is there a daily footballer guessing game?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Football IQ publishes a new Career Path puzzle every day where you guess a footballer from their career history. Free to play at football-iq.app with no download required.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is Football IQ Career Path?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Career Path is a daily football quiz where you identify a mystery player from their career moves. You see clubs and years but not the player's name. The fewer clues you need, the higher your score.",
                  },
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
