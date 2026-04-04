import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FIFA World Cup Trivia Questions & Answers (2026)",
  description:
    "Challenge yourself with 50+ World Cup trivia questions covering history, host nations, legendary players, and shocking moments. From 1930 Uruguay to 2026 USA/Canada/Mexico.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/world-cup",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "FIFA World Cup Trivia Questions & Answers (2026) | Football IQ",
    description:
      "50+ World Cup trivia questions from every tournament. Brazil's 5 titles, upset wins, golden boot winners, and more.",
    url: "https://www.football-iq.app/quiz/world-cup",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FIFA World Cup Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your World Cup knowledge with 50+ trivia questions. History, records, and shocking moments.",
  },
};

// --- Question Data ---

interface TriviaQuestion {
  q: string;
  a: string;
}

interface TriviaSection {
  id: string;
  title: string;
  description: string;
  easy: TriviaQuestion[];
  medium: TriviaQuestion[];
  hard: TriviaQuestion[];
  cta?: { text: string; href: string; label: string };
}

const sections: TriviaSection[] = [
  {
    id: "wc-history",
    title: "World Cup History",
    description:
      "The FIFA World Cup began in 1930 and has grown into the world's most-watched sporting event. From the inaugural tournament in Uruguay to the expanded 48-team format in 2026, test your knowledge of the basics.",
    easy: [
      {
        q: "Which country has won the most FIFA World Cup titles?",
        a: "Brazil with 5 World Cup wins: 1958 (Sweden), 1962 (Chile), 1970 (Mexico), 1994 (USA), and 2002 (Japan/South Korea).",
      },
      {
        q: "In which year was the first FIFA World Cup held, and which country won it?",
        a: "The first World Cup was held in 1930, hosted by Uruguay. Uruguay won the tournament, beating Argentina 4-2 in the final.",
      },
      {
        q: "Which country won the 2022 FIFA World Cup in Qatar?",
        a: "Argentina, beating France 4-2 on penalties after a 3-3 draw (including extra time). Lionel Messi won the Golden Ball.",
      },
      {
        q: "Who is the all-time top scorer in World Cup history?",
        a: "Miroslav Klose of Germany with 16 goals, scored across four World Cups: 2002 (5), 2006 (5), 2010 (4), 2014 (2).",
      },
      {
        q: "How many teams compete in the 2026 FIFA World Cup?",
        a: "48 teams, expanded from 32 for the first time in World Cup history. The 2026 tournament is hosted by the USA, Canada, and Mexico.",
      },
      {
        q: "How often is the FIFA World Cup held?",
        a: "Every four years. The tournament was not held in 1942 or 1946 due to World War II.",
      },
    ],
    medium: [
      {
        q: "Which is the only country to have participated in every FIFA World Cup?",
        a: "Brazil have qualified for and competed in all 22 World Cups from 1930 to 2022 — the only nation with a 100% qualification record.",
      },
      {
        q: "Which country won the World Cup on home soil in 1966?",
        a: "England beat West Germany 4-2 in the final at Wembley. Geoff Hurst scored a hat-trick — the only one in a World Cup final.",
      },
      {
        q: "What was the 'Battle of Santiago' in the 1962 World Cup?",
        a: "A notoriously violent match between Chile and Italy on 2 June 1962. Two Italians were sent off and both sides brawled throughout. Chile won 2-0.",
      },
      {
        q: "In which year did Germany suffer the 'Miracle of Bern', winning the World Cup as underdogs?",
        a: "1954. West Germany beat Hungary 3-2 in the final despite Hungary being considered one of the greatest teams ever assembled. Hungary had beaten West Germany 8-3 in the group stage.",
      },
      {
        q: "Which tournament saw the first use of penalty shootouts to decide World Cup matches?",
        a: "The 1982 World Cup in Spain. The first ever World Cup shootout was the semi-final between West Germany and France.",
      },
    ],
    hard: [
      {
        q: "Which World Cup had the highest total goals scored across the tournament?",
        a: "The 1954 World Cup in Switzerland produced 140 goals in 26 matches — an average of 5.38 per game, still the highest in World Cup history.",
      },
      {
        q: "Which referee was responsible for the 1966 World Cup final, in which Geoff Hurst's 'ghost goal' crossed the line?",
        a: "Gottfried Dienst of Switzerland was the referee. Linesman Tofik Bakhramov confirmed the goal crossed the line, though debate continues to this day.",
      },
      {
        q: "Who are the only two nations to have hosted the World Cup twice?",
        a: "Mexico (1970 and 1986), Italy (1934 and 1990), France (1938 and 1998), Germany (1974 and 2006), and Brazil (1950 and 2014) have all hosted twice.",
      },
    ],
    cta: {
      text: "Think you know players from their international careers?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "wc-hosts",
    title: "Host Nations",
    description:
      "Hosting the World Cup is one of the greatest honours in international football. Test your knowledge of the countries that staged football's biggest show.",
    easy: [
      {
        q: "Which continent has hosted the most World Cup tournaments?",
        a: "Europe has hosted the most World Cups with 11 tournaments: 1934 (Italy), 1938 (France), 1954 (Switzerland), 1958 (Sweden), 1966 (England), 1974 (Germany), 1982 (Spain), 1990 (Italy), 1998 (France), 2006 (Germany), 2024 — and 2022 was Asia (Qatar).",
      },
      {
        q: "Which was the first African nation to host the World Cup?",
        a: "South Africa hosted the 2010 FIFA World Cup — the first on the African continent.",
      },
      {
        q: "Which Asian nations co-hosted the 2002 World Cup?",
        a: "Japan and South Korea co-hosted the 2002 World Cup — the first tournament held in Asia and the first co-hosted by two nations.",
      },
      {
        q: "Which city hosted the 2014 World Cup final?",
        a: "Rio de Janeiro, Brazil at the Estadio do Maracana. Germany beat Argentina 1-0 with a Mario Gotze goal in extra time.",
      },
    ],
    medium: [
      {
        q: "Which is the only host nation to win the World Cup in Europe outside their home continent?",
        a: "All host nations who have won the tournament have done so at home. Host nations who have won: Uruguay (1930), Italy (1934), England (1966), West Germany (1974), Argentina (1978), France (1998).",
      },
      {
        q: "Which stadium hosted both the 1986 World Cup final and a notorious crowd disaster?",
        a: "The Estadio Azteca in Mexico City hosted the 1986 final (Argentina vs West Germany). It previously hosted the 1970 final and will host matches in 2026.",
      },
      {
        q: "Which three countries will co-host the 2026 FIFA World Cup?",
        a: "The United States, Canada, and Mexico will co-host the 2026 World Cup — the first to be hosted by three nations, and the first with 48 teams.",
      },
      {
        q: "Which host nation suffered the biggest defeat in World Cup history on home soil?",
        a: "Brazil's 7-1 defeat to Germany in the 2014 semi-final at Belo Horizonte's Estadio Mineirao — known in Brazil as the 'Mineirazo'.",
      },
    ],
    hard: [
      {
        q: "Which city has hosted World Cup matches in three different tournaments?",
        a: "Mexico City (1970, 1986, and 2026) will become the only city to host World Cup matches in three tournaments.",
      },
      {
        q: "The 2022 World Cup was controversial for being held in which month, and why?",
        a: "November-December, instead of the traditional June-July. This was due to Qatar's extreme summer heat, disrupting all domestic leagues worldwide.",
      },
      {
        q: "Which host nation in 1978 won the World Cup amid political controversy?",
        a: "Argentina under a military junta hosted and won the 1978 World Cup. There were allegations that their 6-0 win over Peru was arranged to secure the goal difference needed to reach the final.",
      },
    ],
  },
  {
    id: "wc-legends",
    title: "Legendary Players",
    description:
      "The World Cup has been the stage for football's greatest players to write their legacies. From Pelé to Maradona to Messi — test your knowledge of the icons who defined their tournaments.",
    easy: [
      {
        q: "Which player is widely regarded as the greatest World Cup performer ever, winning it three times?",
        a: "Pelé of Brazil won three World Cups (1958, 1962, 1970) and remains the only player to do so. He was 17 when he scored in his first final.",
      },
      {
        q: "Who scored the 'Hand of God' goal at the 1986 World Cup?",
        a: "Diego Maradona scored with his hand in Argentina's quarter-final against England, then scored the 'Goal of the Century' in the same match.",
      },
      {
        q: "Which player won the 2022 World Cup Golden Ball as player of the tournament?",
        a: "Lionel Messi of Argentina won the Golden Ball, capping his career with his first World Cup winner's medal.",
      },
      {
        q: "Ronaldo (the Brazilian) scored how many World Cup goals in his career?",
        a: "Ronaldo Nazario scored 15 World Cup goals across 1994, 1998, 2002, and 2006 — a record at the time he retired.",
      },
      {
        q: "Which player was the first to score in four different World Cup tournaments?",
        a: "Pelé and Uwe Seeler both scored in four World Cup tournaments. Later, Cristiano Ronaldo and Lionel Messi also scored in five tournaments each.",
      },
    ],
    medium: [
      {
        q: "Who scored the fastest hat-trick in World Cup history?",
        a: "László Kiss of Hungary scored a hat-trick in 8 minutes in 1982 against El Salvador. In the modern era, Germany's Miroslav Klose scored quickly in multiple tournaments.",
      },
      {
        q: "Which player is the oldest to score at a World Cup?",
        a: "Roger Milla of Cameroon scored aged 42 years and 39 days against Russia at the 1994 World Cup — a record that still stands.",
      },
      {
        q: "Who won the Golden Boot (top scorer) at the 2018 World Cup in Russia?",
        a: "Harry Kane of England with 6 goals, including three penalties.",
      },
      {
        q: "Which player won three consecutive World Cup Golden Balls (player of the tournament)?",
        a: "No player has won three consecutive Golden Balls. Ronaldo won in 2002; Messi in 2014 and 2022. Zidane won in 2006.",
      },
      {
        q: "Who scored the 1,000th goal in World Cup history?",
        a: "Siphiwe Tshabalala's goal for South Africa in the opening match of the 2010 World Cup is widely cited, though exact counting varies by methodology.",
      },
    ],
    hard: [
      {
        q: "Which player scored a hat-trick in the 1966 World Cup final?",
        a: "Geoff Hurst of England scored a hat-trick in the final against West Germany — the only hat-trick in a World Cup final in history.",
      },
      {
        q: "Who is the only player to be sent off in a World Cup final?",
        a: "Zinedine Zidane was sent off in the 2006 World Cup final after headbutting Marco Materazzi of Italy. France lost 5-3 on penalties.",
      },
      {
        q: "Which goalkeeper went the longest without conceding a goal across a single World Cup tournament?",
        a: "Walter Zenga of Italy went 517 minutes without conceding in the 1990 World Cup before Argentina's Claudio Caniggia ended his run.",
      },
    ],
    cta: {
      text: "Can you guess World Cup legends from clues about their careers?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "wc-shocks",
    title: "Shocking Moments",
    description:
      "The World Cup has produced some of the biggest upsets in sporting history. From North Korea beating Italy to Germany's humiliation at home, these shocks defined their tournaments.",
    easy: [
      {
        q: "Which nation caused one of the biggest World Cup upsets by eliminating Italy in 1966?",
        a: "North Korea beat Italy 1-0 in the group stage at the 1966 World Cup in England — one of the greatest upsets in football history.",
      },
      {
        q: "Which World Cup semi-final is known as the 'Mineirazo' or 'Belo Horizonte Disaster'?",
        a: "Germany's 7-1 defeat of host nation Brazil in the 2014 semi-final. Germany scored 5 goals in 18 minutes.",
      },
      {
        q: "Which African team reached the World Cup semi-finals for the first time in 2022?",
        a: "Morocco became the first African nation to reach a World Cup semi-final in 2022, beating Portugal in the quarter-finals.",
      },
      {
        q: "Which nation pulled off the biggest World Cup upset of 2022 by beating Argentina in the group stage?",
        a: "Saudi Arabia beat Argentina 2-1 in the group stage at the 2022 World Cup — one of the all-time great upsets.",
      },
    ],
    medium: [
      {
        q: "Which nation knocked out defending champions France in the 2002 World Cup group stage?",
        a: "Senegal beat France 1-0 in the opening match, and France were eliminated in the group stage without scoring a goal.",
      },
      {
        q: "What happened to Spain, the defending champions, at the 2014 World Cup?",
        a: "Spain were eliminated in the group stage, losing 5-1 to the Netherlands and 2-0 to Chile. They finished last in their group despite having won in 2010.",
      },
      {
        q: "Which giant-killing performance by Cameroon at Italia '90 shocked football?",
        a: "Cameroon beat Argentina — the defending champions — 1-0 in the opening match. They reached the quarter-finals, the furthest any African team had gone at the time.",
      },
      {
        q: "USA's win over England at the 1950 World Cup is considered the biggest upset of that era. What was the score?",
        a: "The USA beat England 1-0 at the 1950 World Cup in Brazil. The goal was scored by Joe Gaetjens in the 37th minute.",
      },
    ],
    hard: [
      {
        q: "Which World Cup saw the lowest-ranked team reach the semi-finals?",
        a: "Croatia (then relatively unknown) reached the semi-finals of the 1998 World Cup in their first World Cup appearance, finishing third.",
      },
      {
        q: "The 1950 World Cup had no final — how was the winner decided?",
        a: "A four-team final round robin. Uruguay beat Brazil 2-1 in the last match, which effectively served as the final. Brazil only needed a draw to win the tournament.",
      },
      {
        q: "Which player scored for both teams in the same World Cup match in 1978?",
        a: "Ernie Brandts of the Netherlands scored an own goal and then a regular goal in the same match against Italy at the 1978 World Cup group stage.",
      },
    ],
    cta: {
      text: "How well do you know World Cup players?",
      href: "/play/career-path",
      label: "Play Career Path Free",
    },
  },
];

// FAQ schema entities
function getFaqSchemaEntities() {
  return [
    {
      "@type": "Question" as const,
      name: "Which country has won the most World Cups?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Brazil with 5 World Cup titles: 1958, 1962, 1970, 1994, and 2002.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Who is the all-time World Cup top scorer?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Miroslav Klose of Germany with 16 World Cup goals scored across the 2002, 2006, 2010, and 2014 tournaments.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Who won the 2022 FIFA World Cup?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Argentina, beating France 4-2 on penalties in Qatar. The match finished 3-3 after extra time, with Kylian Mbappé scoring a hat-trick for France.",
      },
    },
    {
      "@type": "Question" as const,
      name: "When and where is the 2026 World Cup?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "The 2026 FIFA World Cup is hosted by the United States, Canada, and Mexico in the summer of 2026. It is the first World Cup with 48 teams.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Which country is the only one to have played in every World Cup?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Brazil are the only country to have participated in all 22 FIFA World Cups from 1930 to 2022.",
      },
    },
  ];
}

function QuestionCard({ q, a }: TriviaQuestion) {
  return (
    <details className="group border border-white/10 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200 list-none flex items-center justify-between gap-3">
        <span>{q}</span>
        <span className="text-slate-500 group-open:rotate-45 transition-transform text-lg leading-none flex-shrink-0">
          +
        </span>
      </summary>
      <div className="px-4 pb-3 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
        {a}
      </div>
    </details>
  );
}

function DifficultyBadge({ level }: { level: "Easy" | "Medium" | "Hard" }) {
  const colors = {
    Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Hard: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${colors[level]}`}
    >
      {level}
    </span>
  );
}

function InlineCTA({
  text,
  href,
  label,
}: {
  text: string;
  href: string;
  label: string;
}) {
  return (
    <div className="my-8 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-center">
      <p className="text-sm text-slate-300 mb-3">{text}</p>
      <Link
        href={href}
        className="inline-block px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {label}
      </Link>
    </div>
  );
}

export default function WorldCupQuizPage() {
  const totalQuestions = sections.reduce(
    (sum, s) => sum + s.easy.length + s.medium.length + s.hard.length,
    0
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              mainEntity: getFaqSchemaEntities(),
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
                  name: "Football Trivia Questions",
                  item: "https://www.football-iq.app/football-trivia-questions",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "World Cup Trivia",
                  item: "https://www.football-iq.app/quiz/world-cup",
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
              href="/play"
              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded transition-colors"
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
                <Link href="/" className="hover:text-slate-300 transition-colors">
                  Football IQ
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/football-trivia-questions"
                  className="hover:text-slate-300 transition-colors"
                >
                  Trivia Questions
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-400" aria-current="page">
                World Cup
              </li>
            </ol>
          </nav>

          {/* Intro */}
          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            FIFA World Cup Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ World Cup trivia questions covering history, host
            nations, legendary players, and shocking moments. From Uruguay 1930 to
            the expanded 2026 tournament. Tap any question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. Perfect preparation for the upcoming tournament.
          </p>

          {/* Table of Contents */}
          <nav className="mb-12 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
              Jump to section
            </p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-slate-300 hover:text-emerald-400 transition-colors px-3 py-1 rounded-full border border-white/10 hover:border-emerald-500/30"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          {/* Sections */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-16">
              <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white mb-2">
                {section.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {section.description}
              </p>

              {/* Easy */}
              <div className="mb-6">
                <div className="mb-3">
                  <DifficultyBadge level="Easy" />
                </div>
                <div className="space-y-2">
                  {section.easy.map((q, i) => (
                    <QuestionCard key={`${section.id}-easy-${i}`} {...q} />
                  ))}
                </div>
              </div>

              {/* Medium */}
              <div className="mb-6">
                <div className="mb-3">
                  <DifficultyBadge level="Medium" />
                </div>
                <div className="space-y-2">
                  {section.medium.map((q, i) => (
                    <QuestionCard key={`${section.id}-medium-${i}`} {...q} />
                  ))}
                </div>
              </div>

              {/* Hard */}
              <div className="mb-6">
                <div className="mb-3">
                  <DifficultyBadge level="Hard" />
                </div>
                <div className="space-y-2">
                  {section.hard.map((q, i) => (
                    <QuestionCard key={`${section.id}-hard-${i}`} {...q} />
                  ))}
                </div>
              </div>

              {/* CTA */}
              {section.cta && <InlineCTA {...section.cta} />}
            </section>
          ))}

          {/* Bottom CTA */}
          <div className="text-center py-10 border-t border-white/5">
            <h2 className="font-bebas text-2xl tracking-wide text-white mb-3">
              Ready to Test Your Knowledge?
            </h2>
            <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
              Football IQ has free daily games — guess players from career
              histories, test your transfer knowledge, and more.
            </p>
            <Link
              href="/play"
              className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors"
            >
              Play Free Daily Games
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
