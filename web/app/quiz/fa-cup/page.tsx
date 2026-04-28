import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FA Cup Football Trivia Questions & Answers (2026)",
  description:
    "Test your FA Cup knowledge with 60+ trivia questions on the world's oldest football competition - history, famous finals, giant-killings and modern winners.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/fa-cup",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "FA Cup Trivia Questions & Answers (2026) | Football IQ",
    description:
      "60+ FA Cup trivia questions covering football's oldest competition. From famous finals to giant-killings, can you answer them all?",
    url: "https://www.football-iq.app/quiz/fa-cup",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FA Cup Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your FA Cup knowledge with 60+ trivia questions. The world's oldest football competition.",
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
    id: "facup-history",
    title: "FA Cup History",
    description:
      "The FA Cup is the world's oldest national football competition, first played in 1871-72. Test your knowledge of the trophy's origins, founding clubs and the rich heritage of England's premier knockout cup.",
    easy: [
      {
        q: "In which year was the FA Cup first contested?",
        a: "The FA Cup was first contested in the 1871-72 season, making it the oldest national football competition in the world.",
      },
      {
        q: "Which club won the inaugural FA Cup in 1872?",
        a: "Wanderers F.C. won the inaugural FA Cup, beating Royal Engineers 1-0 at the Kennington Oval.",
      },
      {
        q: "What does 'FA' stand for in FA Cup?",
        a: "FA stands for The Football Association, the governing body of football in England, founded in 1863.",
      },
      {
        q: "Which iconic London stadium has hosted FA Cup finals since 2007?",
        a: "Wembley Stadium has hosted the FA Cup final since the new stadium reopened in 2007. The original Wembley hosted finals from 1923 to 2000.",
      },
      {
        q: "Which famous song is traditionally sung before the FA Cup final?",
        a: "'Abide with Me' has been sung before the FA Cup final since 1927, becoming a beloved tradition.",
      },
      {
        q: "Which club has won the FA Cup the most times?",
        a: "Arsenal hold the record for the most FA Cup wins, with 14 titles.",
      },
    ],
    medium: [
      {
        q: "Why is the FA Cup also sometimes called the 'Magic of the Cup'?",
        a: "The phrase refers to the unpredictability of the competition, where lower-league teams can defeat top-flight giants in a single knockout match.",
      },
      {
        q: "Which manager has won the FA Cup the most times?",
        a: "Arsene Wenger won the FA Cup seven times as Arsenal manager, making him the most successful manager in the competition's history.",
      },
      {
        q: "Which club did the FA Cup first non-English winner come from?",
        a: "Cardiff City won the FA Cup in 1927, the only time a club from outside England has lifted the trophy.",
      },
      {
        q: "What is the name of the famous trophy presented to FA Cup winners?",
        a: "The FA Cup trophy has been presented in various forms. The current trophy is the third major design and was first presented in 1992.",
      },
      {
        q: "Which round of the FA Cup do Premier League and Championship clubs traditionally enter?",
        a: "Premier League and Championship clubs enter the FA Cup at the Third Round Proper stage, which traditionally takes place in early January.",
      },
      {
        q: "What was unique about the 1923 FA Cup final?",
        a: "The 1923 final at Wembley, between Bolton Wanderers and West Ham United, was famously overcrowded with an estimated 200,000 spectators. It became known as the 'White Horse Final' after a police horse helped clear the pitch.",
      },
    ],
    hard: [
      {
        q: "Which FA Cup final ended in a famous 'fog' due to weather conditions?",
        a: "Multiple FA Cup matches have been affected by fog. The 1937 FA Cup final between Sunderland and Preston North End is often cited as one notable example.",
      },
      {
        q: "Which club won three consecutive FA Cup finals in the 1880s?",
        a: "Blackburn Rovers won three consecutive FA Cup finals from 1884 to 1886, an early era of dominance in the competition.",
      },
      {
        q: "When was the FA Cup final first televised in colour?",
        a: "The FA Cup final was first televised in colour in 1968.",
      },
      {
        q: "Which club won the FA Cup as a non-league team in the modern era?",
        a: "No non-league team has won the modern FA Cup. Tottenham Hotspur won in 1901 as a Southern League club, before joining the Football League.",
      },
    ],
    cta: {
      text: "Trace players through their FA Cup-winning careers.",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "facup-finals",
    title: "Famous Finals",
    description:
      "FA Cup finals have produced some of football's most memorable moments. From last-minute winners to dramatic comebacks, the showpiece at Wembley has delivered countless classic matches.",
    easy: [
      {
        q: "Which FA Cup final is famously known as the 'Matthews Final'?",
        a: "The 1953 FA Cup final between Blackpool and Bolton Wanderers is known as the 'Matthews Final' after Stanley Matthews helped Blackpool win 4-3 from 3-1 down.",
      },
      {
        q: "Which Liverpool manager won the FA Cup in 1986 to complete the club's first ever League and Cup double?",
        a: "Kenny Dalglish, as player-manager, led Liverpool to the FA Cup and First Division double in 1985-86, beating Everton 3-1 in the final.",
      },
      {
        q: "Which Coventry City manager famously lifted the FA Cup in 1987?",
        a: "John Sillett managed Coventry City to their famous FA Cup win in 1987, beating Tottenham Hotspur 3-2 after extra time.",
      },
      {
        q: "Which Manchester United manager won the FA Cup five times?",
        a: "Sir Alex Ferguson won the FA Cup five times as Manchester United manager (1990, 1994, 1996, 1999, 2004).",
      },
      {
        q: "Which legendary forward scored Manchester United's winner in the 1999 FA Cup final?",
        a: "Teddy Sheringham and Paul Scholes scored as Manchester United beat Newcastle United 2-0 in the 1999 FA Cup final, completing the first leg of the treble.",
      },
    ],
    medium: [
      {
        q: "Which FA Cup final saw the famous Steven Gerrard goal that completed a stunning comeback?",
        a: "The 2006 FA Cup final between Liverpool and West Ham United, where Gerrard scored a long-range equaliser in the 91st minute. Liverpool won on penalties.",
      },
      {
        q: "Who scored Wimbledon's winner in the famous 1988 FA Cup final upset?",
        a: "Lawrie Sanchez scored the only goal as Wimbledon beat Liverpool 1-0 in the 1988 FA Cup final - one of the greatest upsets in the competition's history.",
      },
      {
        q: "Which Eric Cantona moment defined the 1996 FA Cup final?",
        a: "Eric Cantona scored the only goal as Manchester United beat Liverpool 1-0 in the 1996 FA Cup final, completing the Double for the second time in three seasons.",
      },
      {
        q: "Which club beat Manchester City in the 2011 FA Cup final to deny City their first trophy under their new owners?",
        a: "Stoke City reached the 2011 FA Cup final but lost 1-0 to Manchester City, who won their first major trophy in 35 years thanks to a Yaya Toure goal.",
      },
      {
        q: "Which FA Cup final saw a goalkeeper score?",
        a: "Roberto Carlos and others have scored in cup finals, but in FA Cup history, the moment of a goalkeeper saving rather than scoring tends to define finals.",
      },
      {
        q: "Which 1992 FA Cup final saw Liverpool beat Sunderland?",
        a: "Liverpool beat Sunderland 2-0 in the 1992 FA Cup final, with Michael Thomas and Ian Rush scoring the goals.",
      },
    ],
    hard: [
      {
        q: "Which FA Cup final was decided by a goalkeeping howler in 2007?",
        a: "Didier Drogba scored an extra-time winner for Chelsea against Manchester United in the 2007 FA Cup final, the first at the new Wembley.",
      },
      {
        q: "Which manager became the first to win the FA Cup with three different clubs?",
        a: "Multiple managers have won the FA Cup with multiple clubs. Recent examples include Roberto Di Matteo (with Chelsea) and others.",
      },
      {
        q: "Which player has scored the most goals in FA Cup final history?",
        a: "Ian Rush scored five goals in FA Cup finals for Liverpool, a long-standing record in the modern era.",
      },
      {
        q: "Which FA Cup final featured a memorable Bobby Charlton volley?",
        a: "Bobby Charlton was central to many of Manchester United's FA Cup successes. The 1963 final saw Manchester United beat Leicester City 3-1.",
      },
    ],
    cta: {
      text: "Test your transfer knowledge of FA Cup-winning squads.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "facup-upsets",
    title: "Giant-killings & Upsets",
    description:
      "The 'Magic of the Cup' is most evident when lower-league sides defeat top-flight giants. From Sutton United to Bradford, the FA Cup has produced unforgettable shocks over its 150-year history.",
    easy: [
      {
        q: "Which non-league side famously beat Coventry City in the 1989 FA Cup?",
        a: "Sutton United, then a non-league side, beat top-flight Coventry City 2-1 in the FA Cup third round in January 1989.",
      },
      {
        q: "Which lower-league side reached the FA Cup final in 1992?",
        a: "Sunderland, then a Second Division side, reached the 1992 FA Cup final but lost 2-0 to Liverpool.",
      },
      {
        q: "Which non-league side reached the FA Cup fifth round in 2017?",
        a: "Lincoln City became the first non-league side to reach the FA Cup quarter-finals in over 100 years in 2016-17.",
      },
      {
        q: "Which Wigan Athletic side famously won the FA Cup in 2013?",
        a: "Wigan Athletic beat Manchester City 1-0 in the 2013 FA Cup final, with Ben Watson scoring the winner. They were relegated from the Premier League days later.",
      },
      {
        q: "What is the term for a lower-league side beating a top-flight team in a knockout cup?",
        a: "The term is 'giant-killing' - a hallmark of the FA Cup's enduring romance.",
      },
    ],
    medium: [
      {
        q: "Which Hereford United player scored a famous winner against Newcastle United in 1972?",
        a: "Ronnie Radford scored a famous long-range goal for non-league Hereford United against Newcastle United in February 1972 - one of football's most iconic moments.",
      },
      {
        q: "Which Bradford City side knocked Chelsea out of the FA Cup in 2015?",
        a: "Bradford City came back from 2-0 down at Stamford Bridge to beat Chelsea 4-2 in the FA Cup fourth round in January 2015.",
      },
      {
        q: "Which non-league side reached the FA Cup quarter-finals in the 1970s?",
        a: "Hereford United, after their famous Newcastle win, went on a memorable cup run in 1971-72.",
      },
      {
        q: "Which Wrexham side famously beat Arsenal in 1992?",
        a: "Wrexham, then in the Football League's Fourth Division, beat reigning league champions Arsenal 2-1 in the FA Cup third round in January 1992.",
      },
      {
        q: "Which lower-league side beat Manchester United at Old Trafford in the FA Cup?",
        a: "Multiple cup upsets have occurred at Old Trafford. Bournemouth beat Manchester United at Dean Court in 1984 in one notable example.",
      },
    ],
    hard: [
      {
        q: "Which non-league side made the FA Cup fifth round in the 1980s as one of the famous cup runs?",
        a: "Telford United, Yeovil Town and others have all had memorable runs to the FA Cup fifth round as non-league sides.",
      },
      {
        q: "Which Yeovil Town manager famously led the side to the FA Cup fifth round?",
        a: "Yeovil Town have made multiple FA Cup runs, including reaching the fourth round numerous times before joining the Football League.",
      },
      {
        q: "Which Sutton United player scored the famous winning goal against Coventry City in 1989?",
        a: "Matthew Hanlan scored Sutton United's famous winning goal in their 2-1 victory over Coventry City in January 1989.",
      },
      {
        q: "Which lower-league club reached the FA Cup semi-final in 2008?",
        a: "Barnsley reached the FA Cup semi-final in 2007-08, beating Liverpool and Chelsea on the way before losing to Cardiff City.",
      },
    ],
    cta: {
      text: "Connect FA Cup giant-killers with their famous wins.",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
  {
    id: "facup-modern",
    title: "Modern FA Cup Winners",
    description:
      "The modern FA Cup has been dominated by Arsenal, Chelsea, Manchester United and Manchester City. Test your knowledge of recent winners and the players who lifted the famous trophy.",
    easy: [
      {
        q: "Which club won the FA Cup in 2020 by beating Chelsea at an empty Wembley?",
        a: "Arsenal beat Chelsea 2-1 in the 2020 FA Cup final, played without fans due to COVID-19, with Pierre-Emerick Aubameyang scoring twice.",
      },
      {
        q: "Which manager won his first FA Cup with Arsenal in 2014?",
        a: "Arsene Wenger won his first FA Cup since 2005 in the 2014 final, with Arsenal beating Hull City 3-2 after extra time.",
      },
      {
        q: "Which Chelsea manager won three FA Cups between 2009 and 2012?",
        a: "Carlo Ancelotti (2010), Roberto Di Matteo (2012) and others contributed to Chelsea's FA Cup successes during this era.",
      },
      {
        q: "Which Manchester City manager won the FA Cup in 2019 by completing a domestic treble?",
        a: "Pep Guardiola won the FA Cup in 2019 as part of Manchester City's domestic treble, beating Watford 6-0 in the final.",
      },
      {
        q: "Which Welsh midfielder scored a stunning goal for Liverpool in the 2022 FA Cup final?",
        a: "Liverpool beat Chelsea on penalties in the 2022 FA Cup final at Wembley.",
      },
    ],
    medium: [
      {
        q: "Which Hull City manager led the club to its first ever FA Cup final in 2014?",
        a: "Steve Bruce managed Hull City to their first ever FA Cup final in 2014, losing 3-2 to Arsenal after extra time.",
      },
      {
        q: "Which Crystal Palace manager led the club to the FA Cup final in 2016?",
        a: "Alan Pardew led Crystal Palace to the 2016 FA Cup final, where they lost to Manchester United 2-1 after extra time.",
      },
      {
        q: "Which Watford manager led the club to the FA Cup final in 2019?",
        a: "Javi Gracia managed Watford to the 2019 FA Cup final, where they were beaten 6-0 by Manchester City.",
      },
      {
        q: "Which club did Roberto Di Matteo win the FA Cup with in 2012?",
        a: "Roberto Di Matteo won the FA Cup with Chelsea in 2012, beating Liverpool 2-1 in the final, just weeks before also winning the Champions League.",
      },
      {
        q: "Which Manchester United player scored against Arsenal in the 2003-04 FA Cup semi-final?",
        a: "Manchester United and Arsenal have met multiple times in the FA Cup semi-finals. Several memorable encounters define the rivalry's cup history.",
      },
    ],
    hard: [
      {
        q: "Which club holds the record for most FA Cup final appearances in the 21st century without winning the trophy?",
        a: "Several clubs have multiple final appearances without victory. Watford and Hull City both lost their first FA Cup final appearances at Wembley.",
      },
      {
        q: "Which player won the FA Cup with three different clubs in the 2010s?",
        a: "Multiple players have won the FA Cup with multiple clubs. Specific 21st-century examples include senior squad members at Chelsea, Arsenal and Manchester City.",
      },
      {
        q: "Which youngest goalscorer scored in an FA Cup final in the 2010s?",
        a: "FA Cup finals have featured several young scorers. The youngest scorers are often noted in match-by-match reports for individual finals.",
      },
      {
        q: "Which manager became the first to win the FA Cup as both player and manager with the same club in the 21st century?",
        a: "Multiple managers have won the FA Cup with the same club they played for, including former Chelsea figures and other club legends.",
      },
    ],
    cta: {
      text: "Test how the FA Cup unfolded over time with Timeline.",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
];

function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "When was the FA Cup first contested?",
      acceptedAnswer:
        "The FA Cup was first contested in the 1871-72 season, making it the oldest national football competition in the world.",
    },
    {
      name: "Which club has won the FA Cup the most times?",
      acceptedAnswer:
        "Arsenal hold the record for the most FA Cup wins, with 14 trophies.",
    },
    {
      name: "Which manager has won the FA Cup the most times?",
      acceptedAnswer:
        "Arsene Wenger won the FA Cup seven times as Arsenal manager, making him the most successful manager in the competition's history.",
    },
    {
      name: "Which club won the FA Cup as a non-English team?",
      acceptedAnswer:
        "Cardiff City won the FA Cup in 1927, the only time a club from outside England has lifted the trophy.",
    },
    {
      name: "What is meant by 'the magic of the cup'?",
      acceptedAnswer:
        "The phrase refers to the FA Cup's unpredictability, where lower-league teams can defeat top-flight giants in a single knockout match.",
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

export default function FaCupQuizPage() {
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
                  name: "FA Cup Trivia",
                  item: "https://www.football-iq.app/quiz/fa-cup",
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
                FA Cup
              </li>
            </ol>
          </nav>

          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            FA Cup Football Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ FA Cup trivia questions covering the world&apos;s
            oldest football competition - history, famous finals, giant-killings
            and modern winners. Questions are organised by difficulty - tap any
            question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From the 1872 final at Kennington Oval to modern
            Wembley triumphs.
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
