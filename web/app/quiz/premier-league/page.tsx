import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Premier League Football Trivia Questions & Answers (2026)",
  description:
    "Test your Premier League knowledge with 50+ trivia questions covering history, record holders, famous matches, and the modern era. From founding clubs to recent champions.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/premier-league",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Premier League Trivia Questions & Answers (2026) | Football IQ",
    description:
      "50+ Premier League trivia questions covering records, iconic moments, and famous players. Can you answer them all?",
    url: "https://www.football-iq.app/quiz/premier-league",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premier League Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your Premier League knowledge with 50+ trivia questions. History, records, and iconic moments.",
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
    id: "pl-history",
    title: "Premier League History",
    description:
      "The Premier League began in 1992 as a breakaway from the Football League First Division. Test your knowledge of the early years, founding clubs, and how the competition took shape.",
    easy: [
      {
        q: "In which year did the Premier League begin?",
        a: "The Premier League's inaugural season was 1992-93, starting on 15 August 1992.",
      },
      {
        q: "Which club won the first Premier League title in 1992-93?",
        a: "Manchester United, managed by Sir Alex Ferguson, won the inaugural Premier League title by 10 points.",
      },
      {
        q: "How many clubs competed in the original Premier League?",
        a: "22 clubs competed in the first season. The league reduced to 20 clubs from the 1995-96 season.",
      },
      {
        q: "Which club scored the very first Premier League goal?",
        a: "Brian Deane of Sheffield United scored the first Premier League goal against Manchester United on 15 August 1992.",
      },
      {
        q: "Who were the three clubs relegated at the end of the first Premier League season?",
        a: "Crystal Palace, Middlesbrough, and Nottingham Forest were relegated at the end of the 1992-93 season.",
      },
      {
        q: "Which club went the entire 2003-04 Premier League season unbeaten?",
        a: "Arsenal, known as 'The Invincibles', won 26 and drew 12 of their 38 matches without a single defeat.",
      },
    ],
    medium: [
      {
        q: "Why did the First Division clubs break away to form the Premier League in 1992?",
        a: "To negotiate their own TV rights deal independently from the Football League. The first deal was signed with BSkyB for £304 million over five years.",
      },
      {
        q: "Which club has been relegated from the Premier League the most times?",
        a: "Leicester City have been relegated from the Premier League on five occasions.",
      },
      {
        q: "Which manager has won the most Premier League titles?",
        a: "Sir Alex Ferguson won 13 Premier League titles with Manchester United between 1993 and 2013.",
      },
      {
        q: "What was the record Premier League points total for a single season until 2017-18?",
        a: "Chelsea set the record with 95 points in 2004-05 under José Mourinho. Manchester City then broke it with 100 points in 2017-18.",
      },
      {
        q: "Which club was the first to win back-to-back Premier League titles under two different managers?",
        a: "Manchester City won consecutive titles under Manuel Pellegrini (2013-14) then Pep Guardiola (2017-18, 2018-19). Arsenal were first under Wenger in back-to-back seasons (2001-02, 2003-04 non-consecutive).",
      },
      {
        q: "Who scored the Premier League's 10,000th goal?",
        a: "Papiss Cissé scored the 10,000th Premier League goal for Newcastle United against Swansea City in December 2011.",
      },
    ],
    hard: [
      {
        q: "Which club has spent the most consecutive seasons in the Premier League without relegation?",
        a: "Arsenal hold the record, having been ever-present in the Premier League from its first season in 1992-93 through to the 2022-23 season — over 30 consecutive seasons.",
      },
      {
        q: "What is the record number of goals scored in a single Premier League season by one club?",
        a: "Manchester City scored 106 goals in the 2017-18 season — the highest by any Premier League club in a single season.",
      },
      {
        q: "Which referee has officiated the most Premier League matches?",
        a: "Mike Dean refereed 560 Premier League matches between 2000 and 2022, the most by any official.",
      },
      {
        q: "What was the lowest points total for a Premier League champion?",
        a: "Manchester United won the title with 75 points in 1996-97, the lowest total for a Premier League-winning side.",
      },
    ],
    cta: {
      text: "Can you guess a player from their Premier League career history?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "pl-records",
    title: "Record Holders",
    description:
      "The Premier League is home to some of football's most impressive individual and team records. From the all-time top scorer to the fastest goals, test your knowledge here.",
    easy: [
      {
        q: "Who is the Premier League's all-time top scorer?",
        a: "Alan Shearer with 260 Premier League goals, scored for Blackburn Rovers (112) and Newcastle United (148).",
      },
      {
        q: "Which goalkeeper has kept the most Premier League clean sheets?",
        a: "Petr Cech kept 202 Premier League clean sheets, playing for Chelsea and Arsenal.",
      },
      {
        q: "Who scored the most Premier League goals in a single season?",
        a: "Erling Haaland scored 36 Premier League goals for Manchester City in the 2022-23 season.",
      },
      {
        q: "Which club has won the most Premier League titles?",
        a: "Manchester United with 13 Premier League titles (1993, 1994, 1996, 1997, 1999, 2000, 2001, 2003, 2007, 2008, 2009, 2011, 2013).",
      },
      {
        q: "Who holds the record for the most Premier League assists?",
        a: "Ryan Giggs holds the assists record with 162 Premier League assists, all for Manchester United.",
      },
    ],
    medium: [
      {
        q: "Which player has made the most Premier League appearances?",
        a: "Gareth Barry made 653 Premier League appearances for Aston Villa, Manchester City, Everton, and West Brom.",
      },
      {
        q: "Who scored the fastest goal in Premier League history?",
        a: "Shane Long scored for Southampton against Watford after just 7.69 seconds on 23 April 2019.",
      },
      {
        q: "What is the biggest winning margin in a single Premier League match?",
        a: "9-0. Manchester United beat Ipswich 9-0 in March 1995, and the same scoreline was repeated when Manchester United beat Southampton in February 2021.",
      },
      {
        q: "Who scored the fastest Premier League hat-trick?",
        a: "Sadio Mane scored a hat-trick in 2 minutes 56 seconds for Southampton against Aston Villa on 16 May 2015.",
      },
      {
        q: "Which club holds the record for the longest unbeaten Premier League run?",
        a: "Arsenal went 49 league matches unbeaten between May 2003 and October 2004, spanning the entire 2003-04 Invincibles season.",
      },
      {
        q: "Who has scored the most Premier League goals for a single club?",
        a: "Wayne Rooney scored 183 Premier League goals for Manchester United, the most for a single club in Premier League history.",
      },
    ],
    hard: [
      {
        q: "Which player scored in 11 consecutive Premier League matches?",
        a: "Jamie Vardy scored in 11 consecutive Premier League matches for Leicester City in 2015-16, breaking Ruud van Nistelrooy's record of 10.",
      },
      {
        q: "What is the record for most Premier League goals scored in a single match by one player?",
        a: "Five players have scored 5 goals in a single Premier League match: Andy Cole, Alan Shearer, Jermain Defoe, Dimitar Berbatov, and Sergio Aguero.",
      },
      {
        q: "Who is the youngest player to score a Premier League hat-trick?",
        a: "Michael Owen scored a hat-trick against Sheffield Wednesday on 14 February 1998, aged 18 years and 62 days.",
      },
      {
        q: "Which club conceded the fewest goals in a single Premier League season?",
        a: "Chelsea conceded just 15 goals in the 2004-05 season under José Mourinho — the fewest in a 38-game Premier League season.",
      },
    ],
    cta: {
      text: "Think you know your transfer records? Try Transfer Guess.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "pl-famous-matches",
    title: "Famous Matches",
    description:
      "The Premier League has produced some of football's most iconic moments. From title-winning last-gasp goals to historic collapses, these matches live long in the memory.",
    easy: [
      {
        q: "Which match is known as 'Aguerooooo' and decided the Premier League title in 2012?",
        a: "Manchester City vs Queens Park Rangers on the final day of the 2011-12 season. Sergio Aguero scored in the 93rd minute to win City's first title in 44 years.",
      },
      {
        q: "Which team famously won the Premier League from 25 points behind with 13 games to go — according to a viral meme?",
        a: "Leicester City's 2015-16 title win is often referenced. They were 5,000-1 outsiders at the start of the season, managed by Claudio Ranieri.",
      },
      {
        q: "Which match ended 'The Invincibles' unbeaten run in 2004?",
        a: "Manchester United beat Arsenal 2-0 at Old Trafford on 24 October 2004, ending Arsenal's 49-game unbeaten league run.",
      },
      {
        q: "In which season did Liverpool win their first Premier League title?",
        a: "Liverpool won their first Premier League title in the 2019-20 season under Jürgen Klopp, with 99 points.",
      },
    ],
    medium: [
      {
        q: "Which match is known as the 'Battle of Old Trafford' in 2003?",
        a: "Manchester United vs Arsenal on 21 September 2003. Ruud van Nistelrooy missed a penalty, and players clashed in the tunnel. Arsenal later won the 'Pizza Gate' return leg.",
      },
      {
        q: "What happened on the final day of the 1999-2000 Premier League season to deny Leeds United Champions League qualification?",
        a: "Arsenal drew with Aston Villa while Leeds, Sheffield United and others jostled. Arsenal finished third on goal difference, pushing Leeds out of the top three.",
      },
      {
        q: "Which match is nicknamed 'The Demolition Derby' after Liverpool beat Manchester United 3-0 at Old Trafford in 2023?",
        a: "Liverpool's 7-0 win at Old Trafford on 5 March 2023 was one of the most emphatic away victories in Premier League history.",
      },
      {
        q: "Which club came back from 3-0 down to draw 3-3 in a memorable 2019 Premier League match?",
        a: "Crystal Palace came back from 3-0 down against Manchester City at Selhurst Park to draw 3-3 in December 2018, ending City's record-breaking 18-match winning streak.",
      },
    ],
    hard: [
      {
        q: "What is the significance of 26 May 1999 in Premier League and Champions League history?",
        a: "Manchester United won the treble. They had already won the Premier League on the final day, then beat Bayern Munich 2-1 in the Champions League final in added time.",
      },
      {
        q: "In which match did referee Graham Poll show a yellow card to Josip Simunic three times without sending him off?",
        a: "This happened in Croatia vs Australia at the 2006 World Cup, not the Premier League. The famous Premier League refereeing error occurred with Poll showing Simon Davies three yellows for Tottenham vs Fulham in 2004.",
      },
      {
        q: "Which Premier League match saw 6 red cards in a single game?",
        a: "Bradford City vs Sheffield United had 5 red cards in December 1999. The all-time record for red cards in a Premier League match is 5, occurring across multiple fixtures.",
      },
    ],
  },
  {
    id: "pl-current-era",
    title: "Current Era (2018–2026)",
    description:
      "The modern Premier League era has been dominated by Pep Guardiola's Manchester City and Jürgen Klopp's Liverpool. Test your knowledge of recent seasons, signings, and champions.",
    easy: [
      {
        q: "How many Premier League titles did Manchester City win between 2018 and 2024?",
        a: "Manchester City won six Premier League titles in seven seasons: 2018-19, 2020-21, 2021-22, 2022-23, 2023-24 (and 2017-18).",
      },
      {
        q: "Who was the Premier League's top scorer in the 2022-23 season?",
        a: "Erling Haaland with 36 goals — breaking the single-season Premier League scoring record in his debut season in England.",
      },
      {
        q: "Which club did Jürgen Klopp manage when he won the Premier League in 2019-20?",
        a: "Liverpool. Klopp's Liverpool won with 99 points, finishing 18 points clear of second-place Manchester City.",
      },
      {
        q: "Which player won the Premier League Golden Boot in the 2023-24 season?",
        a: "Cole Palmer of Chelsea won the Golden Boot with 22 goals in the 2023-24 season.",
      },
      {
        q: "In which season did Arsenal come closest to winning the Premier League under Mikel Arteta without winning it?",
        a: "In 2022-23, Arsenal led the table for most of the season but finished second to Manchester City, falling away in the final weeks.",
      },
    ],
    medium: [
      {
        q: "Which record did Erling Haaland set in his first Premier League season?",
        a: "Haaland scored 36 Premier League goals in 2022-23, breaking the single-season record held jointly by Andy Cole and Alan Shearer (34). He also set a new Champions League record with 12 goals that season.",
      },
      {
        q: "Which club won back-to-back Premier League titles in 2018-19 and 2019-20?",
        a: "Trick question — Manchester City won in 2018-19 and Liverpool won in 2019-20. City won back-to-back in 2020-21 and 2021-22.",
      },
      {
        q: "Who became the first player to score a Premier League hat-trick from the bench?",
        a: "Ole Gunnar Solskjaer scored a hat-trick as a substitute for Manchester United against Nottingham Forest in February 1999 — though technically he scored 4 goals as a sub in that match.",
      },
      {
        q: "Which club replaced Tottenham Hotspur at the new Tottenham Hotspur Stadium's opening match in 2019?",
        a: "Tottenham opened their stadium with a 2-0 win over Crystal Palace in Premier League on 3 April 2019.",
      },
    ],
    hard: [
      {
        q: "What is the record for most consecutive Premier League wins?",
        a: "Manchester City won 18 consecutive Premier League matches between 2020 and 2021 — a record at the time.",
      },
      {
        q: "Which player made his Premier League debut aged 15 years and 174 days in 2022?",
        a: "Ethan Nwaneri became Arsenal's — and the Premier League's — youngest-ever player when he came on as a substitute against Brentford on 18 September 2022 aged 15 years and 181 days.",
      },
      {
        q: "In which season did the Premier League introduce VAR, and how was it initially received?",
        a: "VAR was introduced at the start of the 2019-20 season. Its early implementation was widely criticised for inconsistent interpretations of handball and offside decisions.",
      },
    ],
    cta: {
      text: "Test your knowledge of Premier League players.",
      href: "/play/career-path",
      label: "Play Career Path Free",
    },
  },
];

// FAQ schema entities
function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "Which club has won the most Premier League titles?",
      acceptedAnswer:
        "Manchester United with 13 Premier League titles, all won between 1993 and 2013 under Sir Alex Ferguson.",
    },
    {
      name: "Who is the all-time Premier League top scorer?",
      acceptedAnswer:
        "Alan Shearer with 260 goals, scored for Blackburn Rovers and Newcastle United.",
    },
    {
      name: "Which team went unbeaten in the entire 2003-04 Premier League season?",
      acceptedAnswer:
        "Arsenal, managed by Arsène Wenger. They went 38 games unbeaten and became known as 'The Invincibles'.",
    },
    {
      name: "What is the most Premier League goals scored by one player in a single season?",
      acceptedAnswer:
        "Erling Haaland scored 36 Premier League goals for Manchester City in the 2022-23 season.",
    },
    {
      name: "Who scored the first ever Premier League goal?",
      acceptedAnswer:
        "Brian Deane of Sheffield United scored the first Premier League goal, against Manchester United on 15 August 1992.",
    },
  ];

  return faqQuestions.map((fq) => ({
    "@type": "Question" as const,
    name: fq.name,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: fq.acceptedAnswer,
    },
  }));
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

export default function PremierLeagueQuizPage() {
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
                  name: "Premier League Trivia",
                  item: "https://www.football-iq.app/quiz/premier-league",
                },
              ],
            },
          ],
        }}
      />
      <div className="min-h-screen bg-stadium-navy">
        {/* Header */}
        <header className="border-b border-white/5 bg-stadium-navy/80 backdrop-blur-sm sticky top-0 z-10">
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
                Premier League
              </li>
            </ol>
          </nav>

          {/* Intro */}
          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Premier League Football Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ Premier League trivia questions covering the history,
            record holders, famous matches, and the modern era. Questions are
            organised by difficulty — tap any question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From founding facts to current-season records.
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
