// web/app/play/whos-that/page.tsx
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Who's That? — Daily Football Wordle | Football IQ",
    description:
      "Guess the mystery footballer in 6 tries. Each guess reveals colour-coded clues on club, league, nationality, position, and age. New player every day. Free to play in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/whos-that`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Who's That? — Daily Football Wordle | Football IQ",
      description:
        "Wordle for footballers. 6 guesses, colour-coded clues. A new player every day, free to play in your browser.",
      url: `${BASE_URL}/play/whos-that`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/whos-that`,
          width: 1200,
          height: 630,
          alt: "Who's That? - Daily football Wordle",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Who's That? — Daily Football Wordle | Football IQ",
      description:
        "6 guesses to identify the mystery footballer. Free to play, new puzzle every day.",
      images: [`${BASE_URL}/api/og/play/whos-that`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WhosThatPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Who's That? — Daily Football Wordle",
              description:
                "Guess the mystery footballer in 6 tries. Colour-coded feedback on club, league, nationality, position, and age.",
              url: `${BASE_URL}/play/whos-that`,
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
                  name: "Who's That?",
                  item: `${BASE_URL}/play/whos-that`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Who's That? work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "You have 6 guesses to identify a mystery footballer. Each guess reveals colour-coded feedback on the player's club, league, nationality, position, and birth year. Green means exact match; yellow means close (same continent, same position category, or birth year within 2 years); red means wrong.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Who's That? free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Football IQ publishes a new Who's That? puzzle every day and today's puzzle is always free in your browser at football-iq.app — no signup or download required.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Who's That? like Wordle?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Who's That? uses the same green/yellow/red feedback pattern as Wordle, but instead of letters you're guessing a footballer's attributes — club, league, nationality, position, and age. Fewer guesses = higher score.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="whos-that" date={params.date} />
      <HowToPlay
        title="Who's That?"
        rules={[
          "Type any active footballer's name into the search bar.",
          "After each guess, five cells reveal colour-coded clues: green = exact match, yellow = close, red = wrong.",
          "An arrow on the birth-year cell shows whether the answer is older (↑) or younger (↓) than your guess.",
          "You have 6 guesses. Get it right in as few attempts as possible.",
          "Retired players can't be guessed — pick someone with a current club.",
        ]}
        tips={[
          "Start with a player from the league you suspect — locking the league early narrows the field fast.",
          "A yellow nationality cell means same continent; a yellow position cell means same broad role (Defender / Midfielder / Forward).",
          "Birth-year arrows compound: two ↑ arrows in a row mean the answer is older than both your guesses.",
        ]}
        keywords="Who's That? is a daily football Wordle clone. Guess the mystery footballer in 6 tries with colour-coded clues on club, league, nationality, position, and age. A new player every day, free to play in your browser."
      />
    </>
  );
}
