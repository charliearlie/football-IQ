import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_QUIZ_PUZZLE } from "@/lib/constants";
import type { TopicalQuizContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";

export const revalidate = 3600;

const today = () => new Date().toISOString().split("T")[0];

export async function generateMetadata(): Promise<Metadata> {
  const ogDate = today();
  // Topical quiz isn't guaranteed daily — use dynamic route as primary
  const ogImage = `/api/og/play/topical-quiz?date=${ogDate}`;
  return {
    title: "Football Topical Quiz - Test Your Football Knowledge",
    description:
      "5 questions on recent football news, results, and events. How closely do you follow the beautiful game? Free to play in your browser, no sign-up needed.",
    alternates: {
      canonical: "https://www.football-iq.app/play/topical-quiz",
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
      url: "https://www.football-iq.app/play/topical-quiz",
      type: "website",
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
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
              url: "https://www.football-iq.app/play/topical-quiz",
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
                  name: "Topical Quiz",
                  item: "https://www.football-iq.app/play/topical-quiz",
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Is there a weekly football news quiz?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Football IQ's Topical Quiz features 5 multiple-choice questions on recent football news, results, and events. Test how closely you follow the game. Free to play at football-iq.app.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does the Football Topical Quiz work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You answer 5 multiple-choice questions about recent football events. Each question has 4 options. You score 2 points per correct answer for a maximum of 10. The quiz auto-advances after each answer.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Where can I play a current football quiz?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Football IQ publishes topical quizzes regularly at football-iq.app/play/topical-quiz. Questions cover recent matches, transfers, and football news. Free to play in your browser.",
                  },
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
      <HowToPlay
        title="Topical Quiz"
        rules={[
          "Answer 5 multiple-choice questions about recent football events.",
          "Each question has 4 options — pick the one you think is correct.",
          "You score 2 points for each correct answer, for a maximum of 10.",
          "The quiz auto-advances after each answer.",
          "Questions cover recent matches, transfers, managerial changes, and football news.",
        ]}
        tips={[
          "Stay up to date with weekend results and midweek European matches.",
          "Transfer rumours and confirmed deals feature regularly.",
          "Don't overthink it — your first instinct on current events is usually right.",
        ]}
        keywords="The Topical Quiz is a weekly football quiz on current events. Test your knowledge of recent football news, results, and transfers with multiple-choice questions."
      />
    </>
  );
}
