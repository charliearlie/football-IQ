// web/app/play/who-am-i/page.tsx
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Who Am I? — Daily Football Clue Game | Football IQ",
    description:
      "Guess the mystery footballer from 5 progressive clues. Fewer clues = higher score. A new player every day, free to play in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/who-am-i`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Who Am I? — Daily Football Clue Game | Football IQ",
      description:
        "Five progressive clues. One mystery footballer. Guess in as few clues as possible. New player every day, free in your browser.",
      url: `${BASE_URL}/play/who-am-i`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/who-am-i`,
          width: 1200,
          height: 630,
          alt: "Who Am I? - Daily football clue game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Who Am I? — Daily Football Clue Game | Football IQ",
      description:
        "5 progressive clues to identify the mystery footballer. Free to play, new puzzle every day.",
      images: [`${BASE_URL}/api/og/play/who-am-i`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WhoAmIPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Who Am I? — Daily Football Clue Game",
              description:
                "Guess the mystery footballer from 5 progressive clues. Each clue makes it easier. Fewer clues used = higher score.",
              url: `${BASE_URL}/play/who-am-i`,
              isAccessibleForFree: true,
              provider: {
                "@type": "Organization",
                name: "Football IQ",
                url: BASE_URL,
              },
              typicalAgeRange: "13-",
              inLanguage: "en",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Football IQ", item: BASE_URL },
                { "@type": "ListItem", position: 2, name: "Play", item: `${BASE_URL}/play` },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Who Am I?",
                  item: `${BASE_URL}/play/who-am-i`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Who Am I? work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Each puzzle gives you 5 progressive clues about a footballer, from cryptic (clue 1) to obvious (clue 5). You can guess at any time. The fewer clues you reveal before guessing correctly, the higher your score.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Who Am I? free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Today's Who Am I? puzzle is always free in your browser at football-iq.app — no signup or download required. A new puzzle drops every day.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Who Am I? scored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Guess on clue 1 to score 5/5. Each additional clue revealed costs you one point: clue 2 = 4, clue 3 = 3, clue 4 = 2, clue 5 = 1. Get it wrong on all clues or give up and you score 0.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="who-am-i" date={params.date} />
      <HowToPlay
        title="Who Am I?"
        rules={[
          "Read clue 1 — the hardest one — and start guessing if you can.",
          "Stuck? Tap 'Next clue' to reveal an easier hint (each clue costs you one point).",
          "Search players in the input and tap a result to lock in your guess.",
          "Wrong guesses don't cost points — only how many clues you needed counts.",
          "Out of clues? Tap 'Give up' to see the answer.",
        ]}
        tips={[
          "Clue 1 often hints at career trivia — a youth club, a debut year, a niche record.",
          "Clue 5 is usually the player's nationality + birth year — the safety net.",
          "If a clue mentions a position, that narrows the field fast.",
          "Score 5/5 in your head before guessing if you want bragging rights.",
        ]}
        keywords="Who Am I? is a daily football clue game. 5 progressive clues reveal a mystery footballer. Guess in as few clues as possible for the highest score. Free to play in your browser, new player every day."
      />
    </>
  );
}
