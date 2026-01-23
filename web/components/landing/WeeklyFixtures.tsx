import { GameModeCard } from "./GameModeCard";

const GAME_MODES = [
  {
    name: "Career Path",
    icon: "/images/puzzles/career-path.png",
    schedule: "DAILY",
    isPremium: false,
  },
  {
    name: "Transfer Guess",
    icon: "/images/puzzles/guess-the-transfer.png",
    schedule: "DAILY",
    isPremium: false,
  },
  {
    name: "Goalscorer Recall",
    icon: "/images/puzzles/goalscorer-recall.png",
    schedule: "WED & SAT",
    isPremium: false,
  },
  {
    name: "Starting XI",
    icon: "/images/puzzles/starting-xi.png",
    schedule: "SUNDAYS",
    isPremium: false,
  },
  {
    name: "Top Tens",
    icon: "/images/puzzles/top-tens.png",
    schedule: "MON & THU",
    isPremium: true,
  },
  {
    name: "Topical Quiz",
    icon: "/images/puzzles/quiz.png",
    schedule: "TUESDAYS",
    isPremium: true,
  },
];

export function WeeklyFixtures() {
  return (
    <section className="py-16 px-4 bg-stadium-navy/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-bebas text-4xl text-center mb-2 tracking-wide">
          WEEKLY FIXTURES
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          New puzzles drop every day
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GAME_MODES.map((mode) => (
            <GameModeCard key={mode.name} {...mode} />
          ))}
        </div>
      </div>
    </section>
  );
}
