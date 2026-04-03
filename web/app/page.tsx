import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { createAdminClient } from "@/lib/supabase/server";
import { WEB_PLAYABLE_GAMES, APP_ONLY_GAMES, appStoreUrl } from "@/lib/constants";
import { GameHubCard } from "@/components/play/GameHubCard";
import { AdSlot } from "@/components/play/AdSlot";
import { HeroStrip } from "@/components/landing/HeroStrip";
import { DailyProgress } from "@/components/play/DailyProgress";
import { Footer } from "@/components/landing/Footer";
import { SocialProofStrip } from "@/components/landing/SocialProofStrip";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Football IQ - Daily Football Quizzes & Trivia Games",
  description:
    "Play free daily football quizzes in your browser. Guess players from career history, transfers, and more. New puzzles every day. Test your football knowledge now.",
  alternates: {
    canonical: "https://www.football-iq.app",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Football IQ - Daily Football Quizzes & Trivia Games",
    description:
      "Play free daily football quizzes in your browser. Guess players from career history, transfers, and more. New puzzles every day.",
    url: "https://www.football-iq.app",
    type: "website",
    images: [
      {
        url: "/api/og/play",
        width: 1200,
        height: 630,
        alt: "Football IQ - Daily Football Quizzes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Football IQ - Daily Football Quizzes & Trivia Games",
    description:
      "Play free daily football quizzes in your browser. Guess players from career history, transfers, and more.",
    images: ["/api/og/play"],
  },
};

export default async function HomePage() {
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const webModes = WEB_PLAYABLE_GAMES.map((g) => g.dbMode);

  const { data } = await supabase
    .from("daily_puzzles")
    .select("game_mode")
    .eq("puzzle_date", today)
    .eq("status", "live")
    .in("game_mode", webModes);

  const liveModes = new Set(data?.map((r) => r.game_mode) ?? []);

  // Total games played for social proof (cached via revalidate)
  const { count: gamesPlayed } = await supabase
    .from("puzzle_attempts")
    .select("*", { count: "exact", head: true })
    .eq("completed", true);

  const todayDate = new Date();
  const dayStr = todayDate.toLocaleDateString("en-GB", { weekday: "long" });
  const dateStr = todayDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://www.football-iq.app/#website",
              url: "https://www.football-iq.app",
              name: "Football IQ",
              description:
                "Daily football quizzes and trivia games. Guess players from careers, transfers, and more.",
              publisher: {
                "@type": "Organization",
                name: "Football IQ",
                url: "https://www.football-iq.app",
              },
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://www.football-iq.app/#app",
              name: "Football IQ - Football Trivia",
              operatingSystem: "iOS",
              applicationCategory: "GameApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              installUrl:
                "https://apps.apple.com/us/app/football-iq-football-trivia/id6757344691",
              description:
                "Test your football knowledge with 11 daily game modes. Guess players, transfers, connections, and more. Climb from Intern to The Gaffer.",
            },
            {
              "@type": "ItemList",
              name: "Daily Football Games",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Career Path",
                  url: "https://www.football-iq.app/play/career-path",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Transfer Guess",
                  url: "https://www.football-iq.app/play/transfer-guess",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Connections",
                  url: "https://www.football-iq.app/play/connections",
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: "Topical Quiz",
                  url: "https://www.football-iq.app/play/topical-quiz",
                },
              ],
            },
          ],
        }}
      />

      {/* AdSense — deduplicates automatically with play layout script */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9426782115883407"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <HeroStrip />

      <SocialProofStrip gamesPlayed={gamesPlayed ?? undefined} />

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Hero intro — gives first-time visitors context */}
        <section className="pt-8 pb-6 text-center">
          <h1 className="font-bebas text-5xl md:text-6xl tracking-wide text-floodlight leading-[0.95] mb-3">
            DAILY FOOTBALL<br />
            <span className="text-pitch-green">GAMES</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
            Test your football knowledge with free daily games.
            11 modes in the app — 4 playable right here.
          </p>
        </section>

        {/* Date + Progress */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-sm uppercase tracking-wider">
            {dayStr} · {dateStr}
          </p>
          <DailyProgress />
        </div>

        {/* Game Grid */}
        <section id="games" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WEB_PLAYABLE_GAMES.map((game, i) => (
            <GameHubCard
              key={game.slug}
              title={game.title}
              description={game.description}
              slug={game.slug}
              hasLivePuzzle={liveModes.has(game.dbMode)}
              accentColor={game.accentColor}
              featured={i === 0}
            />
          ))}
        </section>

        {/* Ad slot — only takes space when ad renders */}
        <div className="py-4 flex justify-center empty:hidden">
          <AdSlot variant="banner" />
        </div>

        {/* App download pitch — compact, above the fold on most devices */}
        <section className="py-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-bebas text-2xl tracking-wider text-floodlight mb-1">
                7 MORE MODES IN THE APP
              </h2>
              <p className="text-slate-400 text-sm">
                The Grid, Timeline, Top Tens, Goalscorer Recall and more.
                Track your stats, build streaks, climb from Intern to The Gaffer.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <Link
                href={appStoreUrl('web_home')}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:opacity-90 hover:scale-105"
              >
                <Image
                  src="/images/app-store.svg"
                  alt="Download on the App Store"
                  width={140}
                  height={42}
                  className="h-[42px] w-auto"
                />
              </Link>
              <div className="relative">
                <Image
                  src="/images/play-store.svg"
                  alt="Google Play — Coming Soon"
                  width={156}
                  height={42}
                  className="h-[42px] w-auto opacity-40"
                />
                <span className="absolute left-0 right-0 text-center text-[10px] text-slate-600 mt-0.5">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* App-only modes — compact list, not full cards */}
        <section className="pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
            {APP_ONLY_GAMES.map((game) => (
              <div key={game.title} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                <span className="text-xs text-slate-500 truncate">{game.title}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      <Footer />
      <StickyMobileCTA />
    </main>
  );
}
