import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Football IQ - iOS App for Football Trivia Games",
  description:
    "Download the Football IQ app on iOS to play all 11 daily football trivia games. Career Path, Transfer Guess, Connections, Timeline and more. Free with optional Pro.",
  alternates: { canonical: "https://www.football-iq.app/download" },
  openGraph: {
    title: "Download Football IQ",
    description: "Get all 11 daily football trivia games on iOS.",
    url: "https://www.football-iq.app/download",
    type: "website",
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
