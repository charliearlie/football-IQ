import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { WEB_PLAYABLE_GAMES, APP_ONLY_GAMES, APP_STORE_URL } from "@/lib/constants";

const BASE_URL = "https://www.football-iq.app";

export const metadata: Metadata = {
  title: "Play Football Quizzes Free in Your Browser | Football IQ",
  description:
    "5 daily football quiz games you can play free in your browser — no download needed. Career Path, Transfer Guess, Connections, Timeline, and Topical Quiz. New puzzles every day.",
  alternates: {
    canonical: `${BASE_URL}/play`,
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Play Football Quizzes Free | Football IQ",
    description:
      "5 daily football quiz games in your browser. Guess players, test your knowledge, solve puzzles. Free to play — no account needed.",
    url: `${BASE_URL}/play`,
    type: "website",
    images: [
      {
        url: `${BASE_URL}/api/og/play`,
        width: 1200,
        height: 630,
        alt: "Football IQ - Play free football quizzes in your browser",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Football Quizzes Free | Football IQ",
    description:
      "5 daily football quiz games in your browser. Free to play — no account needed.",
    images: [`${BASE_URL}/api/og/play`],
  },
};

export default function PlayPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "Football IQ Web Games",
        description:
          "Daily football quiz games playable free in your browser. No download required.",
        url: `${BASE_URL}/play`,
        numberOfItems: WEB_PLAYABLE_GAMES.length,
        itemListElement: WEB_PLAYABLE_GAMES.map((game, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: game.title,
          url: `${BASE_URL}/play/${game.slug}`,
          description: game.description,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Football IQ",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Play",
            item: `${BASE_URL}/play`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="min-h-screen bg-stadium-navy text-floodlight">
        {/* Nav */}
        <nav className="border-b border-white/5 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-bebas text-xl tracking-wider text-pitch-green">
              Football IQ
            </Link>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-stadium-navy bg-pitch-green px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Get the App
            </a>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-12 space-y-12">
          {/* Hero */}
          <section className="text-center space-y-4">
            <h1 className="font-bebas text-5xl sm:text-6xl tracking-wider leading-none">
              Play Football Quizzes
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
              5 daily football puzzles you can play free in your browser. No app, no account, no download. New content every day.
            </p>
          </section>

          {/* Web-playable games grid */}
          <section className="space-y-4">
            <h2 className="font-bebas text-2xl tracking-wider text-slate-300">
              Play Free in Your Browser
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WEB_PLAYABLE_GAMES.map((game) => (
                <Link
                  key={game.slug}
                  href={`/play/${game.slug}`}
                  className="group flex flex-col gap-2 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bebas text-xl tracking-wider"
                      style={{ color: game.accentColor }}
                    >
                      {game.title}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: game.accentColor,
                        backgroundColor: `${game.accentColor}18`,
                        border: `1px solid ${game.accentColor}30`,
                      }}
                    >
                      Free
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-snug">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className="text-xs font-semibold group-hover:underline"
                      style={{ color: game.accentColor }}
                    >
                      Play now &rarr;
                    </span>
                    <Link
                      href={`/play/${game.slug}/about`}
                      className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      How to play
                    </Link>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* App-only modes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bebas text-2xl tracking-wider text-slate-300">
                More Modes in the App
              </h2>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pitch-green font-semibold hover:underline"
              >
                Download free &rarr;
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {APP_ONLY_GAMES.map((game) => (
                <div
                  key={game.title}
                  className="flex flex-col gap-1 p-3 rounded-lg border border-white/5 bg-white/[0.02] opacity-60"
                >
                  <span className="text-sm font-semibold text-slate-300">
                    {game.title}
                  </span>
                  <span className="text-xs text-slate-500 leading-snug">
                    {game.description}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* App CTA */}
          <section className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center space-y-4">
            <h2 className="font-bebas text-3xl tracking-wider">
              Get All 11 Modes
            </h2>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm">
              The app includes everything here plus 6 more game modes, a full puzzle archive, streaks, achievements, and weekly tournaments.
            </p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-pitch-green text-stadium-navy font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download on App Store
            </a>
            <p className="text-slate-600 text-xs">Free to download · Premium unlocks everything</p>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 mt-12">
          <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-bebas text-lg tracking-wider text-pitch-green">
              Football IQ
            </span>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-slate-400 transition-colors">Support</Link>
              <Link href="/blog" className="hover:text-slate-400 transition-colors">Daily Digest</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
