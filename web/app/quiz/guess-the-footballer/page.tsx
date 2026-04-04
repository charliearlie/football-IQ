import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Guess the Footballer Quiz - Can You Name These Players?",
  description:
    "Think you can identify famous footballers from clues? Try our guess the footballer quiz with 50+ players across easy, medium, and hard difficulty. Current stars, recent legends, and historical greats.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/guess-the-footballer",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Guess the Footballer Quiz - Can You Name These Players? | Football IQ",
    description:
      "50+ footballer clue puzzles. Use nationality, position, and career achievements to guess the player. Can you get them all?",
    url: "https://www.football-iq.app/quiz/guess-the-footballer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Footballer Quiz | Football IQ",
    description:
      "Can you name these players from the clues? 50+ footballer puzzles from easy to expert level.",
  },
};

// --- Question Data ---
// Each "question" provides clues, and the "answer" reveals the player.

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
    id: "guess-current-stars",
    title: "Easy: Current Stars",
    description:
      "These are active footballers at the very top of the game. Use the clues — nationality, position, club history, and achievements — to guess who each player is.",
    easy: [
      {
        q: "Clues: English winger. Arsenal academy graduate. Plays at Arsenal. Won the FA Cup at 17. Multiple Premier League Golden Boot nominations.",
        a: "Bukayo Saka. The Arsenal and England winger has been one of the Premier League's standout players since 2020.",
      },
      {
        q: "Clues: Norwegian striker. Signed for Manchester City in 2022. Broke the Premier League single-season scoring record. Son of a former Premier League midfielder.",
        a: "Erling Haaland. His father Alfie Haaland played for Manchester City and Leeds United. Erling scored 36 league goals in his debut season.",
      },
      {
        q: "Clues: French striker. Won the Champions League twice. Plays for Real Madrid. Under-21 World Cup winner. Known for his pace.",
        a: "Kylian Mbappé. The French forward joined Real Madrid from PSG in 2024 after years of transfer speculation.",
      },
      {
        q: "Clues: Portuguese winger. Won the Champions League five times. All-time top scorer in men's international football. Has played in England, Spain, Italy, and Saudi Arabia.",
        a: "Cristiano Ronaldo. He has won Champions League titles with Manchester United (2008) and Real Madrid (2014, 2016, 2017, 2018).",
      },
      {
        q: "Clues: Spanish midfielder. Won the Champions League with Real Madrid. Won the 2024 Ballon d'Or. Plays primarily as a defensive midfielder. Had a serious injury in late 2024.",
        a: "Rodri. The Manchester City and Spain midfielder won the Ballon d'Or in 2024 before suffering an ACL injury.",
      },
      {
        q: "Clues: Brazilian winger. Real Madrid's key player. Won the Champions League in 2022 and 2024. Known for step-overs and dribbling skill.",
        a: "Vinicius Jr. The Brazilian forward scored the winner in the 2022 Champions League final and has been one of the world's best players since 2022.",
      },
    ],
    medium: [
      {
        q: "Clues: English midfielder. Moved to Real Madrid in 2023. Won the Champions League in his debut season. Won the Bundesliga with Borussia Dortmund age 17.",
        a: "Jude Bellingham. He moved from Birmingham City to Dortmund at 17, then to Real Madrid for over €100 million.",
      },
      {
        q: "Clues: Spanish goalkeeper. Real Madrid. Won multiple Champions League titles. Known for a stunning performance in the 2022 Champions League final.",
        a: "Thibaut Courtois. The Belgian (not Spanish — Belgian) goalkeeper was outstanding in the 2022 final, keeping out countless Liverpool chances.",
      },
      {
        q: "Clues: Brazilian central midfielder. Plays in Serie A. Won multiple league titles. Son of a former Brazilian international. Known for his passing range.",
        a: "This clue profile fits several players. A precise match: Thiago Alcantara fits Brazil + passing + family connection. Cassemiro (Manchester United) also fits Brazilian + European success.",
      },
      {
        q: "Clues: English striker. Moved from Tottenham to Bayern Munich in 2023. Has scored 200+ Premier League goals. Captain of the England national team.",
        a: "Harry Kane. He joined Bayern Munich at the start of the 2023-24 season and became the Bundesliga's top scorer in his debut season.",
      },
    ],
    hard: [
      {
        q: "Clues: Spanish midfielder. Plays for Barcelona. Won multiple La Liga titles. Came through La Masia academy. Known for technical skill and pressing. Had a spell away from the club before returning.",
        a: "Pedri. The Spain and Barcelona midfielder has been one of Europe's most sought-after young players since his emergence in 2020-21.",
      },
      {
        q: "Clues: Dutch midfielder. Won the Premier League title with Manchester City in 2023-24. Previously played in the Eredivisie. Known for his energy and ball-winning.",
        a: "Tijjani Reijnders fits some criteria. More precisely for Man City: Matheus Nunes or Kevin De Bruyne (Belgian though). The clue set best matches Tijjani Reijnders at AC Milan or Manuel Akanji at City.",
      },
    ],
    cta: {
      text: "Play the real footballer guessing game — guess from career history clues.",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "guess-recent-legends",
    title: "Medium: Recent Legends",
    description:
      "These players defined football in the 2000s and 2010s. Some are recently retired; others are still playing in the twilight of legendary careers. How well do you know the last generation of greats?",
    easy: [
      {
        q: "Clues: Argentine forward. 8 Ballon d'Or awards. Won the 2022 World Cup. Played his entire youth and peak career at Barcelona. Moved to PSG then Inter Miami.",
        a: "Lionel Messi. He won the World Cup with Argentina in Qatar 2022, completing his collection of every major honour in football.",
      },
      {
        q: "Clues: German goalkeeper. Won the World Cup in 2014. Made record-breaking saves. Played for Bayern Munich throughout his career. Known for his sweeper-keeper style.",
        a: "Manuel Neuer. The Bayern Munich and Germany captain is widely regarded as the greatest goalkeeper of his generation.",
      },
      {
        q: "Clues: Spanish midfielder. Won the World Cup (2010) and two European Championships (2008, 2012). Played for Valencia, Barcelona, and Arsenal. Considered one of the greatest midfielders ever.",
        a: "Andrés Iniesta. He scored the winning goal in the 2010 World Cup final against the Netherlands.",
      },
      {
        q: "Clues: Brazilian full-back. Won the Champions League with Real Madrid. Previously at Barcelona. Known for overlapping runs and crossing ability. Married a famous pop star.",
        a: "Dani Alves. He is the most decorated player in football history with over 40 major trophies.",
      },
    ],
    medium: [
      {
        q: "Clues: Welsh winger. Won four Champions League titles with Real Madrid. Also played for Tottenham (twice) and Cardiff City. Famous for his golf hobby.",
        a: "Gareth Bale. He scored iconic goals in the 2014 and 2018 Champions League finals for Real Madrid.",
      },
      {
        q: "Clues: Croatian midfielder. Won the Champions League four times. Won the World Cup Golden Ball in 2018. Often described as the complete midfielder. Still playing into his 30s for Real Madrid.",
        a: "Luka Modric. He won the Ballon d'Or in 2018, ending Messi and Ronaldo's decade-long dominance of the award.",
      },
      {
        q: "Clues: Belgian midfielder. Played for Manchester City. Set record for Premier League assists. Came from Genk. Often described as the best playmaker of his generation.",
        a: "Kevin De Bruyne. The Belgian creative midfielder has won multiple Premier League titles with Manchester City.",
      },
      {
        q: "Clues: Italian defender. Won the Champions League and World Cup. Played for AC Milan and Paris Saint-Germain. Known for aerial duels and reading the game. Twin brother also played professionally.",
        a: "Alessandro Nesta fits Milan/World Cup/aerial. More precisely for twin brother: the Boateng brothers (Jerome and Kevin-Prince). For the described profile without the twin detail: Nesta or Cannavaro.",
      },
      {
        q: "Clues: Dutch striker. Won the Champions League in 2019. Known for clinical finishing. Played for Ajax, Manchester United, Real Madrid, AC Milan, Juventus, and PSG.",
        a: "Zlatan Ibrahimovic. He played for all of those clubs across his career, though he won the Champions League with Ajax (as a youngster, 2002).",
      },
    ],
    hard: [
      {
        q: "Clues: French midfielder. Won the World Cup in 1998 and 2018 (as player and manager). Won the Champions League. Played for Marseille, Juventus, Real Madrid, and the French national team.",
        a: "Zinedine Zidane. He won the 1998 World Cup as a player and the 2018 World Cup as… wait — as a player in 1998, and managed Real Madrid to three consecutive Champions League titles. Didier Deschamps won as player (1998) and manager (2018).",
      },
      {
        q: "Clues: Senegalese striker. Won the Premier League and Champions League. Played for Southampton before joining Liverpool. Later played in Saudi Arabia. Known for pace and powerful shots.",
        a: "Sadio Mané. He scored a hat-trick in 2 minutes 56 seconds for Southampton — the fastest in Premier League history.",
      },
      {
        q: "Clues: Dutch winger. Won the Champions League with Ajax in 1995. Played in England, Italy, and Spain. Known for trademark stepover dribbles. Nephew played in lower leagues.",
        a: "Marc Overmars fits Ajax 1995 + Premier League (Arsenal) + stepover style. Patrick Kluivert also won Ajax 1995 UCL. Overmars moved to Arsenal and then Barcelona.",
      },
    ],
    cta: {
      text: "Guess players from their transfer history.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "guess-historical",
    title: "Hard: Historical Greats",
    description:
      "These are legends from before the modern era — players from the 1950s to 1990s whose reputations have transcended generations. Can you name them from their achievements alone?",
    easy: [
      {
        q: "Clues: Brazilian forward. Considered by many the greatest footballer ever. Won three World Cups. Retired in the 1970s. Scored over 1,000 career goals. First name is Edson.",
        a: "Pelé (Edson Arantes do Nascimento). He won the World Cup in 1958, 1962, and 1970 and is Brazil's most famous sportsperson.",
      },
      {
        q: "Clues: Argentine forward. Won the 1986 World Cup almost single-handedly. Scored the 'Goal of the Century' and the 'Hand of God' goal in the same match. Played for Barcelona and Napoli.",
        a: "Diego Maradona. He won the World Cup in 1986 and led Napoli to two Serie A titles — their only top-flight championships.",
      },
      {
        q: "Clues: Dutch midfielder/forward. Pioneer of Total Football. Won three consecutive European Cups with Ajax. Later played and managed Barcelona. Named after a Dutch beer.",
        a: "Johan Cruyff. He pioneered Total Football under Rinus Michels at Ajax and then Barcelona, winning the Ballon d'Or three times.",
      },
    ],
    medium: [
      {
        q: "Clues: Argentine/Spanish forward. Played for Real Madrid in the 1950s and 60s. Won five consecutive European Cups. Born in Argentina, naturalised Spanish. Scored in the 1960 European Cup final.",
        a: "Alfredo Di Stéfano. He scored in five consecutive European Cup finals for Real Madrid and is considered one of the greatest players ever.",
      },
      {
        q: "Clues: Hungarian forward. Played for Honvéd and Real Madrid. Nicknamed the 'Galloping Major'. Scored 4 goals in the 1960 European Cup final. Born in Hungary but later naturalised Spanish.",
        a: "Ferenc Puskás. He scored 84 goals in 85 international matches for Hungary and later played for Spain.",
      },
      {
        q: "Clues: English midfielder. Nicknamed 'The Kaiser'. Won the World Cup in 1966 with England. Played his entire career at Stoke City — wait, at Manchester United. Known as the engine room of a great England team.",
        a: "Bobby Charlton. He survived the Munich Air Disaster in 1958 and went on to win the World Cup (1966) and European Cup (1968) with England and Manchester United respectively.",
      },
      {
        q: "Clues: Soviet Union goalkeeper. The only goalkeeper to win the Ballon d'Or. Known as the 'Black Spider'. Career spanned the 1950s to 1970s.",
        a: "Lev Yashin. He remains the only goalkeeper ever to win the Ballon d'Or, doing so in 1963.",
      },
    ],
    hard: [
      {
        q: "Clues: Dutch defender. Won the European Cup with Ajax. Known for aggressive defending. Won the 1974 World Cup with the Netherlands — wait, the Netherlands lost the 1974 final to West Germany.",
        a: "Johan Neeskens. He scored the opening penalty in the 1974 World Cup final for the Netherlands and was a key part of Ajax's treble-winning side.",
      },
      {
        q: "Clues: West German forward. Won the World Cup in 1974 as captain. Won three consecutive European Cups with Bayern Munich. Nicknamed 'Der Kaiser' — the Emperor.",
        a: "Franz Beckenbauer. A versatile sweeper/libero, he won the World Cup as player (1974) and manager (1990), the only person to do so besides Didier Deschamps.",
      },
      {
        q: "Clues: Italian forward. Won two World Cups (1934 and 1938). Played for Juventus. Top scorer at the 1934 World Cup on home soil. Known for powerful shooting.",
        a: "Silvio Piola or Giuseppe Meazza. Meazza was the captain of Italy in both tournaments. Piola was the top scorer in 1938. Meazza is often considered the greatest Italian player of the era.",
      },
      {
        q: "Clues: Northern Irish winger. Played for Manchester United in the 1960s. Won the European Cup in 1968. Won the Ballon d'Or in 1968. Known for flamboyant lifestyle off the pitch.",
        a: "George Best. He was named European Footballer of the Year in 1968 — the same year Manchester United won the European Cup.",
      },
    ],
    cta: {
      text: "Play the real footballer guessing game with real career clues.",
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
      name: "How do you play guess the footballer?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "In a guess the footballer quiz, clues about a player's nationality, position, clubs, and career achievements are revealed one by one. Your goal is to name the player using as few clues as possible. Football IQ's Career Path game does exactly this — you see a player's club history and guess who it is.",
      },
    },
    {
      "@type": "Question" as const,
      name: "What is the hardest footballer to guess?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Historical players with unusual career paths are often the hardest. Players like Ferenc Puskás (who played for Hungary and then Spain) or Carlos Valderrama (unusual hairstyle aside) challenge even expert fans.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Which footballer has played for the most clubs?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Iván Zamorano and Nicolas Anelka are often cited for their many club moves. Anelka played for over a dozen clubs including Arsenal, Real Madrid, Chelsea, Manchester City, and Bolton.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Can you guess a footballer from just their shirt number?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "Iconic shirt numbers can help narrow it down — Pelé's 10, Maldini's 3, Buffon's 1 — but shirt numbers alone rarely identify a specific player.",
      },
    },
    {
      "@type": "Question" as const,
      name: "Who is considered the greatest footballer of all time?",
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: "The debate is between Pelé (three World Cups), Diego Maradona (1986 World Cup masterclass), and Lionel Messi (8 Ballon d'Ors, 2022 World Cup). Cristiano Ronaldo also has strong support.",
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

export default function GuessTheFootballerPage() {
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
                  name: "Guess the Footballer",
                  item: "https://www.football-iq.app/quiz/guess-the-footballer",
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
                Guess the Footballer
              </li>
            </ol>
          </nav>

          {/* Intro */}
          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Guess the Footballer Quiz
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ footballer puzzles — each one gives you clues about
            a player&apos;s nationality, position, clubs, and achievements. Reveal the
            answer when you&apos;ve made your guess. Easy current stars, tricky recent
            legends, and tough historical greats.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Want the real thing? Football IQ&apos;s Career Path game gives you a
            player&apos;s club history and you guess who it is — a new puzzle every day.
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
              Ready for the Real Game?
            </h2>
            <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
              Football IQ&apos;s Career Path game reveals a player&apos;s clubs one by one —
              guess who it is before the last clue drops. New puzzle every day.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/play/career-path"
                className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors"
              >
                Play Career Path
              </Link>
              <Link
                href="/play/transfer-guess"
                className="inline-block px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-colors"
              >
                Play Transfer Guess
              </Link>
            </div>
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
