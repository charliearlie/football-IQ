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
  title: "Football IQ - Daily Football Puzzles",
  description:
    "Test your football knowledge with daily puzzles. Career Path, Transfer Guess, Goalscorer Recall and more. Download the free app today!",
  openGraph: {
    title: "Football IQ - Prove Your Football IQ",
    description: "Daily puzzles to test your football knowledge",
    siteName: "Football IQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Football IQ - Daily Football Puzzles",
    description: "Daily puzzles to test your football knowledge",
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
