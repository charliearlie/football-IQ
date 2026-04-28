import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Football History Trivia Questions & Answers (2026)",
  description:
    "Test your football history knowledge with 60+ trivia questions covering the origins of the game, pre-WW2 football, the post-war era and the modern game's evolution.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/football-history",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Football History Trivia Questions & Answers (2026) | Football IQ",
    description:
      "60+ football history trivia questions on the origins of the game, pre-war football, the post-war era and modern eras. Can you answer them all?",
    url: "https://www.football-iq.app/quiz/football-history",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Football History Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your football history knowledge with 60+ trivia questions. Origins of the game, pre-war and modern eras.",
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
    id: "history-origins",
    title: "Origins of the Game",
    description:
      "Football has roots stretching back centuries, but the modern game took shape in 19th-century England. Test your knowledge of how the rules were codified, the first clubs were formed and the game spread around the world.",
    easy: [
      {
        q: "In which country was modern football codified?",
        a: "Modern football was codified in England, with the founding of The Football Association in 1863.",
      },
      {
        q: "In which year was The Football Association (FA) founded?",
        a: "The Football Association was founded in 1863, making it the oldest football governing body in the world.",
      },
      {
        q: "Which English club is widely regarded as the world's oldest football club?",
        a: "Sheffield FC, founded in 1857, is recognised by FIFA as the world's oldest football club still in existence.",
      },
      {
        q: "What was the name given to the original FA-codified rules?",
        a: "They were called the Laws of the Game, and the first version was agreed in 1863, distinguishing association football from rugby football.",
      },
      {
        q: "Which international football governing body was founded in 1904?",
        a: "FIFA (Federation Internationale de Football Association) was founded in Paris in 1904.",
      },
      {
        q: "Which English city is sometimes called the 'home of football'?",
        a: "Sheffield is sometimes called the 'home of football' due to Sheffield FC, the world's oldest club, and the city's role in early football.",
      },
    ],
    medium: [
      {
        q: "What was the original split between association football and rugby football about?",
        a: "The split came over disagreements on whether players could carry the ball with their hands and whether 'hacking' (kicking opponents in the shins) should be allowed.",
      },
      {
        q: "When was the first international football match played?",
        a: "The first official international football match was played between Scotland and England in Glasgow in 1872, ending 0-0.",
      },
      {
        q: "Who is credited with codifying the original Laws of the Game in 1863?",
        a: "The original Laws were codified by representatives from various clubs and schools meeting at the Freemason's Tavern in London in October 1863.",
      },
      {
        q: "Which two countries played in the first international match?",
        a: "Scotland played England in the first international match in 1872 at Hamilton Crescent, Glasgow.",
      },
      {
        q: "When was the first World Cup held and where?",
        a: "The first World Cup was held in 1930 in Uruguay, with 13 teams competing.",
      },
      {
        q: "Which Englishman is known as the 'Prince of Dribblers' from the early days of football?",
        a: "John Thomson and others were renowned dribblers in early football. Many early footballers became known by such nicknames in the 19th century.",
      },
    ],
    hard: [
      {
        q: "What was the original method of scoring in early football?",
        a: "In early football, matches were often decided by counting goals (kicks through the goalposts), with no crossbars and goals being any height.",
      },
      {
        q: "When was the crossbar introduced to football goals?",
        a: "The crossbar was introduced in 1875, replacing the earlier tape stretched between two posts.",
      },
      {
        q: "When was the penalty kick introduced to football?",
        a: "The penalty kick was introduced in 1891 by the International Football Association Board.",
      },
      {
        q: "Which English country first allowed professionalism in football?",
        a: "England formally allowed professionalism in 1885, after years of debate over amateur versus paid players.",
      },
    ],
    cta: {
      text: "Trace players through football's most storied clubs.",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "history-prewar",
    title: "Pre-WW2 Football",
    description:
      "The decades between the World Wars saw football grow from an English game to a truly global sport. The first World Cup, the rise of professional leagues across Europe and South America, and the era of the great pre-war stars all shaped what football would become.",
    easy: [
      {
        q: "Which country won the first FIFA World Cup in 1930?",
        a: "Uruguay won the first FIFA World Cup in 1930, beating Argentina 4-2 in the final on home soil.",
      },
      {
        q: "Which country hosted the first World Cup?",
        a: "Uruguay hosted the first World Cup in 1930, with all matches played in Montevideo.",
      },
      {
        q: "Which country won the 1934 World Cup?",
        a: "Italy won the 1934 World Cup on home soil, beating Czechoslovakia 2-1 in the final after extra time.",
      },
      {
        q: "Which country won the 1938 World Cup?",
        a: "Italy retained the World Cup in 1938, beating Hungary 4-2 in the final in Paris.",
      },
      {
        q: "Which Italian manager led the country to back-to-back World Cup titles in 1934 and 1938?",
        a: "Vittorio Pozzo managed Italy to consecutive World Cup titles in 1934 and 1938 - the only manager to win two World Cups.",
      },
    ],
    medium: [
      {
        q: "Which Austrian player was famously known as the 'Wunderteam' captain in the 1930s?",
        a: "Matthias Sindelar, nicknamed 'The Mozart of Football', was the captain of Austria's Wunderteam, one of the great pre-war sides.",
      },
      {
        q: "Which country's national team was famously known as the 'Wunderteam' in the 1930s?",
        a: "Austria's national team was known as the 'Wunderteam' in the early 1930s under coach Hugo Meisl, playing innovative attacking football.",
      },
      {
        q: "Which English club was the first to win the FA Cup three times consecutively?",
        a: "Blackburn Rovers won the FA Cup three times in a row from 1884 to 1886.",
      },
      {
        q: "Which English club was the first to do the league and FA Cup 'Double' in the 20th century?",
        a: "Aston Villa were the first to do the modern Double in 1896-97. Tottenham later achieved it in 1960-61.",
      },
      {
        q: "Which legendary English manager managed Huddersfield Town to three consecutive titles in the 1920s?",
        a: "Herbert Chapman led Huddersfield Town to three consecutive league titles in the 1920s before moving to Arsenal.",
      },
      {
        q: "Which manager revolutionised tactics at Arsenal in the 1930s with the WM formation?",
        a: "Herbert Chapman managed Arsenal in the late 1920s and early 1930s, popularising the WM formation and modern tactical thinking.",
      },
    ],
    hard: [
      {
        q: "Which Hungarian striker was the all-time top scorer in the 1930s?",
        a: "Gyorgy Sarosi, Imre Schlosser and others were among the most prolific Hungarian strikers of the pre-war era.",
      },
      {
        q: "Which year did the FIFA World Cup first feature European and South American teams together?",
        a: "The 1930 World Cup was the first to feature both European and South American teams, though only four European nations made the long journey to Uruguay.",
      },
      {
        q: "What innovative tactical shift did Herbert Chapman make at Arsenal in the late 1920s?",
        a: "Chapman shifted from the 2-3-5 formation to the WM (3-2-2-3) formation after the 1925 offside law change, revolutionising defensive tactics.",
      },
      {
        q: "Which year did the offside law change to require two defenders instead of three?",
        a: "The offside law was changed in 1925 from requiring three defenders to requiring two between the attacker and the goal.",
      },
    ],
    cta: {
      text: "Place football's earliest moments in chronological order.",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
  {
    id: "history-postwar",
    title: "Post-War Era",
    description:
      "Football emerged from World War II ready to expand. The European Cup was founded, the great Hungarian and Brazilian sides changed how the game was played, and stars like Pele, Di Stefano and Eusebio defined a golden age.",
    easy: [
      {
        q: "When was the European Cup (now Champions League) first contested?",
        a: "The European Cup was first contested in the 1955-56 season, with Real Madrid winning the first five editions.",
      },
      {
        q: "Which club won the first five European Cup finals from 1956 to 1960?",
        a: "Real Madrid won the first five European Cup finals consecutively from 1956 to 1960, with Alfredo Di Stefano leading the way.",
      },
      {
        q: "Which Brazilian forward famously announced himself at the 1958 World Cup at age 17?",
        a: "Pele, then aged 17, scored six goals in the 1958 World Cup including a hat-trick in the semi-final and two in the final.",
      },
      {
        q: "Which country won three of the first four World Cups after the war (1958, 1962, 1970)?",
        a: "Brazil won the World Cup in 1958, 1962 and 1970, becoming the first country to win three titles.",
      },
      {
        q: "Which Hungarian forward famously played for Honved and the Hungarian 'Magic Magyars'?",
        a: "Ferenc Puskas was the captain of Hungary's 'Magic Magyars' in the 1950s and later joined Real Madrid to become a club legend.",
      },
      {
        q: "What is the famous match in 1953 in which England were beaten by Hungary?",
        a: "Hungary beat England 6-3 at Wembley in November 1953, the first time England had lost a home match to a continental European side.",
      },
    ],
    medium: [
      {
        q: "Which Argentinian forward dominated European football with Real Madrid in the late 1950s?",
        a: "Alfredo Di Stefano, an Argentine-born Spanish forward, was the heart of Real Madrid's first European Cup-winning sides.",
      },
      {
        q: "Which Portuguese forward famously starred for Benfica in the 1960s?",
        a: "Eusebio, the 'Black Pearl', led Benfica to the European Cup in 1962 and was the top scorer at the 1966 World Cup with nine goals.",
      },
      {
        q: "Which English club won the European Cup in 1968?",
        a: "Manchester United won the European Cup in 1968, beating Benfica 4-1 at Wembley with goals from Bobby Charlton (2), George Best and Brian Kidd.",
      },
      {
        q: "Which Dutch club popularised 'Total Football' in the 1970s?",
        a: "Ajax popularised Total Football in the early 1970s under Rinus Michels and Johan Cruyff, winning three consecutive European Cups (1971-1973).",
      },
      {
        q: "Which country famously played 'Total Football' at the 1974 World Cup?",
        a: "The Netherlands, captained by Johan Cruyff, played Total Football at the 1974 World Cup but lost the final to West Germany 2-1.",
      },
      {
        q: "Which English manager won the European Cup with Liverpool three times?",
        a: "Bob Paisley won three European Cups with Liverpool in 1977, 1978 and 1981.",
      },
    ],
    hard: [
      {
        q: "What was the date of the Munich air disaster involving Manchester United?",
        a: "The Munich air disaster occurred on 6 February 1958 when a plane carrying the Manchester United squad crashed at Munich-Riem Airport, killing 23 people including eight players.",
      },
      {
        q: "Which famous match is known as the 'Battle of Berne' from the 1954 World Cup?",
        a: "The 'Battle of Berne' was the 1954 World Cup quarter-final between Hungary and Brazil, which featured fights and red cards. Hungary won 4-2.",
      },
      {
        q: "Which Brazilian manager led the country to the 1970 World Cup with arguably the greatest team ever?",
        a: "Mario Zagallo, who had also won the 1958 and 1962 World Cups as a player, managed Brazil to the 1970 title.",
      },
      {
        q: "Which 1960 European Cup final is considered one of the greatest matches ever?",
        a: "Real Madrid beat Eintracht Frankfurt 7-3 at Hampden Park in the 1960 European Cup final, with Puskas scoring four and Di Stefano three.",
      },
    ],
    cta: {
      text: "Connect football's golden-era legends.",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
  {
    id: "history-modern",
    title: "Modern Eras",
    description:
      "From the founding of the Premier League and the Bosman ruling to the dominance of Pep Guardiola's Barcelona and the Messi-Ronaldo era, modern football has been defined by globalisation, money and individual brilliance.",
    easy: [
      {
        q: "In which year was the Premier League founded?",
        a: "The Premier League was founded in 1992 as a breakaway from the Football League First Division.",
      },
      {
        q: "In which year did the Bosman ruling change football transfers?",
        a: "The Bosman ruling came into effect in 1995, allowing players to move freely between clubs at the end of their contracts.",
      },
      {
        q: "Which player won the Ballon d'Or six times in the 2010s?",
        a: "Lionel Messi won the Ballon d'Or six times during the 2010s. Cristiano Ronaldo won it five times in the same decade.",
      },
      {
        q: "Which manager led Barcelona to a famous treble in 2008-09?",
        a: "Pep Guardiola managed Barcelona to the treble in 2008-09: La Liga, Copa del Rey and Champions League.",
      },
      {
        q: "Which English manager won the Premier League with Leicester City in 2015-16?",
        a: "Claudio Ranieri (Italian) won the Premier League with Leicester City in 2015-16, with the club priced at 5,000-1 to win the title at the start of the season.",
      },
      {
        q: "Which African nation hosted the World Cup in 2010?",
        a: "South Africa hosted the 2010 World Cup, the first held on the African continent.",
      },
    ],
    medium: [
      {
        q: "Which English club went 49 league matches unbeaten between 2003 and 2004?",
        a: "Arsenal, the famous 'Invincibles' under Arsene Wenger, went 49 Premier League matches unbeaten between 2003 and 2004.",
      },
      {
        q: "Which French manager won three Premier League titles with Arsenal?",
        a: "Arsene Wenger won three Premier League titles with Arsenal: 1997-98, 2001-02 and 2003-04.",
      },
      {
        q: "Which Spanish forward joined Manchester United in 2003 from Sporting Lisbon?",
        a: "Cristiano Ronaldo joined Manchester United from Sporting Lisbon in 2003 for around 12.24 million pounds.",
      },
      {
        q: "Which French striker was Manchester United's top scorer in their 1999 treble-winning season?",
        a: "Dwight Yorke was Manchester United's top scorer in the 1998-99 treble-winning season, though he was Trinidadian rather than French.",
      },
      {
        q: "Which year did VAR get introduced to the Premier League?",
        a: "VAR (Video Assistant Referee) was introduced to the Premier League at the start of the 2019-20 season.",
      },
      {
        q: "Which manager won the Champions League with three different clubs?",
        a: "Carlo Ancelotti has won the Champions League with multiple clubs including AC Milan and Real Madrid.",
      },
    ],
    hard: [
      {
        q: "Which Brazilian player was famously transferred to Real Madrid from Inter Milan in 2002?",
        a: "Ronaldo (Ronaldo Nazario) joined Real Madrid from Inter Milan in 2002 in a high-profile transfer, beginning the original 'Galacticos' era.",
      },
      {
        q: "Which Spanish midfielder is considered one of the greatest passers in football history?",
        a: "Xavi Hernandez of Barcelona is widely regarded as one of the greatest passers ever, central to Spain's golden era and Barcelona's tiki-taka.",
      },
      {
        q: "Which Champions League final was famously decided by Sergio Aguero's late goal?",
        a: "Sergio Aguero's famous late goal won the 2011-12 Premier League title for Manchester City, not the Champions League. The final was won by Chelsea against Bayern Munich on penalties that year.",
      },
      {
        q: "Which year did UEFA introduce the Europa League rebranding from the UEFA Cup?",
        a: "UEFA rebranded the UEFA Cup as the UEFA Europa League starting from the 2009-10 season.",
      },
    ],
    cta: {
      text: "Test your knowledge of football's biggest transfers.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
];

function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "When was football codified?",
      acceptedAnswer:
        "Modern football was codified in England in 1863 with the founding of The Football Association, which established the Laws of the Game.",
    },
    {
      name: "What is the world's oldest football club?",
      acceptedAnswer:
        "Sheffield FC, founded in 1857, is recognised by FIFA as the world's oldest football club still in existence.",
    },
    {
      name: "When was the first international football match played?",
      acceptedAnswer:
        "The first official international football match was played between Scotland and England at Hamilton Crescent, Glasgow, in 1872, ending 0-0.",
    },
    {
      name: "When was FIFA founded?",
      acceptedAnswer:
        "FIFA (Federation Internationale de Football Association) was founded in Paris in 1904.",
    },
    {
      name: "When was the Premier League founded?",
      acceptedAnswer:
        "The Premier League was founded in 1992 as a breakaway from the Football League First Division, beginning play in the 1992-93 season.",
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

export default function FootballHistoryQuizPage() {
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
                  name: "Football History Trivia",
                  item: "https://www.football-iq.app/quiz/football-history",
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
                Football History
              </li>
            </ol>
          </nav>

          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Football History Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ football history trivia questions covering the
            origins of the game, pre-WW2 football, the post-war era and modern
            eras. Questions are organised by difficulty - tap any question to
            reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From the 1863 founding of The Football Association
            to the modern game.
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
