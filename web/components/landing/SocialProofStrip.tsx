import { Calendar, Clock, Gamepad2, Users } from "lucide-react";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
}

interface SocialProofStripProps {
  /** Total games played across all users — pass from server component */
  gamesPlayed?: number;
}

export function SocialProofStrip({ gamesPlayed }: SocialProofStripProps) {
  const PROOF_POINTS = [
    ...(gamesPlayed && gamesPlayed > 100
      ? [
          {
            icon: Users,
            value: `${formatCount(gamesPlayed)} GAMES PLAYED`,
            label: "Join the community",
          },
        ]
      : []),
    {
      icon: Gamepad2,
      value: "13 MODES",
      label: "Something new every day",
    },
    {
      icon: Clock,
      value: "3-DAY ARCHIVE",
      label: "Miss one? Catch up for free",
    },
    {
      icon: Calendar,
      value: "DAILY",
      label: "Fresh games at midnight",
    },
  ];
  return (
    <section className="py-10 border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {PROOF_POINTS.map((point, index) => (
            <div key={point.value + point.label} className="flex items-center gap-8 md:gap-12">
              <div className="flex items-center gap-3 text-center md:text-left">
                <point.icon className="w-5 h-5 text-pitch-green shrink-0" />
                <div>
                  <div className="font-bebas text-xl text-floodlight tracking-wide">
                    {point.value}
                  </div>
                  <div className="text-xs text-slate-400">{point.label}</div>
                </div>
              </div>
              {index < PROOF_POINTS.length - 1 && (
                <div className="hidden md:block w-px h-8 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
