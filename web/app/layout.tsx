import type { Metadata } from "next";
import { Outfit, Space_Grotesk, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";
import { JsonLd } from "@/components/JsonLd";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.football-iq.app"),
  title: {
    default: "Football IQ - Daily Football Quizzes & Trivia Games",
    template: "%s | Football IQ",
  },
  description:
    "Free daily football quizzes you can play in your browser. Guess players from careers, transfers, and more. 11 game modes, 10 tiers. From Intern to The Gaffer.",
  keywords: [
    "football quiz",
    "football trivia",
    "daily football game",
    "guess the footballer",
    "football knowledge test",
    "premier league quiz",
    "soccer trivia",
    "football connections",
    "transfer quiz",
  ],
  icons: {
    icon: "/images/favicon.png",
  },
  openGraph: {
    title: "Football IQ - Daily Football Quizzes & Trivia Games",
    description:
      "Free daily football quizzes you can play in your browser. Guess players, test your knowledge, climb the tiers.",
    siteName: "Football IQ",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "/api/og/play",
        width: 1200,
        height: 630,
        alt: "Football IQ - Daily Football Quizzes & Trivia Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Football IQ - Daily Football Quizzes & Trivia Games",
    description:
      "Free daily football quizzes you can play in your browser. Guess players, test your knowledge, climb the tiers.",
    images: ["/api/og/play"],
  },
  alternates: {
    canonical: "https://www.football-iq.app",
  },
  other: {
    "apple-itunes-app": "app-id=6757344691",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9426782115883407" />
      </head>
      <body className={`${outfit.variable} ${spaceGrotesk.variable} ${bebasNeue.variable} font-sans`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.football-iq.app/#organization",
            name: "Football IQ",
            url: "https://www.football-iq.app",
            logo: "https://www.football-iq.app/images/favicon.png",
            sameAs: [
              "https://apps.apple.com/us/app/football-iq-football-trivia/id6757344691",
              "https://twitter.com/FootballIQApp",
            ],
          }}
        />
      </body>
    </html>
  );
}
