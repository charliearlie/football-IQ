import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Champions League Trivia Questions & Quiz (2026)",
  description:
    "How well do you know the Champions League? 50+ trivia questions covering tournament history, legendary finals, record holders, and the modern era. Test yourself now.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/champions-league",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Champions League Trivia Questions & Quiz (2026) | Football IQ",
    description:
      "50+ Champions League trivia questions. From the European Cup era to the modern knockout stages — how much do you know?",
    url: "https://www.football-iq.app/quiz/champions-league",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Champions League Trivia Questions & Quiz (2026) | Football IQ",
    description:
      "Test your Champions League knowledge. 50+ questions on finals, records, and legendary nights.",
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
    id: "ucl-history",
    title: "Tournament History",
    description:
      "The Champions League traces its roots to the European Cup, first held in 1955-56. The competition was relaunched as the Champions League in 1992. Test your knowledge of its origins and evolution.",
    easy: [
      {
        q: "Which club has won the most Champions League / European Cup titles?",
        a: "Real Madrid with 15 titles as of 2024, including 6 consecutive European Cups from 1956 to 1960 (actually 5 consecutive, 1956-60).",
      },
      {
        q: "What was the Champions League called before 1992?",
        a: "The European Champion Clubs' Cup, commonly known as the European Cup. It was renamed the UEFA Champions League in 1992.",
      },
      {
        q: "Which club won the first European Cup in 1955-56?",
        a: "Real Madrid beat Stade de Reims 4-3 in the final held in Paris on 13 June 1956.",
      },
      {
        q: "Who is the all-time top scorer in the Champions League?",
        a: "Cristiano Ronaldo with 140 Champions League goals for Manchester United, Real Madrid, and Juventus.",
      },
      {
        q: "Which English club won back-to-back European Cups in 1979 and 1980?",
        a: "Nottingham Forest under manager Brian Clough, a remarkable achievement for a club that had only been promoted to the First Division two years earlier.",
      },
    ],
    medium: [
      {
        q: "What is the iconic Champions League anthem adapted from?",
        a: "Tony Britten's arrangement of George Frideric Handel's 'Zadok the Priest', composed for the competition's relaunch in 1992.",
      },
      {
        q: "Which three clubs have won the European Cup/Champions League three consecutive times?",
        a: "Real Madrid (1956-58 and 1966 — five-in-a-row; also 2016-18), Ajax (1971-73), and Bayern Munich (1974-76).",
      },
      {
        q: "How many English clubs have won the European Cup or Champions League?",
        a: "Six: Manchester United (1968, 1999), Liverpool (1977, 1978, 1981, 1984, 2005, 2019), Nottingham Forest (1979, 1980), Aston Villa (1982), Chelsea (2012, 2021), and Manchester City (2023).",
      },
      {
        q: "Which club was the first from outside the UK or Spain to win the European Cup?",
        a: "Inter Milan won the European Cup in 1964 and 1965, becoming the first Italian club to win the competition.",
      },
      {
        q: "What format change did UEFA introduce for the Champions League in 2024-25?",
        a: "The traditional group stage of 32 teams was replaced by a 36-team Swiss-model league phase, where each club plays 8 matches against different opponents.",
      },
    ],
    hard: [
      {
        q: "Who scored the winning goal in the first Champions League final (1992-93)?",
        a: "The first UEFA Champions League final was won by Marseille, who beat AC Milan 1-0 with a Basile Boli header on 26 May 1993. However, Marseille were later stripped of French titles due to a match-fixing scandal.",
      },
      {
        q: "Which club holds the record for most consecutive appearances in the Champions League knockout stages?",
        a: "Real Madrid appeared in the Champions League knockout stages for 27 consecutive seasons from their first entry through to 2023-24.",
      },
      {
        q: "Who won the UEFA Cup (now Europa League) in consecutive seasons of the same year a Champions League winner was in their country?",
        a: "This is a complex trivia category. More directly: the first club to win both the Champions League and UEFA Cup/Europa League in the same season is impossible — they are separate competitions.",
      },
    ],
    cta: {
      text: "Can you guess a player from their Champions League career?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "ucl-finals",
    title: "Legendary Finals",
    description:
      "Champions League finals have produced some of football's most dramatic moments. From last-gasp winners to miraculous comebacks, test your knowledge of the biggest nights in club football.",
    easy: [
      {
        q: "Which English club came back from 3-0 down to win the 2005 Champions League final on penalties?",
        a: "Liverpool beat AC Milan on penalties in Istanbul, Turkey — known as 'The Miracle of Istanbul'. Alonso, Smicer, and Gerrard's goal made it 3-3 before the shootout.",
      },
      {
        q: "Who scored two injury-time goals to win the 1999 Champions League final for Manchester United?",
        a: "Teddy Sheringham equalised in the 91st minute, then Ole Gunnar Solskjaer scored the winner in the 93rd minute against Bayern Munich in Barcelona.",
      },
      {
        q: "Which city hosted the 2023 Champions League final?",
        a: "Istanbul, Turkey. Manchester City beat Inter Milan 1-0 with a Rodri goal to complete Pep Guardiola's treble.",
      },
      {
        q: "Which club won the Champions League in 2022 by beating Liverpool 1-0 in the final?",
        a: "Real Madrid beat Liverpool 1-0 in Paris, with Vinicius Jr scoring the only goal. Thibaut Courtois was outstanding in goal.",
      },
    ],
    medium: [
      {
        q: "Who scored in both the 1998 and 2006 World Cup finals — and also in the 2002 Champions League final?",
        a: "Zinedine Zidane. He scored a spectacular volley in the 2002 Champions League final for Real Madrid against Bayer Leverkusen.",
      },
      {
        q: "In which final did Barcelona beat Manchester United 3-1 to complete their treble in 2009?",
        a: "The 2009 Champions League final at the Stadio Olimpico in Rome. Samuel Eto'o and Lionel Messi scored for Barcelona.",
      },
      {
        q: "Which Champions League final saw the highest aggregate goals scored?",
        a: "The 1960 European Cup final: Real Madrid 7-3 Eintracht Frankfurt at Hampden Park, Glasgow. Alfredo Di Stéfano scored 3 and Ferenc Puskás scored 4.",
      },
      {
        q: "Which player holds the record for most goals in Champions League final matches?",
        a: "Cristiano Ronaldo has scored 4 goals in Champions League finals — for Manchester United (2008) and Real Madrid (2014, 2016, 2017 — though the 2016 and 2017 finals went to extra time/penalties).",
      },
      {
        q: "Chelsea won the Champions League in 2012 against which club, and in what city?",
        a: "Chelsea beat Bayern Munich on penalties in Munich's Allianz Arena on 19 May 2012. Didier Drogba scored the equaliser in the 88th minute.",
      },
    ],
    hard: [
      {
        q: "Who is the youngest player to score in a Champions League final?",
        a: "Patrick Kluivert scored for Ajax in the 1995 final against AC Milan aged 18 years and 327 days, coming off the bench.",
      },
      {
        q: "Which Champions League final went to extra time and penalties in three consecutive years?",
        a: "No three-year run of finals all went to extra time/penalties. The 2005 (Liverpool), 2008 (Manchester United), 2012 (Chelsea), and 2022 (no — finished 1-0 to Real Madrid) finals ended in shootouts.",
      },
      {
        q: "Name the only manager to win the Champions League final with two different clubs.",
        a: "Several managers have won with two clubs: Ernst Happel (Feyenoord 1970, Hamburg 1983), Jupp Heynckes (Real Madrid 1998, Bayern Munich 2013), and Carlo Ancelotti (AC Milan 2003/2007, Real Madrid 2014/2016/2022/2024).",
      },
    ],
  },
  {
    id: "ucl-records",
    title: "Record Holders",
    description:
      "The Champions League has created some of club football's most extraordinary individual records. How many of these remarkable achievements can you identify?",
    easy: [
      {
        q: "Who has scored the most goals in a single Champions League campaign?",
        a: "Cristiano Ronaldo scored 17 goals in Real Madrid's 2013-14 Champions League campaign.",
      },
      {
        q: "Which club has appeared in the most Champions League finals?",
        a: "Real Madrid have appeared in 17 European Cup/Champions League finals.",
      },
      {
        q: "Who has won the most Champions League titles as a player?",
        a: "Francisco Gento won 6 European Cups with Real Madrid (1956-1966). In the modern era, several Real Madrid players have won 5+ titles.",
      },
    ],
    medium: [
      {
        q: "Which goalkeeper has kept the most Champions League clean sheets?",
        a: "Iker Casillas kept 57 clean sheets across his Champions League career with Real Madrid and Porto.",
      },
      {
        q: "What is the record for most goals scored in a single Champions League match?",
        a: "Luiz Adriano scored 5 goals for Shakhtar Donetsk against BATE Borisov in November 2014.",
      },
      {
        q: "Which two clubs have played the most Champions League finals against each other?",
        a: "Real Madrid and Juventus have met in three Champions League/European Cup finals (1998, 2003, 2017), with Real Madrid winning each time.",
      },
      {
        q: "Who has made the most Champions League appearances overall?",
        a: "Iker Casillas made 177 Champions League appearances across his career with Real Madrid and Porto.",
      },
    ],
    hard: [
      {
        q: "Which club has the highest win percentage in Champions League history (minimum 50 matches)?",
        a: "Real Madrid have the highest win percentage among clubs who have played 100+ Champions League matches.",
      },
      {
        q: "What is the largest aggregate score in a Champions League knockout tie?",
        a: "Barcelona beat Bayer Leverkusen 10-2 on aggregate in the 2011-12 quarter-finals (7-1 at home, then 3-1 away).",
      },
      {
        q: "Which player has scored in the most consecutive Champions League matches?",
        a: "Cristiano Ronaldo scored in 11 consecutive Champions League matches for Real Madrid across the 2017-18 and 2018-19 seasons.",
      },
    ],
    cta: {
      text: "Think you can name players from their Champions League clubs?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "ucl-modern-era",
    title: "Modern Era (2013–2026)",
    description:
      "Real Madrid's unprecedented dominance, Liverpool's comeback kings reputation, and Manchester City's first title — the modern Champions League has delivered unforgettable theatre.",
    easy: [
      {
        q: "How many Champions League titles did Real Madrid win between 2014 and 2024?",
        a: "Real Madrid won 6 Champions League titles in that period: 2014, 2016, 2017, 2018, 2022, and 2024.",
      },
      {
        q: "Who scored the winner for Liverpool in the 2019 Champions League final?",
        a: "Divock Origi scored twice (including an early goal) in Liverpool's 2-0 win over Tottenham Hotspur in Madrid.",
      },
      {
        q: "Which club came back from 3-0 down to beat Barcelona in the 2019 semi-final?",
        a: "Liverpool beat Barcelona 4-0 at Anfield — and 4-3 on aggregate — in a famous comeback, with Georginio Wijnaldum scoring twice.",
      },
      {
        q: "Who won the 2023-24 Champions League?",
        a: "Real Madrid beat Borussia Dortmund 2-0 in the final at Wembley. Dani Carvajal and Vinicius Jr scored.",
      },
    ],
    medium: [
      {
        q: "Which 2022 Champions League semi-final saw Real Madrid come back from 2-0 down in the second leg against Manchester City?",
        a: "Real Madrid trailed 2-0 at the Bernabeu before Rodrygo scored twice in added time to force extra time. Karim Benzema then won it with a penalty.",
      },
      {
        q: "Who scored the crucial away goal for Ajax against Real Madrid in the 2019 quarter-finals?",
        a: "Hakim Ziyech and David Neres scored as Ajax beat Real Madrid 4-1 at the Bernabeu in one of the biggest Champions League shocks.",
      },
      {
        q: "Which player won the Champions League Player of the Tournament in 2024?",
        a: "Dani Carvajal won the award after an exceptional tournament for Real Madrid.",
      },
    ],
    hard: [
      {
        q: "What record did Jude Bellingham set in the 2023-24 Champions League?",
        a: "Bellingham scored crucial goals throughout Real Madrid's run, including the equaliser against Manchester City and late goals against Napoli, continuing his exceptional debut season at the club.",
      },
      {
        q: "Which two clubs have been semi-finalists in both the 2023 and 2024 Champions League?",
        a: "Real Madrid and Bayern Munich were semi-finalists in both 2023 and 2024. Real Madrid beat both in those seasons.",
      },
    ],
    cta: {
      text: "Connect players through their club histories.",
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
      name: "Which club has won the most Champions League titles?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Real Madrid with 15 Champions League/European Cup titles as of 2024.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Who is the all-time top scorer in the Champions League?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Cristiano Ronaldo with 140 goals, scored for Manchester United, Real Madrid, and Juventus.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Which team came back from 3-0 down to win the Champions League final?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Liverpool in the 2005 final against AC Milan in Istanbul, known as 'The Miracle of Istanbul'. They levelled at 3-3 and won on penalties.",
      },
    },
    {
      "@type": "Question" as const,
      name: "When was the European Cup renamed the Champions League?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "The competition was renamed the UEFA Champions League in 1992, with a new group stage format introduced alongside the rebrand.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Who scored the most goals in a single Champions League season?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Cristiano Ronaldo scored 17 goals in the 2013-14 Champions League season for Real Madrid.",
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

export default function ChampionsLeagueQuizPage() {
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
                  name: "Champions League Trivia",
                  item: "https://www.football-iq.app/quiz/champions-league",
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
                Champions League
              </li>
            </ol>
          </nav>

          {/* Intro */}
          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Champions League Trivia Questions & Quiz (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ Champions League trivia questions from the European
            Cup era to the modern format. History, legendary finals, record
            holders, and the current era. Tap any question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. Covering every era of European club football&apos;s
            greatest competition.
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
