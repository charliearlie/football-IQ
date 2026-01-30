import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { MarketingHero } from "@/components/landing/MarketingHero";
import { GameModeShowcase } from "@/components/landing/GameModeShowcase";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PlayableCareerPath } from "@/components/landing/PlayableCareerPath";
import { Footer } from "@/components/landing";
import { FALLBACK_CAREER_PUZZLE } from "@/lib/constants";
import type { CareerPathContent } from "@/types/careerPath";

export const revalidate = 3600;

export default async function LandingPage() {
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: puzzle } = await supabase
    .from("daily_puzzles")
    .select("content")
    .eq("game_mode", "career_path")
    .eq("puzzle_date", today)
    .eq("status", "live")
    .single();

  const careerPathData =
    (puzzle?.content as unknown as CareerPathContent) ?? FALLBACK_CAREER_PUZZLE;

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6 border-b border-white/5 bg-stadium-navy/50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="font-bebas text-3xl tracking-wider text-floodlight">
            FOOTBALL IQ
          </div>
          <div className="hidden md:flex items-center gap-8 font-bebas text-lg tracking-wide text-slate-300">
            <a href="#features" className="hover:text-pitch-green transition-colors">Game Modes</a>
            <a href="#database" className="hover:text-pitch-green transition-colors">Database</a>
            <a href="#demo" className="hover:text-pitch-green transition-colors">Play Demo</a>
          </div>
        </div>
      </nav>

      <MarketingHero />

      <div id="features">
        <GameModeShowcase />
      </div>

      {/* Bonus Content / Future Roadmap Banner */}
      <section className="py-12 bg-white/5 border-y border-white/5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
           <div className="flex items-center gap-4">
              <span className="text-4xl animate-pulse">🚀</span>
              <div>
                 <h3 className="font-bebas text-3xl text-floodlight">MORE COMING SOON</h3>
                 <p className="text-slate-400">New game modes and bonus challenges added regularly.</p>
              </div>
           </div>
           <div className="hidden md:block w-px h-12 bg-white/10 mx-6" />
           <div className="flex items-center gap-4">
              <span className="text-4xl">🏆</span>
              <div>
                 <h3 className="font-bebas text-3xl text-floodlight">BONUS ROUNDS</h3>
                 <p className="text-slate-400">Look out for special event puzzles during big matches.</p>
              </div>
           </div>
        </div>
      </section>

      <div id="database">
        <FeatureSection />
      </div>

      {/* Playable Demo Section - Rephrased to be "Taste" */}
      <section className="py-24 bg-stadium-navy relative border-t border-white/5">
        <div className="container mx-auto px-4 text-center mb-12">
            <span className="text-pitch-green font-bebas text-xl tracking-wider mb-2 block">NO DOWNLOAD REQUIRED</span>
            <h2 className="font-bebas text-5xl text-floodlight">TRY ONE RIGHT NOW</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
               Here is today&apos;s Career Path puzzle. Can you solve it before downloading?
            </p>
        </div>
        <PlayableCareerPath
          careerSteps={careerPathData.career_steps}
          answer={careerPathData.answer}
        />
        <div className="text-center mt-12 bg-white/5 p-8 rounded-2xl max-w-2xl mx-auto border border-white/10">
            <h3 className="font-bebas text-3xl text-floodlight mb-2">FINISHED?</h3>
            <p className="text-slate-400 mb-6">Unlock 7 more game modes and track your stats in the full app.</p>
            <Link href="/download" className="inline-block px-8 py-3 bg-pitch-green text-stadium-navy font-bebas text-xl rounded-lg hover:bg-pitch-green/90 transition-colors shadow-lg hover:shadow-pitch-green/20">
                GET THE FULL EXPERIENCE
            </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
