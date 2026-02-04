import { AppScreenshot } from "./AppScreenshot";
import { GameModeRibbon } from "./GameModeRibbon";
import { cn } from "@/lib/utils";

const GAME_MODES = [
  {
    title: "CAREER PATH",
    description:
      "The definitive daily challenge. Identify the mystery player from their career timeline. One wrong guess unlocks the next clue, but costs you points.",
    image: "/images/app-screens/career-path.png",
    color: "pitch-green",
    glowClass: "card-glow-green",
    icon: "🔍",
    tag: "DETECTIVE MODE",
    tagColor: "bg-pitch-green/20 text-pitch-green border-pitch-green/30",
    isFanFavorite: true,
  },
  {
    title: "TRANSFER GUESS",
    description:
      "Name the player from a single transfer. Revealed hints like year, nationality, and position aid your memory without giving it away.",
    image: "/images/app-screens/guess-the-transfer.png",
    color: "card-yellow",
    glowClass: "card-glow-yellow",
    icon: "💰",
    tag: "MONEY MOVES",
    tagColor: "bg-card-yellow/20 text-card-yellow border-card-yellow/30",
  },
  {
    title: "GOALSCORER RECALL",
    description:
      "Race against the clock. You have 60 seconds to name every goalscorer from a classic match. The ultimate test of your match memory.",
    image: "/images/app-screens/goalscorer-recall.png",
    color: "red-card",
    glowClass: "card-glow-red",
    icon: "⚡",
    tag: "SPEED ROUND",
    tagColor: "bg-coral/20 text-coral border-coral/30",
  },
  {
    title: "STARTING XI",
    description:
      "Find the missing players in iconic team lineups. A visual puzzle testing your knowledge of formations and squad depth.",
    image: "/images/app-screens/starting-xi.png",
    color: "amber",
    glowClass: "card-glow-amber",
    icon: "🧩",
    tag: "PUZZLE MODE",
    tagColor: "bg-amber/20 text-amber border-amber/30",
  },
  {
    title: "TOP TENS",
    description:
      "Rank the greats. Guess the top 10 answers for a specific category, from 'Most PL Goals' to 'Most Caps for Brazil'.",
    image: "/images/app-screens/top-tens.png",
    color: "pitch-green",
    glowClass: "card-glow-teal",
    icon: "📊",
    tag: "RANKING GAME",
    tagColor: "bg-teal/20 text-teal border-teal/30",
  },
];

export function GameModeShowcase() {
  return (
    <section className="py-24 bg-stadium-navy/50 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bebas text-5xl md:text-6xl text-floodlight mb-4 text-shadow-fun">
            DAILY <span className="text-pitch-green">CHALLENGES</span>. ENDLESS{" "}
            <span className="text-card-yellow">FUN</span>.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            We&apos;ve taken the football quiz formats you know and love, and
            perfected them for mobile. Miss a day? You can play the last 7 days
            from our archive for free.
          </p>
        </div>

        <div className="space-y-32">
          {GAME_MODES.map((mode, index) => (
            <div
              key={mode.title}
              className={cn(
                "flex flex-col gap-12 items-center",
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse",
              )}
            >
              {/* Text Side */}
              <div className="flex-1 space-y-6 text-center lg:text-left relative">
                {/* Icon Badge with Tag */}
                <div className="inline-flex flex-col sm:flex-row items-center gap-3">
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-3xl",
                      mode.glowClass,
                    )}
                  >
                    {mode.icon}
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border",
                      mode.tagColor,
                    )}
                  >
                    {mode.tag}
                  </span>
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
                {/* Fan Favorite Ribbon */}
                <div
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[500px] rounded-full blur-[80px] opacity-20 transition-opacity duration-500 group-hover:opacity-40",
                    `bg-${mode.color}`,
                  )}
                />
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
