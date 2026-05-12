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
import { EmailCaptureForm } from "@/components/EmailCaptureForm";
import { AndroidNotifyButton } from "@/components/AndroidNotifyButton";
import { Download } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Football IQ — 12 Free Daily Football Quizzes in Your Browser",
  description:
    "Play 12 daily football puzzles free in your browser — Career Path, Who's That?, Higher/Lower, Top Tens, Last 10, Who Am I?, The Thread, Career Path Pro, Connections, Transfer Guess, Timeline, and Topical Quiz. New puzzles every day. No app or signup required.",
  alternates: {
    canonical: "https://www.football-iq.app",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Football IQ — 12 Free Daily Football Quizzes in Your Browser",
    description:
      "12 free daily football puzzles in your browser. Guess players, trace careers, sort timelines. New content every day, no app needed.",
    url: "https://www.football-iq.app",
    type: "website",
    images: [
      {
        url: "/api/og/play",
        width: 1200,
        height: 630,
        alt: "Football IQ - 12 free daily football quizzes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Football IQ — 12 Free Daily Football Quizzes",
    description:
      "12 daily football puzzles, free in your browser. New content every day.",
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

  // Sort active games (live puzzle today) to the top of the grid so the
  // user lands on something they can actually play. Stable sort preserves
  // the curated registry order within each bucket.
  const sortedGames = [...WEB_PLAYABLE_GAMES].sort(
    (a, b) =>
      Number(liveModes.has(b.dbMode)) - Number(liveModes.has(a.dbMode)),
  );
  const activeSlugs = WEB_PLAYABLE_GAMES.filter((g) =>
    liveModes.has(g.dbMode),
  ).map((g) => g.slug);

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
              "@type": "MobileApplication",
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
                "Test your football knowledge with daily game modes. Guess players, transfers, connections, and more. Climb from Intern to The Gaffer.",
            },
            {
              "@type": "ItemList",
              name: "Daily Football Games (free in browser)",
              numberOfItems: WEB_PLAYABLE_GAMES.length,
              itemListElement: WEB_PLAYABLE_GAMES.map((game, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: game.title,
                url: `https://www.football-iq.app/play/${game.slug}`,
                description: game.description,
              })),
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
        <section className="pt-12 md:pt-20 pb-8 md:pb-10 text-center relative">
          {/* Soft radial accent behind the headline */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-8 mx-auto h-40 max-w-md bg-pitch-green/[0.06] blur-3xl pointer-events-none"
          />

          {/* Eyebrow tag */}
          <div className="relative inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full border border-pitch-green/30 bg-pitch-green/[0.06] text-pitch-green text-[11px] font-semibold uppercase tracking-[0.18em]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-pitch-green opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pitch-green" />
            </span>
            New puzzles · {dayStr}
          </div>

          <h1 className="relative font-bebas text-6xl md:text-8xl tracking-tight text-floodlight leading-[0.9] mb-4">
            PROVE YOUR
            <br />
            <span className="text-pitch-green">FOOTBALL IQ</span>
          </h1>
          <p className="relative text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed mb-8">
            12 free daily football puzzles, playable in your browser. No
            download, no account. Streak tracking and the full archive
            unlocked in the app.
          </p>

          {/* CTA pair */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#games"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-pitch-green text-stadium-navy font-bebas text-lg tracking-wider shadow-glow-green hover:opacity-90 active:scale-[0.97] transition-all duration-150 w-full sm:w-auto"
            >
              Play Today&apos;s Games →
            </a>
            <a
              href={appStoreUrl("web_hero_cta")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white/[0.04] border border-white/10 text-floodlight font-semibold text-sm hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.97] transition-all duration-150 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Get the App
            </a>
          </div>
        </section>

        {/* Date + Progress */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.18em]">
            {dayStr} · {dateStr}
          </p>
          <DailyProgress activeSlugs={activeSlugs} />
        </div>

        {/* Game Grid */}
        <section id="games" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedGames.map((game, i) => (
            <GameHubCard
              key={game.slug}
              title={game.title}
              description={game.description}
              slug={game.slug}
              hasLivePuzzle={liveModes.has(game.dbMode)}
              accentColor={game.accentColor}
              featured={i === 0 && liveModes.has(game.dbMode)}
            />
          ))}
        </section>

        {/* Ad slot — only takes space when ad renders */}
        <div className="py-4 flex justify-center empty:hidden">
          <AdSlot variant="banner" />
        </div>

        {/* App download pitch — featured card with subtle accent */}
        <section className="my-10">
          <div className="relative overflow-hidden rounded-2xl border border-pitch-green/20 bg-gradient-to-br from-pitch-green/[0.06] via-white/[0.02] to-transparent p-6 md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-pitch-green/15 blur-3xl"
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pitch-green mb-2">
                  Football IQ App
                </p>
                <h2 className="font-bebas text-3xl md:text-4xl tracking-tight text-floodlight mb-2 leading-none">
                  MORE IN THE APP
                </h2>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Track your stats, build streaks, climb from Intern to The
                  Gaffer. Full archive of past puzzles plus four
                  app-exclusive modes: The Grid, The Chain, Goalscorer
                  Recall, and Starting XI.
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                <Link
                  href={appStoreUrl("web_home")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
                >
                  <Image
                    src="/images/app-store.svg"
                    alt="Download on the App Store"
                    width={140}
                    height={42}
                    className="h-[42px] w-auto"
                  />
                </Link>
                <AndroidNotifyButton source="android-notify" size="md" />
              </div>
            </div>
          </div>
        </section>

        {/* Email capture */}
        <section className="pb-6">
          <EmailCaptureForm
            source="landing"
            title="Get weekly football trivia in your inbox"
          />
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

        {/* Quiz links — internal linking to content pages */}
        <section className="pb-8 border-t border-white/10 pt-6">
          <h2 className="font-bebas text-xl tracking-wider text-floodlight mb-3">
            FOOTBALL TRIVIA QUIZZES
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/football-connections", label: "Football Connections" },
              { href: "/quiz/premier-league", label: "Premier League Trivia" },
              { href: "/quiz/champions-league", label: "Champions League Trivia" },
              { href: "/quiz/world-cup", label: "World Cup Trivia" },
              { href: "/quiz/guess-the-footballer", label: "Guess the Footballer" },
              { href: "/football-trivia-questions", label: "100+ Trivia Questions" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-400 hover:text-pitch-green transition-colors py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ — targets brand long-tail queries */}
        <section className="pb-8 border-t border-white/10 pt-6">
          <h2 className="font-bebas text-xl tracking-wider text-floodlight mb-4">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What is Football IQ?",
                a: "Football IQ is a free daily football quiz site with 12 game modes you can play directly in your browser — guess players from career histories, trace kit sponsors, sort transfer fees, identify mystery footballers from clues, and more. New puzzles every day, no signup or download required.",
              },
              {
                q: "What are Football IQ games?",
                a: "Football IQ games are 12 daily football quizzes you can play free in your browser: Career Path, Who's That?, Higher/Lower, Top Tens, Last 10, Who Am I?, The Thread, Career Path Pro, Connections, Transfer Guess, Timeline, and Topical Quiz. Each one drops a fresh puzzle every day.",
              },
              {
                q: "How do I play Football Connections?",
                a: "In Football Connections, you are given 16 footballer names and must group them into 4 hidden categories. Each category connects 4 players — it could be by club, nationality, position, or something more creative. You get 4 guesses to find all the groups.",
              },
              {
                q: "Is Football IQ free to play?",
                a: "Yes. All 12 daily games are free to play in your browser. Football IQ Pro (in-app) unlocks the full archive of past puzzles, streak tracking, achievements, and four app-exclusive modes.",
              },
              {
                q: "How many football quiz game modes are there?",
                a: "There are 12 modes playable directly in your browser: Career Path, Who's That?, Higher/Lower, Top Tens, Last 10, Who Am I?, The Thread, Career Path Pro, Connections, Transfer Guess, Timeline, and Topical Quiz. The app adds four more app-exclusive modes: The Grid, The Chain, Goalscorer Recall, and Starting XI.",
              },
              {
                q: "What makes Football IQ different from other football quizzes?",
                a: "Football IQ combines 12 distinct game formats in one site with a fresh puzzle in every mode every day. Instead of static question-and-answer quizzes, each mode is an interactive puzzle. You earn IQ points, climb tiers from Intern to The Gaffer, and track your stats over time.",
              },
            ].map((item) => (
              <details key={item.q} className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-slate-300 hover:text-floodlight transition-colors">
                  <span>{item.q}</span>
                  <span className="text-slate-600 group-open:rotate-45 transition-transform text-lg ml-2">+</span>
                </summary>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is Football IQ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Football IQ is a free daily football quiz site with 12 game modes you can play directly in your browser — guess players from career histories, trace kit sponsors, sort transfer fees, identify mystery footballers from clues, and more. New puzzles every day, no signup or download required.",
                },
              },
              {
                "@type": "Question",
                name: "What are Football IQ games?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Football IQ games are 12 daily football quizzes you can play free in your browser: Career Path, Who's That?, Higher/Lower, Top Tens, Last 10, Who Am I?, The Thread, Career Path Pro, Connections, Transfer Guess, Timeline, and Topical Quiz.",
                },
              },
              {
                "@type": "Question",
                name: "How do I play Football Connections?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "In Football Connections, you are given 16 footballer names and must group them into 4 hidden categories. Each category connects 4 players — it could be by club, nationality, position, or something more creative. You get 4 guesses to find all the groups.",
                },
              },
              {
                "@type": "Question",
                name: "Is Football IQ free to play?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. All 12 daily games are free to play in your browser. Football IQ Pro (in-app) unlocks the full archive of past puzzles, streak tracking, achievements, and four app-exclusive modes.",
                },
              },
              {
                "@type": "Question",
                name: "How many football quiz game modes are there?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "There are 12 modes playable directly in your browser: Career Path, Who's That?, Higher/Lower, Top Tens, Last 10, Who Am I?, The Thread, Career Path Pro, Connections, Transfer Guess, Timeline, and Topical Quiz. The app adds four more app-exclusive modes: The Grid, The Chain, Goalscorer Recall, and Starting XI.",
                },
              },
              {
                "@type": "Question",
                name: "What makes Football IQ different from other football quizzes?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Football IQ combines 12 distinct game formats in one site with a fresh puzzle in every mode every day. Instead of static question-and-answer quizzes, each mode is an interactive puzzle. You earn IQ points, climb tiers from Intern to The Gaffer, and track your stats over time.",
                },
              },
            ],
          }}
        />

      </div>

      <Footer />
      <StickyMobileCTA />
    </main>
  );
}
