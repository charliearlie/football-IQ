import { IQ_TIERS, TIER_COLORS } from "@/lib/tiers";

export function TierProgression() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-4">
            WHERE WILL YOUR{" "}
            <span className="text-pitch-green">CAREER</span> TAKE YOU?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Every puzzle earns IQ points. Climb 10 tiers from Trialist to GOAT.
          </p>
        </div>

        <div className="max-w-lg mx-auto relative">
          {/* Vertical gradient line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-600 via-[#58CC02] to-[#FFD700]" />

          <div className="space-y-2">
            {IQ_TIERS.map((tier) => {
              const color = TIER_COLORS[tier.tier];
              return (
                <div
                  key={tier.tier}
                  className="flex items-center gap-4 relative pl-10"
                >
                  {/* Tier dot */}
                  <div
                    className="absolute left-2 w-4 h-4 rounded-full border-2 border-stadium-navy"
                    style={{ backgroundColor: color }}
                  />

                  {/* Tier card */}
                  <div className="flex-1 glass-card px-4 py-2.5 flex items-center justify-between">
                    <span
                      className="font-bebas text-lg tracking-wider"
                      style={{ color }}
                    >
                      {tier.name.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {tier.minPoints.toLocaleString()}+ IQ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
