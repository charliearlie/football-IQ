import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title:
    "Football Connections - Daily Football Puzzle Game | Football IQ",
  description:
    "Group 16 footballers into 4 hidden categories in Football Connections. A daily puzzle game inspired by NYT Connections, built for football fans. Free to play.",
  alternates: {
    canonical: "https://www.football-iq.app/football-connections",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Football Connections - Daily Football Puzzle Game | Football IQ",
    description:
      "Group 16 footballers into 4 hidden categories. A daily football connections puzzle. Free to play in your browser.",
    url: "https://www.football-iq.app/football-connections",
    type: "website",
    images: [
      {
        url: "/api/og/play/connections",
        width: 1200,
        height: 630,
        alt: "Football Connections - Group 16 players into 4 categories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Football Connections - Daily Football Puzzle Game | Football IQ",
    description:
      "Group 16 footballers into 4 hidden categories. Free daily football puzzle.",
    images: ["/api/og/play/connections"],
  },
};

const faqs = [
  {
    q: "What is Football Connections?",
    a: "Football Connections is a daily puzzle game where you are given 16 footballer names and must sort them into 4 groups of 4 based on a hidden connection. Connections can be anything — shared clubs, nationalities, awards, shirt numbers, or something more creative. It is inspired by the NYT Connections format but built entirely for football fans.",
  },
  {
    q: "How do you play Football Connections?",
    a: "Select 4 footballers from a grid of 16 that you think share a hidden connection, then submit your guess. If you are correct, the group is revealed with a colour. Categories are colour-coded from easy (yellow) to very hard (purple). You have 4 lives — each wrong guess costs one life. Find all 4 groups before you run out of lives to win.",
  },
  {
    q: "Is Football Connections free?",
    a: "Yes. Football Connections is completely free to play in your browser at football-iq.app/play/connections. No account or app download is required. A new puzzle is published regularly.",
  },
  {
    q: "How is Football Connections different from NYT Connections?",
    a: "NYT Connections uses words and general knowledge categories. Football Connections uses 16 real footballers and the connections are always football-themed — shared clubs, international teammates, transfer histories, awards, and more. The core mechanic (find 4 groups of 4) is the same, but every puzzle is crafted for football fans.",
  },
  {
    q: "What kinds of connections appear in Football Connections?",
    a: "Connections range from straightforward (players who all played for the same club) to deviously tricky (players whose surnames are also cities, or who all scored in a specific final). Yellow groups are the easiest, purple groups are the hardest. Every puzzle has a mix of difficulty levels.",
  },
  {
    q: "Can I play old Football Connections puzzles?",
    a: "Football IQ Pro subscribers can access the full archive of past Connections puzzles. Free players get the latest puzzle every time they visit.",
  },
  {
    q: "Is there a Football Connections app?",
    a: "Yes. Football Connections is one of 11 game modes in the Football IQ app, available free on the App Store. The app includes additional modes like Career Path, Transfer Guess, Timeline, and more.",
  },
];

export default function FootballConnectionsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Football IQ",
                  item: "https://www.football-iq.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Football Connections",
                  item: "https://www.football-iq.app/football-connections",
                },
              ],
            },
          ],
        }}
      />
      <div className="min-h-screen bg-[#0a1628]">
        {/* Header */}
        <header className="border-b border-white/5 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-bebas text-xl tracking-wider text-floodlight/80 hover:text-floodlight transition-colors"
            >
              FOOTBALL IQ
            </Link>
            <Link
              href="/play/connections"
              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded transition-colors"
            >
              Play Now
            </Link>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-slate-500">
              <li>
                <Link
                  href="/"
                  className="hover:text-slate-300 transition-colors"
                >
                  Football IQ
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-400" aria-current="page">
                Football Connections
              </li>
            </ol>
          </nav>

          {/* Hero */}
          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Football Connections
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            Football Connections is a daily puzzle game where you group 16
            footballers into 4 hidden categories. Inspired by NYT Connections
            and built for football fans, each puzzle challenges you to find the
            link between players — whether it is a shared club, nationality,
            award, or something more creative.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            New puzzles published regularly. Free to play in your browser.
          </p>

          {/* Play CTA */}
          <div className="mb-12 p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-center">
            <h2 className="font-bebas text-2xl tracking-wide text-white mb-2">
              Play Today&apos;s Connections Puzzle
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              16 footballers. 4 hidden groups. Can you find them all?
            </p>
            <Link
              href="/play/connections"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              Play Football Connections Free
            </Link>
          </div>

          {/* How to Play */}
          <section className="mb-12">
            <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white mb-4">
              How to Play Football Connections
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Study the grid",
                  desc: "You are presented with a 4x4 grid of 16 footballer names. Four hidden groups of 4 players are mixed together.",
                },
                {
                  step: "2",
                  title: "Select 4 players",
                  desc: "Tap or click 4 players you think share a connection. The connection could be a shared club, nationality, award, transfer destination, or something less obvious.",
                },
                {
                  step: "3",
                  title: "Submit your guess",
                  desc: "If all 4 players belong to the same group, the group is revealed with a colour — yellow (easiest), green, blue, or purple (hardest).",
                },
                {
                  step: "4",
                  title: "Find all 4 groups",
                  desc: "You have 4 lives. Each wrong guess costs a life. Find all 4 groups before running out of lives to complete the puzzle.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tips & Strategy */}
          <section className="mb-12">
            <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white mb-4">
              Tips & Strategy
            </h2>
            <div className="space-y-3">
              {[
                {
                  title: "Start with the easiest group",
                  desc: "If you can spot an obvious connection (e.g. 4 players who all played for Barcelona), lock it in first. Every correct group makes the remaining grid smaller and easier to read.",
                },
                {
                  title: "Watch for misdirection",
                  desc: "Some players fit multiple possible categories. A player who played for both Real Madrid and Manchester United could belong to either group. Think about which grouping accounts for all 4 players.",
                },
                {
                  title: "Use the colours as a guide",
                  desc: "Yellow groups are the most straightforward. Purple groups are designed to be tricky — expect wordplay, obscure shared stats, or lateral connections.",
                },
                {
                  title: "Think beyond clubs",
                  desc: "Connections can be based on shirt numbers, transfer fees, international caps, managers, award winners, birth cities, or creative themes. Do not assume every group is about which club a player played for.",
                },
                {
                  title: "Save your lives",
                  desc: "You only have 4 wrong guesses before the game ends. If you are not confident, keep looking rather than guessing. A careful approach often reveals the purple group that seemed impossible at first.",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="p-4 rounded-lg border border-white/10 bg-white/[0.02]"
                >
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Connection Types */}
          <section className="mb-12">
            <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white mb-4">
              Types of Connections
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Football Connections puzzles use a wide variety of connection
              types. Here are some examples of the categories you might
              encounter:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: "Shared Club",
                  example: "Players who all played for AC Milan",
                  color: "bg-yellow-500/20 text-yellow-400",
                },
                {
                  label: "Same Nationality",
                  example: "Players who all represented Brazil",
                  color: "bg-green-500/20 text-green-400",
                },
                {
                  label: "Award Winners",
                  example: "Ballon d'Or winners from the 2010s",
                  color: "bg-blue-500/20 text-blue-400",
                },
                {
                  label: "Creative Theme",
                  example: "Surnames that are also animals",
                  color: "bg-purple-500/20 text-purple-400",
                },
              ].map((type) => (
                <div
                  key={type.label}
                  className="p-3 rounded-lg border border-white/10 bg-white/[0.02]"
                >
                  <span
                    className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${type.color} mb-2`}
                  >
                    {type.label}
                  </span>
                  <p className="text-sm text-slate-400">{type.example}</p>
                </div>
              ))}
            </div>
          </section>

          {/* More game modes CTA */}
          <div className="mb-12 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-center">
            <p className="text-sm text-slate-300 mb-3">
              Like Football Connections? Try our other daily football games.
            </p>
            <Link
              href="/play"
              className="inline-block px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              See All Games
            </Link>
          </div>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border border-white/10 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200 list-none flex items-center justify-between gap-3">
                    <span>{faq.q}</span>
                    <span className="text-slate-500 group-open:rotate-45 transition-transform text-lg leading-none flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-4 pb-3 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="text-center py-10 border-t border-white/5">
            <h2 className="font-bebas text-2xl tracking-wide text-white mb-3">
              Ready to Play?
            </h2>
            <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
              A new Football Connections puzzle is waiting. Group 16 footballers
              into 4 hidden categories — free in your browser.
            </p>
            <Link
              href="/play/connections"
              className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              Play Football Connections
            </Link>
          </div>
        </main>

        {/* Mini footer */}
        <footer className="border-t border-white/5 py-6 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="font-bebas text-lg tracking-wider text-floodlight/40"
            >
              FOOTBALL IQ
            </Link>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Football IQ
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
