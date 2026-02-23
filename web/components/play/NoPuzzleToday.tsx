import Link from "next/link";
import { Calendar } from "lucide-react";
import { WEB_PLAYABLE_GAMES } from "@/lib/constants";

interface NoPuzzleTodayProps {
  gameSlug: string;
  gameTitle: string;
  nextDate: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function NoPuzzleToday({
  gameSlug,
  gameTitle,
  nextDate,
}: NoPuzzleTodayProps) {
  const otherGames = WEB_PLAYABLE_GAMES.filter((g) => g.slug !== gameSlug);

  return (
    <div className="max-w-md mx-auto text-center py-12 px-4 space-y-8">
      <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
        <Calendar className="w-8 h-8 text-slate-400" />
      </div>

      <div>
        <h2 className="font-bebas text-3xl tracking-wide text-floodlight mb-2">
          NO {gameTitle.toUpperCase()} GAME TODAY
        </h2>
        <p className="text-slate-400 text-sm">
          {nextDate
            ? `Check back ${formatDate(nextDate)}`
            : "Check back soon for the next puzzle"}
        </p>
      </div>

      {/* Other games */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">
          Play something else
        </p>
        <div className="flex flex-col gap-2 text-left">
          {otherGames.map((game) => (
            <Link
              key={game.slug}
              href={`/play/${game.slug}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-pitch-green/50 hover:bg-white/[0.03] transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: game.accentColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-floodlight">
                  {game.title}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {game.description}
                </p>
              </div>
              <span className="text-xs text-pitch-green font-bold shrink-0">
                PLAY
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
