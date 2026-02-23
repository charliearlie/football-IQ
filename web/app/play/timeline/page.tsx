import { Metadata } from "next";
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_TIMELINE_PUZZLE } from "@/lib/constants";
import type { TimelineContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TimelineGame } from "@/components/play/TimelineGame";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

const today = () => new Date().toISOString().split("T")[0];

export async function generateMetadata(): Promise<Metadata> {
  const ogDate = today();
  const ogImage = `/api/og/play/timeline?date=${ogDate}`;
  return {
    title: "Football Timeline - Sort Events into Chronological Order",
    description:
      "Sort 6 football events into the correct chronological order. A daily football timeline puzzle. Free to play.",
    alternates: {
      canonical: "https://football-iq.app/play/timeline",
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Football Timeline Puzzle | Football IQ",
      description:
        "Sort 6 football events into the correct chronological order. Free to play.",
      url: "https://football-iq.app/play/timeline",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Football Timeline - Sort 6 events chronologically",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Football Timeline Puzzle | Football IQ",
      description:
        "Sort 6 football events into the correct chronological order. Free to play.",
      images: [ogImage],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TimelinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const puzzle = await fetchDailyPuzzle("timeline", params.date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const content =
    (puzzle?.content as unknown as TimelineContent) ??
    FALLBACK_TIMELINE_PUZZLE;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Football Timeline - Sort Events Chronologically",
              description:
                "Sort 6 football events into the correct chronological order. A daily football timeline puzzle.",
              url: "https://football-iq.app/play/timeline",
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
                  name: "Timeline",
                  item: "https://football-iq.app/play/timeline",
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does the Football Timeline quiz work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You are given 6 football events from a player's career in random order. Drag and drop them into the correct chronological order. You get multiple attempts, but each attempt reduces your maximum score.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is there a football sorting quiz?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Football IQ's Timeline mode challenges you to sort 6 career events into chronological order. New puzzles published regularly. Free to play at football-iq.app.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is Football IQ Timeline?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Timeline is a football quiz where you sort career events into the right order. Events include transfers, trophy wins, and milestones. Perfect order on the first try earns maximum points.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <GamePageShell title="Timeline" gameSlug="timeline">
        <PlayedTodayGate gameSlug="timeline">
          <TimelineGame content={content} puzzleDate={puzzleDate} />
        </PlayedTodayGate>
      </GamePageShell>
    </>
  );
}
