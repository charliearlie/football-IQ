import { createAdminClient } from "@/lib/supabase/server";
import { Hero, PlayableCareerPath, WeeklyFixtures, Footer } from "@/components/landing";
import { FALLBACK_CAREER_PUZZLE } from "@/lib/constants";
import type { CareerPathContent } from "@/types/careerPath";

export default async function LandingPage() {
  // Fetch today's career_path puzzle using admin client (bypasses RLS)
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: puzzle } = await supabase
    .from("daily_puzzles")
    .select("content")
    .eq("game_mode", "career_path")
    .eq("puzzle_date", today)
    .eq("status", "live")
    .single();

  // Fallback puzzle if none exists for today
  const careerPathData =
    (puzzle?.content as unknown as CareerPathContent) ?? FALLBACK_CAREER_PUZZLE;

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-bebas text-2xl tracking-wider text-floodlight">
            FOOTBALL IQ
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Playable Demo */}
      <PlayableCareerPath
        careerSteps={careerPathData.career_steps}
        answer={careerPathData.answer}
      />

      {/* Weekly Fixtures Grid */}
      <WeeklyFixtures />

      {/* Footer */}
      <Footer />
    </main>
  );
}
