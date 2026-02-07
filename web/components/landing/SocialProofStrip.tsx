import { Database, Clock, Gamepad2 } from "lucide-react";

const PROOF_POINTS = [
  {
    icon: Gamepad2,
    value: "10 MODES",
    label: "Daily challenges",
  },
  {
    icon: Database,
    value: "10,000+",
    label: "Players in our database",
  },
  {
    icon: Clock,
    value: "DAILY",
    label: "Fresh puzzles at midnight",
  },
];

export function SocialProofStrip() {
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
