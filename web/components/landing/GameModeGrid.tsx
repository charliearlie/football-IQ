import Image from "next/image";
import { Crown, Link as LinkIcon, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface GameModeItem {
  title: string;
  description: string;
  icon?: string;
  lucideIcon?: LucideIcon;
  schedule: string;
  isPremium?: boolean;
  isBeta?: boolean;
  colorClasses: { text: string; borderL: string };
}

const GAME_MODES: GameModeItem[] = [
  {
    title: "Career Path",
    description: "Guess the player from their career timeline",
    icon: "/images/puzzles/career-path.png",
    schedule: "DAILY",
    colorClasses: { text: "text-pitch-green", borderL: "border-l-pitch-green" },
  },
  {
    title: "Career Path Pro",
    description: "Expert mode — fewer clues, tighter scoring",
    icon: "/images/puzzles/career-path.png",
    schedule: "DAILY",
    isPremium: true,
    colorClasses: { text: "text-pitch-green", borderL: "border-l-pitch-green" },
  },
  {
    title: "Transfer Guess",
    description: "Name the player from a single transfer",
    icon: "/images/puzzles/guess-the-transfer.png",
    schedule: "DAILY",
    colorClasses: { text: "text-card-yellow", borderL: "border-l-card-yellow" },
  },
  {
    title: "The Grid",
    description: "Fill the 3x3 grid matching clubs and categories",
    icon: "/images/puzzles/starting-xi.png",
    schedule: "",
    isBeta: true,
    colorClasses: { text: "text-teal", borderL: "border-l-teal" },
  },
  {
    title: "The Chain",
    description: "Link players through shared club connections",
    lucideIcon: LinkIcon,
    schedule: "",
    isBeta: true,
    colorClasses: { text: "text-sky-blue", borderL: "border-l-sky-blue" },
  },
  {
    title: "Threads",
    description: "Identify the club from kit sponsor history",
    lucideIcon: Scissors,
    schedule: "",
    isBeta: true,
    colorClasses: { text: "text-purple-pop", borderL: "border-l-purple-pop" },
  },
  {
    title: "Goalscorer Recall",
    description: "60 seconds to name every scorer from a classic match",
    icon: "/images/puzzles/goalscorer-recall.png",
    schedule: "WED & SAT",
    colorClasses: { text: "text-red-card", borderL: "border-l-red-card" },
  },
  {
    title: "Starting XI",
    description: "Find the missing players in iconic lineups",
    icon: "/images/puzzles/starting-xi.png",
    schedule: "SUNDAYS",
    colorClasses: { text: "text-amber", borderL: "border-l-amber" },
  },
  {
    title: "Top Tens",
    description: "Guess the top 10 in each category",
    icon: "/images/puzzles/top-tens.png",
    schedule: "MON & THU",
    isPremium: true,
    colorClasses: { text: "text-teal", borderL: "border-l-teal" },
  },
  {
    title: "Topical Quiz",
    description: "5 questions on this week's football headlines",
    icon: "/images/puzzles/quiz.png",
    schedule: "TUESDAYS",
    colorClasses: { text: "text-coral", borderL: "border-l-coral" },
  },
];

export function GameModeGrid() {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-4">
            10 GAME MODES. <span className="text-pitch-green">ZERO BOREDOM.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            New puzzles every day. Miss one? Play the last 7 days from our archive
            for free.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {GAME_MODES.map((mode) => {
            const Icon = mode.lucideIcon;
            return (
              <div
                key={mode.title}
                className={cn(
                  "relative glass-card p-4 border-l-4 group hover:bg-white/[0.08] transition-all",
                  mode.colorClasses.borderL,
                )}
              >
                {mode.isPremium && (
                  <div className="absolute -top-1.5 -right-1.5 bg-card-yellow rounded-full p-1">
                    <Crown className="w-3 h-3 text-stadium-navy" />
                  </div>
                )}
                {mode.isBeta && (
                  <span className="absolute -top-1.5 -right-1.5 bg-sky-blue text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full tracking-wide">
                    BETA
                  </span>
                )}

                {Icon ? (
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3">
                    <Icon className={cn("w-6 h-6", mode.colorClasses.text)} />
                  </div>
                ) : (
                  <div className="relative w-10 h-10 mx-auto mb-3">
                    <Image
                      src={mode.icon!}
                      alt={mode.title}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                )}

                <h3
                  className={cn(
                    "font-bebas text-base text-center tracking-wide",
                    mode.colorClasses.text,
                  )}
                >
                  {mode.title.toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">
                  {mode.description}
                </p>
                {mode.schedule && (
                  <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-wider font-medium">
                    {mode.schedule}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
