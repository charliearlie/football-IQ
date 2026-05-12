import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "The Thread — Guess the Club from Kit Sponsors | Football IQ",
    description:
      "Trace a club's kit-supplier or shirt-sponsor history and name the team. A daily football kit-trivia puzzle. Free to play in your browser, new puzzle every day.",
    alternates: {
      canonical: `${BASE_URL}/play/the-thread`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "The Thread — Guess the Club from Kit Sponsors | Football IQ",
      description:
        "Trace the kit-supplier or shirt-sponsor chronology and name the football club. Daily kit-trivia, free in your browser.",
      url: `${BASE_URL}/play/the-thread`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/the-thread`,
          width: 1200,
          height: 630,
          alt: "The Thread - Kit sponsor / supplier guessing game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "The Thread — Guess the Club from Kit Sponsors | Football IQ",
      description:
        "Trace a kit history and name the club. Daily football kit-trivia. Free to play in your browser.",
      images: [`${BASE_URL}/api/og/play/the-thread`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TheThreadPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "The Thread — Daily Football Kit-Sponsor Quiz",
              description:
                "Guess the club from a chronological list of kit suppliers or shirt sponsors. Reveal hidden brands as hints; fewer hints = higher score.",
              url: `${BASE_URL}/play/the-thread`,
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
                  name: "The Thread",
                  item: `${BASE_URL}/play/the-thread`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does The Thread work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Each puzzle shows a chronological list of kit suppliers (e.g. Umbro → Adidas → Reebok) or shirt sponsors (e.g. Sharp → Vodafone → AON) used by a single football club. Three entries are hidden. Type the club's name to guess; reveal hidden entries as hints if you're stuck — but each hint costs points.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is The Thread free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Today's The Thread puzzle is free to play in your browser at football-iq.app — no signup or download required. A new club every day.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is The Thread scored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Guess with 0 hints revealed for 10 points. 1 hint = 6, 2 hints = 4, 3 hints = 2. Out of guesses or give up = 0. Wrong guesses are free — only hints cost.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="the-thread" date={params.date} />
      <HowToPlay
        title="The Thread"
        rules={[
          "You're shown a club's kit-supplier or shirt-sponsor history in chronological order.",
          "Three entries are hidden ('???') to start — reveal them as hints if you're stuck.",
          "Type the club name into the input and submit to guess.",
          "Score: 0 hints = 10pts, 1 hint = 6, 2 hints = 4, 3 hints = 2. Wrong guesses are free.",
          "Out of hints? Hit 'Give up' to reveal the answer + kit-history fun fact.",
        ]}
        tips={[
          "The visible entries usually anchor an era — match the dates to a club's history.",
          "Kit suppliers (Adidas, Nike, Puma) repeat across many clubs; the order is what makes it unique.",
          "Shirt sponsors often tell you the country/region — a Japanese electronics brand probably means a 90s English club.",
        ]}
        keywords="The Thread is a daily football kit-trivia game. Trace a club's chronological kit-supplier or shirt-sponsor history and name the team. Free to play in your browser, new puzzle every day."
      />
    </>
  );
}
