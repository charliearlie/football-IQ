import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Career Path Pro — Hard Daily Football Career Quiz | Football IQ",
    description:
      "Career Path turned up to 11. A longer career chain, deeper cuts, and harder players. For the football diehards. New puzzle every day, free in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/career-path-pro`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Career Path Pro — Hard Daily Football Career Quiz | Football IQ",
      description:
        "The harder Career Path. Longer chains, deeper cuts. Identify the footballer from an 8-step career history.",
      url: `${BASE_URL}/play/career-path-pro`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/career-path-pro`,
          width: 1200,
          height: 630,
          alt: "Career Path Pro - Hard daily football career quiz",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Career Path Pro — Hard Daily Football Career Quiz",
      description:
        "Longer chains, deeper cuts. Career Path turned up to 11. Free to play in your browser.",
      images: [`${BASE_URL}/api/og/play/career-path-pro`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function CareerPathProPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Career Path Pro — Hard Daily Football Career Quiz",
              description:
                "The pro-level Career Path. Identify the footballer from a longer 8-step career history — deeper cuts, harder players, no easy hits.",
              url: `${BASE_URL}/play/career-path-pro`,
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
                  name: "Career Path Pro",
                  item: `${BASE_URL}/play/career-path-pro`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How is Career Path Pro different from Career Path?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Career Path uses a 6-step chain with mainstream clubs. Career Path Pro uses an 8-step chain — including youth clubs and loan spells — and picks deeper-cut footballers. The mechanic is identical: reveal one step at a time, guess at any point, fewer reveals = higher score.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Career Path Pro free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Today's Career Path Pro is free to play in your browser at football-iq.app. A new puzzle every day, no signup or download required.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Career Path Pro scored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Same as Career Path: guess on clue 1 for the max score. Each additional career step you reveal costs you one point. Out of clues without guessing = 0.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="career-path-pro" date={params.date} />
      <HowToPlay
        title="Career Path Pro"
        rules={[
          "Each puzzle is an 8-step career history — clubs, youth teams, loan spells.",
          "Step 1 is shown. Reveal more steps to narrow it down. Guess at any time.",
          "Guess on step 1 to max your score. Each reveal costs one point.",
          "Wrong guesses don't end the game — only running out of steps does.",
          "Fuzzy name matching: 'Ronaldo' matches 'Cristiano Ronaldo'.",
        ]}
        tips={[
          "Pro puzzles often hide the answer behind a youth club from step 1 — don't anchor on it.",
          "Mid-career clubs (steps 3-5) are usually the give-away — they map to a specific era.",
          "If a step shows a loan spell, the next step is usually a return to the parent club.",
        ]}
        keywords="Career Path Pro is the harder daily Career Path quiz. Identify a footballer from an 8-step career history — youth clubs, loan spells, deeper cuts. Free to play, new puzzle every day."
      />
    </>
  );
}
