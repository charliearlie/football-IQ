import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Last 10 — Recent Football List Game | Football IQ",
    description:
      "Name the last 10 winners, scorers, or transfers. A recency-focused daily football list challenge. Free to play in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/last-tens`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Last 10 — Recent Football List Game | Football IQ",
      description:
        "Name the last 10. Recency-focused football list — Golden Boot winners, World Cup hosts, transfer records. Free to play in your browser.",
      url: `${BASE_URL}/play/last-tens`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/last-tens`,
          width: 1200,
          height: 630,
          alt: "Last 10 - Recent football list challenge",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Last 10 — Recent Football List Game | Football IQ",
      description:
        "Name the last 10 winners/scorers/transfers. Daily recency-focused football list. Free to play.",
      images: [`${BASE_URL}/api/og/play/last-tens`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function LastTensPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Last 10 — Recent Football List Game",
              description:
                "Guess the 10 most recent entries in today's football list — Golden Boot winners, World Cup hosts, big-money transfers, and more.",
              url: `${BASE_URL}/play/last-tens`,
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
                  name: "Last 10",
                  item: `${BASE_URL}/play/last-tens`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How is Last 10 different from Top Tens?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Top Tens asks for an all-time top-10 (e.g. 'Top 10 Premier League All-Time Goalscorers'). Last 10 asks for the 10 most recent — for example the last 10 Premier League Golden Boot winners or the last 10 World Cup final hosts. Same engine, recency-focused content.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Last 10 free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Today's Last 10 puzzle is always free to play in your browser at football-iq.app — no signup or download required. A new list every day.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Last 10 scored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Same tier as Top Tens: 1-2 found = 1 point, 3-4 = 2, 5-6 = 3, 7-8 = 4, 9 = 5, and naming all 10 = 8-point Jackpot.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="last-tens" date={params.date} />
      <HowToPlay
        title="Last 10"
        rules={[
          "Each puzzle asks for the 10 most recent winners, scorers, or transfers in a category.",
          "Type a name into the input. Correct guesses reveal the entry at its position.",
          "Repeats are allowed — if the same player won the Golden Boot three years running, they fill three slots.",
          "Fuzzy matching: 'Salah' matches 'Mohamed Salah'.",
          "Score: 1-2 found = 1pt, 3-4 = 2, 5-6 = 3, 7-8 = 4, 9 = 5, all 10 = Jackpot (8pts).",
        ]}
        tips={[
          "Start from the current season and work backwards.",
          "If a name fills multiple slots, you only need to guess it once per slot — keep typing.",
          "Last names usually match — the fuzzy matcher handles accents and aliases.",
        ]}
        keywords="Last 10 is a daily football list game focused on recency. Name the 10 most recent Golden Boot winners, transfer records, or trophy lifters. Free to play, new list every day."
      />
    </>
  );
}
