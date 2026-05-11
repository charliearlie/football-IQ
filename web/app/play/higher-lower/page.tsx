import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Higher/Lower — Daily Football Stats Game | Football IQ",
    description:
      "Higher or lower? Compare real footballer stats over 10 rounds. Transfer fees, goals, caps, appearances. A new puzzle every day. Free to play in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/higher-lower`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Higher/Lower — Daily Football Stats Game | Football IQ",
      description:
        "Higher or lower? Compare real footballer stats. 10 rounds, free to play, new puzzle every day.",
      url: `${BASE_URL}/play/higher-lower`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/higher-lower`,
          width: 1200,
          height: 630,
          alt: "Higher/Lower - Daily football stats comparison game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Higher/Lower — Daily Football Stats Game | Football IQ",
      description:
        "10 rounds. Compare real player stats. Free daily puzzle, no download needed.",
      images: [`${BASE_URL}/api/og/play/higher-lower`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HigherLowerPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Higher/Lower — Daily Football Stats Game",
              description:
                "Compare two footballers' stats over 10 rounds. Higher or lower? Transfer fees, goals, caps, appearances. New puzzle every day.",
              url: `${BASE_URL}/play/higher-lower`,
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
                  name: "Higher/Lower",
                  item: `${BASE_URL}/play/higher-lower`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Higher/Lower work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "You see two real footballers and a stat (transfer fee, goals, caps, etc.). For each round you pick whether the second player's value is higher or lower than the first. Get as many right as you can across 10 rounds.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Higher/Lower free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Football IQ publishes a new Higher/Lower puzzle every day and today's puzzle is always free in your browser at football-iq.app — no signup or download required.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What stats are compared?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Transfer fees, league appearances, international caps, goals, assists, and clean sheets. The stat being compared is shown on the card, so you always know what you're betting on.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="higher-lower" date={params.date} />
      <HowToPlay
        title="Higher/Lower"
        rules={[
          "Two footballers are shown per round. Player 1's stat is revealed; Player 2's stat is hidden.",
          "Tap 'Higher' if you think Player 2's stat is higher than (or equal to) Player 1's. Tap 'Lower' if you think it's lower.",
          "After each answer the stat is revealed and you see whether you were right.",
          "Play all 10 rounds. Score = number correct out of 10. A perfect 10 is a clean sweep.",
        ]}
        tips={[
          "Pay attention to the stat label — transfer fees and appearances live on very different scales.",
          "Use eras as anchors: pre-2000 transfers were smaller; modern Premier League fees are inflated.",
          "Career length matters for appearances and caps — long-serving veterans outpace shorter careers by a lot.",
        ]}
        keywords="Higher/Lower is a daily football stats comparison game. Pick whether each next player has a higher or lower stat than the previous one. 10 rounds, free to play in your browser, new puzzle every day."
      />
    </>
  );
}
