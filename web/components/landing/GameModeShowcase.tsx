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
            We've taken the football quiz formats you know and love, and perfected them for mobile. 
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
