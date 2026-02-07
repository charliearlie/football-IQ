import { createAdminClient } from "@/lib/supabase/server";
import { MarketingHero } from "@/components/landing/MarketingHero";
import { PlayableCareerPath } from "@/components/landing/PlayableCareerPath";
import { SocialProofStrip } from "@/components/landing/SocialProofStrip";
import { GameModeGrid } from "@/components/landing/GameModeGrid";
import { TierProgression } from "@/components/landing/TierProgression";
import { ShareCardPreview } from "@/components/landing/ShareCardPreview";
import { Footer } from "@/components/landing";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
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
          <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium tracking-wide uppercase text-slate-300">
            <a href="#demo" className="hover:text-pitch-green transition-colors">Play Demo</a>
            <a href="#modes" className="hover:text-pitch-green transition-colors">Game Modes</a>
          </div>
        </div>
      </nav>

      <MarketingHero />

      {/* Playable Demo - immediately after hero */}
      <section id="demo" className="py-16 bg-[#080E1A] relative border-t border-white/5">
        <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="font-bebas text-5xl text-floodlight">TRY TODAY&apos;S PUZZLE</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto">
            Guess the player from their career history. One wrong guess reveals the next clue.
          </p>
        </div>
        <PlayableCareerPath
          careerSteps={careerPathData.career_steps}
          answer={careerPathData.answer}
        />
      </section>

      <SocialProofStrip />

      <div id="modes">
        <GameModeGrid />
      </div>

      <TierProgression />
      <ShareCardPreview />
      <Footer />
      <StickyMobileCTA />
    </main>
  );
}
