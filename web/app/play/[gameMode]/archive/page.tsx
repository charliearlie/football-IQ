import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WEB_PLAYABLE_GAMES } from "@/lib/constants";
import { fetchArchivePuzzles } from "@/lib/archive/fetchArchive";
import { getTodayDateString } from "@/lib/archive/freeWindow";
import { ArchiveList } from "@/components/play/archive/ArchiveList";
import { GameNav } from "@/components/play/GameNav";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

interface PageProps {
  params: Promise<{ gameMode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameMode } = await params;
  const game = WEB_PLAYABLE_GAMES.find((g) => g.slug === gameMode);
  if (!game) return {};

  return {
    title: `${game.title} Archive — Past Puzzles | Football IQ`,
    description: `Replay past ${game.title} puzzles. Today plus the last two days are free; the full archive is included with Football IQ Pro.`,
    alternates: {
      canonical: `${BASE_URL}/play/${game.slug}/archive`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: `${game.title} Archive — Football IQ`,
      description: `Past ${game.title} puzzles. Build your streak, climb the tiers.`,
      url: `${BASE_URL}/play/${game.slug}/archive`,
      type: "website",
    },
  };
}

export default async function ArchivePage({ params }: PageProps) {
  const { gameMode } = await params;
  const game = WEB_PLAYABLE_GAMES.find((g) => g.slug === gameMode);
  if (!game) notFound();

  const [entries, today] = [
    await fetchArchivePuzzles(game.dbMode),
    getTodayDateString(),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <GameNav title={`${game.title} archive`} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-bebas text-3xl tracking-wider text-floodlight">
            {game.title} archive
          </h1>
          <p className="text-sm text-slate-400">
            Today plus the last two days are free. The full archive is included
            with{" "}
            <Link href="/account" className="text-pitch-green hover:underline">
              Football IQ Pro
            </Link>
            .
          </p>
        </header>

        <ArchiveList
          modeSlug={game.slug}
          accentColor={game.accentColor}
          entries={entries.map((e) => ({ date: e.puzzleDate, isPremium: e.isPremium }))}
          today={today}
        />

        <footer className="pt-6 border-t border-white/5">
          <Link
            href={`/play/${game.slug}`}
            className="text-sm font-semibold text-pitch-green hover:text-pitch-green/80"
          >
            ← Today&apos;s {game.title}
          </Link>
        </footer>
      </main>
    </div>
  );
}
