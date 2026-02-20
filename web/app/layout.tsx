import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://football-iq.app"),
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Football IQ - Daily Football Quizzes & Trivia Games",
    description:
      "Free daily football quizzes you can play in your browser. Guess players, test your knowledge, climb the tiers.",
  },
  alternates: {
    canonical: "https://football-iq.app",
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
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans`}>{children}</body>
    </html>
  );
}
