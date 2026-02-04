import Image from "next/image";

export function FeatureSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Search database background effect */}
      <div className="absolute inset-0 bg-pitch-green/5 -z-10" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Feature Image */}
          <div className="flex-1 relative w-full aspect-square lg:aspect-auto lg:h-[600px] rounded-3xl overflow-hidden border border-white/10 bg-stadium-navy/80 backdrop-blur-sm shadow-2xl group">
             <div className="absolute inset-0 bg-gradient-to-br from-pitch-green/10 to-transparent z-10" />
             <Image
                src="/images/app-screens/database.png"
                alt="Elite Index Player Search"
                fill
                className="object-contain p-8 group-hover:scale-105 transition-transform duration-700"
             />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-8">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-teal/20 border border-teal/30 text-teal text-sm font-medium tracking-wide mb-6">
                NEVER RUN OUT OF CHALLENGES
              </div>
              <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-6 leading-tight text-shadow-fun">
                FRESH PUZZLES <span className="text-pitch-green">EVERY DAY</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Our database of <span className="text-white font-semibold">10,000+ players</span> means you&apos;ll never see the same puzzle twice. From legends to cult heroes, every career tells a story.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed mt-4">
                Miss a player? Our community can submit suggestions directly in the app, ensuring no cult hero is left behind.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 card-glow-green">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-3xl font-bebas text-floodlight mb-1">500+</div>
                <div className="text-sm text-slate-400 font-medium tracking-wide">ACHIEVEMENTS TO UNLOCK</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 card-glow-yellow">
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-3xl font-bebas text-floodlight mb-1">DAILY</div>
                <div className="text-sm text-slate-400 font-medium tracking-wide">STREAK CHALLENGES</div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 mt-6">
               <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>New puzzles drop at midnight UTC</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
