import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "La Liga Football Trivia Questions & Answers (2026)",
  description:
    "Test your La Liga knowledge with 60+ trivia questions covering Spanish football history, El Clasico, Real Madrid, Barcelona, record holders and the modern era.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/la-liga",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "La Liga Trivia Questions & Answers (2026) | Football IQ",
    description:
      "60+ La Liga trivia questions on history, El Clasico, record holders and Spain's biggest clubs. Can you answer them all?",
    url: "https://www.football-iq.app/quiz/la-liga",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Liga Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your La Liga knowledge with 60+ trivia questions. Spanish football history, El Clasico and records.",
  },
};

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
    id: "laliga-history",
    title: "La Liga History",
    description:
      "La Liga is the top tier of Spanish football, founded in 1929. Test your knowledge of its founding clubs, early champions and the cultural heritage that has made it one of the most respected leagues in world football.",
    easy: [
      {
        q: "In which year was La Liga founded?",
        a: "La Liga, the Primera Division, was founded in 1929. The first season was the 1928-29 campaign with 10 clubs.",
      },
      {
        q: "Which club won the very first La Liga title?",
        a: "Barcelona won the inaugural La Liga title in the 1928-29 season.",
      },
      {
        q: "Which three clubs are the only ones to have never been relegated from La Liga?",
        a: "Real Madrid, Barcelona and Athletic Bilbao have all been ever-present in the Spanish top flight since La Liga began.",
      },
      {
        q: "What is the name of the trophy awarded to the La Liga champions?",
        a: "The trophy is officially called the La Liga Trophy, also known as the Copa del Campeonato de Liga de Primera Division.",
      },
      {
        q: "How many clubs currently play in La Liga each season?",
        a: "20 clubs play in La Liga, each playing 38 matches across the season.",
      },
      {
        q: "Athletic Bilbao have a famous policy regarding player recruitment. What is it?",
        a: "Athletic Bilbao only sign players who are Basque by birth or who developed their footballing skills in the Basque Country.",
      },
    ],
    medium: [
      {
        q: "Which club is sometimes called the 'pioneer' of Spanish football and was founded in 1898?",
        a: "Athletic Bilbao, founded in 1898, are one of the oldest football clubs in Spain.",
      },
      {
        q: "Who founded Real Madrid in 1902?",
        a: "Real Madrid was founded by brothers Juan Padros and Carlos Padros, with the club originally called Madrid Football Club.",
      },
      {
        q: "Why does Real Madrid have the prefix 'Real' in their name?",
        a: "King Alfonso XIII granted Madrid the title 'Real' (Royal) in 1920, allowing the club to use the royal crown on its crest.",
      },
      {
        q: "Which club dominated La Liga during the 1940s with five titles in the decade?",
        a: "Atletico Madrid (then known as Atletico Aviacion) and Valencia were the dominant clubs of the 1940s, each winning multiple titles.",
      },
      {
        q: "Which club has won La Liga the most times in its history?",
        a: "Real Madrid have won La Liga more times than any other club in Spanish football history.",
      },
      {
        q: "Who were the only club outside Real Madrid, Barcelona and Atletico Madrid to win La Liga in the 21st century before 2024?",
        a: "Valencia won La Liga in 2001-02 and 2003-04 under Rafael Benitez.",
      },
    ],
    hard: [
      {
        q: "Which club won La Liga in 1999-2000 and was managed by Hector Cuper before he left for Inter?",
        a: "Deportivo La Coruna won the 1999-2000 La Liga title under Javier Irureta, ending the dominance of Madrid and Barcelona briefly.",
      },
      {
        q: "Which club has never won La Liga despite being one of the founding members?",
        a: "Espanyol, founded in 1900 and a founding La Liga member, have never won the Spanish top flight title.",
      },
      {
        q: "In which decade did the league first introduce three points for a win?",
        a: "La Liga adopted the three-points-for-a-win system in the 1995-96 season, in line with most major European leagues.",
      },
      {
        q: "Which club holds the record for the longest consecutive run in La Liga's top flight outside the big three?",
        a: "Valencia and Espanyol have had long runs in the top flight, though both have suffered relegation. Real Sociedad, Sevilla and Valencia all have lengthy modern-era runs.",
      },
    ],
    cta: {
      text: "Can you guess a player from their La Liga career history?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "laliga-clasico",
    title: "Real Madrid vs Barcelona",
    description:
      "El Clasico is one of football's greatest rivalries. From Di Stefano and Cruyff to Messi and Ronaldo, the matchups between Madrid and Barcelona have defined La Liga for nearly a century.",
    easy: [
      {
        q: "What is the name given to matches between Real Madrid and Barcelona?",
        a: "El Clasico, meaning 'The Classic' in Spanish, is the name given to matches between Real Madrid and Barcelona.",
      },
      {
        q: "Which iconic stadium is home to FC Barcelona?",
        a: "Camp Nou, located in Barcelona, has been Barcelona's home stadium since 1957.",
      },
      {
        q: "What is Real Madrid's home stadium called?",
        a: "The Santiago Bernabeu, named after the legendary club president, has been Real Madrid's home since 1947.",
      },
      {
        q: "Which Argentinian forward scored a record number of goals for Barcelona in El Clasico fixtures?",
        a: "Lionel Messi scored 26 goals against Real Madrid in El Clasico fixtures, more than any other player in the rivalry.",
      },
      {
        q: "Which Portuguese forward holds the second-most goals in El Clasico history?",
        a: "Cristiano Ronaldo scored 18 goals against Barcelona during his Real Madrid career.",
      },
      {
        q: "Which famous Dutch player joined Barcelona as a player in 1973 and later returned as manager?",
        a: "Johan Cruyff joined Barcelona as a player in 1973 and returned as manager in 1988, leading the legendary 'Dream Team'.",
      },
    ],
    medium: [
      {
        q: "Who managed Barcelona's famous 'Dream Team' of the early 1990s?",
        a: "Johan Cruyff managed the Dream Team that won four consecutive La Liga titles from 1990-91 to 1993-94, plus the 1992 European Cup.",
      },
      {
        q: "Which Brazilian forward signed for Real Madrid from Inter Milan in 2002 in a high-profile transfer?",
        a: "Ronaldo (Ronaldo Nazario) joined Real Madrid from Inter Milan in 2002 as part of the original Galacticos era.",
      },
      {
        q: "Which player joined Real Madrid from Manchester United in 2009 for a then-world record fee?",
        a: "Cristiano Ronaldo joined Real Madrid from Manchester United in 2009 for around 80 million pounds, a world record fee at the time.",
      },
      {
        q: "Pep Guardiola won three consecutive La Liga titles with Barcelona between which years?",
        a: "Pep Guardiola won three La Liga titles with Barcelona in 2008-09, 2009-10 and 2010-11.",
      },
      {
        q: "What was the score when Barcelona beat Real Madrid 5-0 at Camp Nou in November 2010?",
        a: "Barcelona beat Real Madrid 5-0 at Camp Nou on 29 November 2010 in a famous 'Manita' scoreline. Goals from Xavi, Pedro, Villa (2) and Jeffren.",
      },
      {
        q: "Who scored the famous 'Last Minute Clasico' goal at the Bernabeu in April 2017?",
        a: "Lionel Messi scored a 92nd-minute winner for Barcelona at the Bernabeu, then held up his shirt to the home fans.",
      },
    ],
    hard: [
      {
        q: "Which Argentinian forward joined Real Madrid in 1953 in a transfer dispute with Barcelona?",
        a: "Alfredo Di Stefano. Both Madrid and Barcelona claimed to have signed him, and after Spanish football authorities intervened, Di Stefano went to Real Madrid.",
      },
      {
        q: "What was the aggregate score of the 2002 Champions League semi-final between Real Madrid and Barcelona?",
        a: "Real Madrid won 3-1 on aggregate (2-0 at Camp Nou, 1-1 at the Bernabeu), with Zinedine Zidane and Steve McManaman among the scorers.",
      },
      {
        q: "Which Real Madrid manager won La Liga in 2007 with the club's lowest goal tally for a champion in the 21st century?",
        a: "Fabio Capello won La Liga with Real Madrid in 2006-07, an unspectacular but title-winning campaign.",
      },
      {
        q: "Which two players scored hat-tricks in El Clasico in the 21st century?",
        a: "Lionel Messi scored multiple Clasico hat-tricks for Barcelona. Cristiano Ronaldo also scored a Clasico hat-trick during his Real Madrid career.",
      },
    ],
    cta: {
      text: "Test your transfer knowledge across El Clasico and beyond.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "laliga-records",
    title: "La Liga Record Holders",
    description:
      "From the all-time top scorer to the most decorated managers, La Liga's record book features some of football's most celebrated names. Test your knowledge of the league's defining figures.",
    easy: [
      {
        q: "Who is La Liga's all-time top scorer?",
        a: "Lionel Messi is La Liga's all-time top scorer with 474 goals, all for Barcelona.",
      },
      {
        q: "Which player won the Pichichi Trophy a record number of times?",
        a: "Lionel Messi won the Pichichi Trophy (top scorer) a record eight times.",
      },
      {
        q: "Who is the all-time top scorer for Real Madrid in La Liga?",
        a: "Cristiano Ronaldo is Real Madrid's all-time top La Liga scorer with 311 goals during his time at the club.",
      },
      {
        q: "Which goalkeeper won the Zamora Trophy a record number of times?",
        a: "Antonio Ramallets and Victor Valdes have won the Zamora Trophy multiple times, with Valdes winning it five times for Barcelona.",
      },
      {
        q: "Who scored the most La Liga goals in a single season?",
        a: "Lionel Messi scored 50 La Liga goals in the 2011-12 season for Barcelona, a single-season record.",
      },
    ],
    medium: [
      {
        q: "Which player has made the most La Liga appearances in history?",
        a: "Andoni Zubizarreta, the legendary goalkeeper, made 622 La Liga appearances for Athletic Bilbao, Barcelona and Valencia.",
      },
      {
        q: "Who is the only player to win La Liga's Pichichi while playing for three different clubs?",
        a: "Telmo Zarra and Hugo Sanchez are among the legendary Pichichi winners. Sanchez famously won it for Atletico Madrid and Real Madrid.",
      },
      {
        q: "Which manager has won the most La Liga titles?",
        a: "Miguel Munoz won nine La Liga titles as manager of Real Madrid between 1960 and 1974.",
      },
      {
        q: "What is the longest unbeaten La Liga run by any club?",
        a: "Real Sociedad went 38 La Liga matches unbeaten between 1979 and 1980, a record for many years.",
      },
      {
        q: "Who scored a hat-trick in his La Liga debut for Real Madrid against Deportivo La Coruna in 2009?",
        a: "Karim Benzema impressed in his early Real Madrid days, though specific hat-tricks vary. Cristiano Ronaldo's first home hat-trick came against Mallorca in 2009.",
      },
      {
        q: "Which Mexican striker is one of the all-time top scorers in La Liga history?",
        a: "Hugo Sanchez scored 234 La Liga goals, mostly for Real Madrid, and is one of the all-time greats.",
      },
    ],
    hard: [
      {
        q: "Which Hungarian striker is celebrated as one of Real Madrid's most prolific goalscorers in the 1950s and 60s?",
        a: "Ferenc Puskas scored 156 La Liga goals for Real Madrid between 1958 and 1966, helping the club dominate Europe.",
      },
      {
        q: "Which Athletic Bilbao striker scored 251 La Liga goals and held the all-time record before Messi broke it?",
        a: "Telmo Zarra scored 251 La Liga goals for Athletic Bilbao, holding the all-time record from 1955 until Messi surpassed it.",
      },
      {
        q: "Which goalkeeper kept a record number of clean sheets in a single La Liga season?",
        a: "Claudio Bravo kept 23 clean sheets in 38 matches for Barcelona in the 2014-15 season, a single-season record.",
      },
      {
        q: "Which forward holds the record for the fastest La Liga hat-trick?",
        a: "Bebeto scored a hat-trick in under 3 minutes for Deportivo La Coruna in the mid-1990s, with various contenders for the fastest mark.",
      },
    ],
    cta: {
      text: "Step into the data and explore football's biggest records.",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
  {
    id: "laliga-modern",
    title: "Modern Era La Liga",
    description:
      "Since 2000 La Liga has been one of the most-watched leagues in the world, dominated by Real Madrid and Barcelona but with Atletico Madrid, Sevilla, Valencia and Villarreal all making their mark.",
    easy: [
      {
        q: "Which club won La Liga in 2013-14, breaking the dominance of Madrid and Barcelona?",
        a: "Atletico Madrid, managed by Diego Simeone, won La Liga in 2013-14, their first title since 1996.",
      },
      {
        q: "Which Argentinian manager has been at Atletico Madrid since 2011?",
        a: "Diego Simeone has managed Atletico Madrid since December 2011, becoming one of the longest-serving managers in European football.",
      },
      {
        q: "Which Croatian midfielder won multiple Champions League titles with Real Madrid?",
        a: "Luka Modric joined Real Madrid in 2012 from Tottenham and went on to win multiple Champions League titles with the club.",
      },
      {
        q: "Which French forward joined Real Madrid from Lyon in 2009 and became a club legend?",
        a: "Karim Benzema joined Real Madrid from Lyon in 2009 and went on to win the Ballon d'Or in 2022.",
      },
      {
        q: "Which Welsh forward joined Real Madrid in 2013 for a then-world record fee?",
        a: "Gareth Bale joined Real Madrid from Tottenham in 2013, scoring in two Champions League finals during his time at the club.",
      },
    ],
    medium: [
      {
        q: "Which Sevilla manager became famous for winning the Europa League multiple times?",
        a: "Unai Emery won three consecutive Europa League titles with Sevilla between 2014 and 2016.",
      },
      {
        q: "What is the nickname of Atletico Madrid's stadium that opened in 2017?",
        a: "Atletico Madrid moved to the Civitas Metropolitano (originally the Wanda Metropolitano) in 2017, leaving their historic Vicente Calderon home.",
      },
      {
        q: "Which Brazilian forward joined Barcelona from Santos in 2013 for a controversial transfer fee?",
        a: "Neymar joined Barcelona from Santos in 2013, in a transfer that later led to legal issues regarding the actual fee paid.",
      },
      {
        q: "Which Uruguayan striker formed the famous 'MSN' attack at Barcelona alongside Messi and Neymar?",
        a: "Luis Suarez joined Barcelona from Liverpool in 2014 to complete the legendary MSN front three.",
      },
      {
        q: "Which Belgian goalkeeper joined Real Madrid from Chelsea in 2018?",
        a: "Thibaut Courtois joined Real Madrid from Chelsea in 2018 and won the Yashin Trophy after the 2021-22 season.",
      },
    ],
    hard: [
      {
        q: "Which club, managed by Marcelo Bielsa, came close to challenging the big two in the early 1990s?",
        a: "Athletic Bilbao under Marcelo Bielsa from 2011-13 played some of the most exciting football in La Liga. They reached the Europa League and Copa del Rey finals in 2012.",
      },
      {
        q: "Which African forward was famously the first to win the Pichichi Trophy in the modern era for an unfancied club?",
        a: "Diego Forlan won the Pichichi for Villarreal in 2004-05 and again for Atletico Madrid in 2008-09, though he was Uruguayan.",
      },
      {
        q: "Which midfielder was the heart of Spain and Barcelona for over a decade and is regarded as one of the greatest passers of all time?",
        a: "Xavi Hernandez, who later became Barcelona's manager, was a generational midfielder for both Barcelona and Spain.",
      },
      {
        q: "Which iconic Barcelona midfielder retired in 2018 after winning seven La Liga titles?",
        a: "Andres Iniesta retired from Barcelona in 2018, having won every major trophy with the club.",
      },
    ],
    cta: {
      text: "Test how well you know modern La Liga players.",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
];

function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "Which club has won La Liga the most times?",
      acceptedAnswer:
        "Real Madrid have won La Liga more times than any other club, with Barcelona second on the all-time list.",
    },
    {
      name: "Who is the all-time top scorer in La Liga?",
      acceptedAnswer:
        "Lionel Messi is the all-time top scorer in La Liga with 474 goals, all scored for Barcelona.",
    },
    {
      name: "When was La Liga founded?",
      acceptedAnswer:
        "La Liga was founded in 1929. The first season featured 10 clubs, with Barcelona winning the inaugural title.",
    },
    {
      name: "Which clubs have never been relegated from La Liga?",
      acceptedAnswer:
        "Real Madrid, Barcelona and Athletic Bilbao have all been ever-present in La Liga since the league's foundation in 1929.",
    },
    {
      name: "What is El Clasico?",
      acceptedAnswer:
        "El Clasico is the name given to matches between Real Madrid and Barcelona, considered one of football's greatest rivalries.",
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

export default function LaLigaQuizPage() {
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
                  name: "La Liga Trivia",
                  item: "https://www.football-iq.app/quiz/la-liga",
                },
              ],
            },
          ],
        }}
      />
      <div className="min-h-screen bg-stadium-navy">
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
                La Liga
              </li>
            </ol>
          </nav>

          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            La Liga Football Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ La Liga trivia questions covering Spanish football
            history, El Clasico, record holders and the modern era. Questions
            are organised by difficulty - tap any question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From founding facts to all-time records.
          </p>

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

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-16">
              <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white mb-2">
                {section.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {section.description}
              </p>

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

              {section.cta && <InlineCTA {...section.cta} />}
            </section>
          ))}

          <div className="text-center py-10 border-t border-white/5">
            <h2 className="font-bebas text-2xl tracking-wide text-white mb-3">
              Ready to Test Your Knowledge?
            </h2>
            <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
              Football IQ has free daily games - guess players from career
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
