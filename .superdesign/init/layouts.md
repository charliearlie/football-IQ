# Football IQ Landing Page Layout

## Main Page Layout (web/app/page.tsx)

```tsx
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

      {/* Playable Demo Section */}
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
```

## Section Components

### GameModeShowcase.tsx
```tsx
import { AppScreenshot } from "./AppScreenshot";
import { cn } from "@/lib/utils";

const GAME_MODES = [
  {
    title: "CAREER PATH",
    description: "The definitive daily challenge. Identify the mystery player from their career timeline. One wrong guess unlocks the next clue, but costs you points.",
    image: "/images/app-screens/career-path.png",
    color: "pitch-green"
  },
  {
    title: "TRANSFER GUESS",
    description: "Name the player from a single transfer. Revealed hints like year, nationality, and position aid your memory without giving it away.",
    image: "/images/app-screens/guess-the-transfer.png",
    color: "card-yellow"
  },
  {
    title: "GOALSCORER RECALL",
    description: "Race against the clock. You have 60 seconds to name every goalscorer from a classic match. The ultimate test of your match memory.",
    image: "/images/app-screens/goalscorer-recall.png",
    color: "red-card"
  },
  {
    title: "STARTING XI",
    description: "Find the missing players in iconic team lineups. A visual puzzle testing your knowledge of formations and squad depth.",
    image: "/images/app-screens/starting-xi.png",
    color: "amber"
  },
  {
    title: "TOP TENS",
    description: "Rank the greats. Guess the top 10 answers for a specific category, from 'Most PL Goals' to 'Most Caps for Brazil'.",
    image: "/images/app-screens/top-tens.png",
    color: "pitch-green"
  }
];

export function GameModeShowcase() {
  return (
    <section className="py-24 bg-stadium-navy/50 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-4">
            DAILY <span className="text-pitch-green">CHALLENGES</span>. ENDLESS <span className="text-pitch-green">TRIVIA</span>.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            We&apos;ve taken the football quiz formats you know and love, and perfected them for mobile.
            Miss a day? You can play the last 7 days from our archive for free.
          </p>
        </div>

        <div className="space-y-32">
          {GAME_MODES.map((mode, index) => (
            <div key={mode.title} className={cn(
              "flex flex-col gap-12 items-center",
              index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
            )}>

              {/* Text Side */}
              <div className="flex-1 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-2">
                  <span className="font-bebas text-3xl text-floodlight">0{index + 1}</span>
                </div>

                <h3 className="font-bebas text-4xl md:text-5xl text-floodlight tracking-wide">
                  {mode.title}
                </h3>

                <p className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  {mode.description}
                </p>
              </div>

              {/* Image Side */}
              <div className="flex-1 relative group">
                <div className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[500px] rounded-full blur-[80px] opacity-20 transition-opacity duration-500 group-hover:opacity-40",
                  `bg-${mode.color}`
                )} />
                <AppScreenshot
                  src={mode.image}
                  alt={`${mode.title} Gameplay`}
                  className="transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-1"
                />
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### FeatureSection.tsx
```tsx
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
              <div className="inline-block px-4 py-1.5 rounded-full bg-pitch-green/20 border border-pitch-green/30 text-pitch-green text-sm font-medium tracking-wide mb-6">
                POWERED BY AGENTIC AI
              </div>
              <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-6 leading-tight">
                ALWAYS <span className="text-pitch-green">UP TO DATE</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Our database isn&apos;t just a static list. We use advanced <span className="text-white font-semibold">Agentic AI</span> to track careers, transfers, and stats in real-time.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed mt-4">
                Missed a player? Our community can submit suggestions directly in the app, ensuring no cult hero is left behind.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl font-bebas text-floodlight mb-2">10K+</div>
                <div className="text-sm text-slate-400 font-medium tracking-wide">ELITE PLAYERS</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-4xl font-bebas text-floodlight mb-2">24/7</div>
                <div className="text-sm text-slate-400 font-medium tracking-wide">LIVE UPDATES</div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 mt-6">
               <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Agent running: Scanning latest transfers...</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
```

## Layout Structure

```
Landing Page
├── Navigation (fixed, blur backdrop)
│   ├── Logo (FOOTBALL IQ)
│   └── Nav Links (Game Modes, Database, Play Demo)
│
├── MarketingHero
│   ├── Background Blobs (decorative)
│   ├── Headline + Subtext
│   ├── App Store Badges
│   └── Floating App Screenshot
│
├── GameModeShowcase (#features)
│   ├── Section Header
│   └── 5x Game Mode Rows (alternating layout)
│
├── Bonus Banner
│   ├── "More Coming Soon"
│   └── "Bonus Rounds"
│
├── FeatureSection (#database)
│   ├── Database Screenshot
│   └── AI Feature Content + Stats
│
├── Demo Section (#demo)
│   ├── Section Header
│   ├── PlayableCareerPath (interactive)
│   └── CTA Card ("Get the Full Experience")
│
└── Footer
    ├── Logo
    ├── Legal Links
    └── Copyright
```
