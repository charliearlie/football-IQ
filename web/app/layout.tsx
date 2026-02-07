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
  title: "Football IQ - What's Your Football IQ?",
  description:
    "10 game modes. 10 tiers. From Trialist to GOAT. Test your football knowledge with daily puzzles. Free on iOS and Android.",
  icons: {
    icon: "/images/favicon.png",
  },
  openGraph: {
    title: "What's Your Football IQ?",
    description:
      "10 game modes. Daily puzzles. Free to download. Find out where you rank.",
    siteName: "Football IQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "What's Your Football IQ?",
    description:
      "10 game modes. Daily puzzles. Free to download. Find out where you rank.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans`}>{children}</body>
    </html>
  );
}
