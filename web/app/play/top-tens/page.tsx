import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Top Tens — Daily Football List Game | Football IQ",
    description:
      "Can you name all 10? Guess every entry in today's top-10 football list. Goalscorers, transfer fees, World Cup records — a new list every day. Free to play.",
    alternates: {
      canonical: `${BASE_URL}/play/top-tens`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Top Tens — Daily Football List Game | Football IQ",
      description:
        "Name all 10. A daily football top-10 list challenge. Free to play in your browser.",
      url: `${BASE_URL}/play/top-tens`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/top-tens`,
          width: 1200,
          height: 630,
          alt: "Top Tens - Daily football list challenge",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Top Tens — Daily Football List Game | Football IQ",
      description:
        "Can you name all 10? Daily football top-10 list. Free to play, no download.",
      images: [`${BASE_URL}/api/og/play/top-tens`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TopTensPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Top Tens — Daily Football List Game",
              description:
                "Guess every entry in today's football top-10 list. Goalscorers, transfer fees, World Cup records, and more.",
              url: `${BASE_URL}/play/top-tens`,
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
                  name: "Top Tens",
                  item: `${BASE_URL}/play/top-tens`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Top Tens work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Each day you get a football top-10 list — for example 'Top 10 Premier League All-Time Goalscorers'. Type names to guess the entries; correct guesses reveal at their rank position. Find as many as you can.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Top Tens free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Today's Top Tens puzzle is always free to play in your browser at football-iq.app — no signup or download required. A new list publishes every day.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Top Tens scored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Flat-tier scoring rewards quantity: 1-2 found = 1 point, 3-4 = 2, 5-6 = 3, 7-8 = 4, 9 = 5, and the Jackpot (all 10) is worth 8 points. Aim for the Jackpot.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="top-tens" date={params.date} />
      <HowToPlay
        title="Top Tens"
        rules={[
          "Each puzzle is a football top-10 list (e.g. 'Top 10 Premier League All-Time Goalscorers').",
          "Type a name into the input. Correct guesses reveal the entry at its rank position.",
          "Fuzzy matching: 'Shearer' matches 'Alan Shearer'; 'Aguero' matches 'Sergio Agüero'.",
          "Find as many as you can. Hit 'Give Up' to reveal the remaining answers.",
          "Score: 1-2 found = 1pt, 3-4 = 2, 5-6 = 3, 7-8 = 4, 9 = 5, all 10 = Jackpot (8pts).",
        ]}
        tips={[
          "Start with the obvious top-of-list names — they're often the easiest free hits.",
          "Try last names first; the fuzzy matcher will resolve them to the full name.",
          "Joint 10th-place entries are accepted — if today's list has ties, any tied name works.",
        ]}
        keywords="Top Tens is a daily football top-10 list game. Guess every entry — goalscorers, transfer fees, World Cup records — with fuzzy matching. Free to play, new list every day, no download required."
      />
    </>
  );
}
