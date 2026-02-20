import { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { WEB_PLAYABLE_GAMES, APP_ONLY_GAMES, APP_STORE_URL } from "@/lib/constants";
import { GameHubCard } from "@/components/play/GameHubCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Play Free | Football IQ",
  description:
    "Play 4 daily football puzzles free on the web. Career Path, Transfer Guess, Connections, and Topical Quiz.",
  openGraph: {
    title: "Play Free — Football IQ",
    description:
      "4 daily football puzzles. Play free, share your results, download the app for the full experience.",
    type: "website",
    images: [
      {
        url: "https://football-iq.app/api/og/play",
        width: 1200,
        height: 630,
        alt: "Football IQ — Play Free",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Free — Football IQ",
    description:
      "4 daily football puzzles. Play free, share your results.",
    images: ["https://football-iq.app/api/og/play"],
  },
};

async function getLivePuzzleModes(): Promise<Set<string>> {
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const webModes = WEB_PLAYABLE_GAMES.map((g) => g.dbMode);

  const { data } = await supabase
    .from("daily_puzzles")
    .select("game_mode")
    .eq("puzzle_date", today)
    .eq("status", "live")
    .in("game_mode", webModes);

  return new Set(data?.map((r) => r.game_mode) ?? []);
}

export default async function PlayHubPage() {
  const liveModes = await getLivePuzzleModes();

  const today = new Date();
  const dayStr = today.toLocaleDateString("en-GB", {
    weekday: "long",
  });
  const dateStr = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <>
      {/* Hub nav */}
      <nav className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="font-bebas text-2xl tracking-wider text-floodlight">
          FOOTBALL IQ
        </Link>
        <Link
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-pitch-green text-stadium-navy text-xs font-bold px-3 py-1.5 rounded-full hover:bg-pitch-green/90 transition-colors"
        >
          GET APP
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bebas text-4xl md:text-5xl text-floodlight">
            TODAY&apos;S GAMES
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-wider mt-1">
            {dayStr} &middot; {dateStr}
          </p>
        </div>

        {/* Web-playable games */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
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
        </div>

        {/* App-only games */}
        <div className="border-t border-white/10 pt-8">
          <h2 className="font-bebas text-xl tracking-wider text-slate-500 text-center mb-6">
            MORE IN THE APP
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
            {APP_ONLY_GAMES.map((game) => (
              <GameHubCard
                key={game.title}
                title={game.title}
                description={game.description}
                hasLivePuzzle={false}
                accentColor="#64748B"
                isAppOnly
              />
            ))}
          </div>

          <div className="text-center">
            <Link
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-pitch-green text-stadium-navy font-bold py-3 px-8 rounded-xl hover:bg-pitch-green/90 transition-colors"
            >
              DOWNLOAD FOOTBALL IQ — FREE
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
