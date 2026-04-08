import { Metadata } from "next";
import { fetchDailyPuzzle, fetchNextPuzzleDate } from "@/lib/fetchDailyPuzzle";
import type { TimelineContent } from "@/lib/schemas/puzzle-schemas";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TimelineGame } from "@/components/play/TimelineGame";
import { NoPuzzleToday } from "@/components/play/NoPuzzleToday";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";

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
      canonical: "https://www.football-iq.app/play/timeline",
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
      url: "https://www.football-iq.app/play/timeline",
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
  const content = puzzle?.content as unknown as TimelineContent | undefined;
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];
  const hasContent = !!content;

  const nextDate =
    !hasContent ? await fetchNextPuzzleDate("timeline") : null;

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
              url: "https://www.football-iq.app/play/timeline",
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
                  name: "Timeline",
                  item: "https://www.football-iq.app/play/timeline",
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
        {hasContent ? (
          <PlayedTodayGate gameSlug="timeline">
            <TimelineGame content={content} puzzleDate={puzzleDate} />
          </PlayedTodayGate>
        ) : (
          <NoPuzzleToday
            gameSlug="timeline"
            gameTitle="Timeline"
            nextDate={nextDate}
          />
        )}
      </GamePageShell>
      <HowToPlay
        title="Timeline"
        rules={[
          "You are given 6 football events from a player's career in random order.",
          "Drag and drop (or tap) to arrange them in the correct chronological order.",
          "Submit when you think the order is right.",
          "Each wrong attempt reduces your maximum possible score.",
          "Getting the perfect order on the first try earns maximum points.",
        ]}
        tips={[
          "Youth and academy moves usually come first — start there.",
          "Trophy wins and international milestones can help anchor the timeline.",
          "If two events seem close in time, focus on the ones you're certain about first.",
        ]}
        keywords="Timeline is a daily football quiz where you sort career events into chronological order. Test your knowledge of football history by arranging transfers, trophies, and milestones."
      />
    </>
  );
}
