import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Serie A Football Trivia Questions & Answers (2026)",
  description:
    "Test your Serie A knowledge with 60+ trivia questions covering Italian football history, calcio tactics, record holders and iconic matches from Juventus, Milan, Inter and beyond.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/serie-a",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Serie A Trivia Questions & Answers (2026) | Football IQ",
    description:
      "60+ Serie A trivia questions on Italian football history, tactics, record holders and iconic matches. Can you answer them all?",
    url: "https://www.football-iq.app/quiz/serie-a",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Serie A Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your Serie A knowledge with 60+ trivia questions. Italian football history, tactics and records.",
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
    id: "seriea-history",
    title: "Serie A History",
    description:
      "Serie A is the top flight of Italian football, founded in its modern round-robin format in 1929. Test your knowledge of its origins, the founding clubs, and the history that has produced some of football's greatest sides.",
    easy: [
      {
        q: "In which year did Serie A adopt its modern round-robin format?",
        a: "Serie A began as a single national round-robin league in the 1929-30 season, replacing earlier regional formats.",
      },
      {
        q: "Which Italian club is nicknamed 'La Vecchia Signora' or 'The Old Lady'?",
        a: "Juventus, founded in 1897 in Turin, is known as 'La Vecchia Signora'.",
      },
      {
        q: "What is the name of the Serie A trophy?",
        a: "The trophy is called the Coppa Campioni d'Italia, with winners also receiving the right to wear the Scudetto on their shirts.",
      },
      {
        q: "Which symbol do Serie A champions wear on their shirt the following season?",
        a: "Serie A champions wear the Scudetto, a small shield in the colours of the Italian flag.",
      },
      {
        q: "Which Milanese rival club was founded in 1908 by a breakaway group from AC Milan?",
        a: "Internazionale (Inter Milan) was founded in 1908 by a group who broke away from Milan Cricket and Football Club, wanting to allow foreign players.",
      },
      {
        q: "How many teams currently compete in Serie A?",
        a: "20 teams currently compete in Serie A, each playing 38 matches per season.",
      },
    ],
    medium: [
      {
        q: "Which club won a record nine consecutive Serie A titles between 2011-12 and 2019-20?",
        a: "Juventus won nine consecutive Scudetti from 2011-12 to 2019-20, an unprecedented run in Italian football.",
      },
      {
        q: "Why was Juventus stripped of their 2004-05 and 2005-06 Serie A titles?",
        a: "Juventus were stripped of those titles and relegated to Serie B as part of the Calciopoli match-fixing scandal in 2006.",
      },
      {
        q: "Which club is famous for the AC Milan 'Invincibles' side that went unbeaten in Serie A 1991-92?",
        a: "AC Milan went the entire 1991-92 Serie A season unbeaten under Fabio Capello, winning the Scudetto.",
      },
      {
        q: "What is the Derby della Madonnina?",
        a: "It is the derby between AC Milan and Inter Milan, named after the statue of the Virgin Mary atop Milan Cathedral.",
      },
      {
        q: "What is the Derby d'Italia?",
        a: "The Derby d'Italia is the rivalry between Juventus and Inter Milan, named because they were two of Italy's most decorated and ever-present sides.",
      },
      {
        q: "Which club had to be re-formed under the name Fiorentina Viola after going bankrupt in 2002?",
        a: "Fiorentina collapsed financially in 2002 and were re-formed in the lower divisions as Florentia Viola, eventually returning to Serie A as Fiorentina.",
      },
    ],
    hard: [
      {
        q: "Who scored 30 goals in 30 games for Torino's 'Grande Torino' side that dominated Serie A in the 1940s?",
        a: "Valentino Mazzola was the captain and talisman of Grande Torino, the legendary side that perished in the Superga air disaster of 1949.",
      },
      {
        q: "What was the Superga air disaster?",
        a: "On 4 May 1949, the plane carrying the Grande Torino squad crashed into the Superga hill near Turin, killing the entire team. They had won five consecutive Scudetti at the time.",
      },
      {
        q: "Which Hungarian-born manager famously led Inter Milan to back-to-back European Cup wins in the 1960s?",
        a: "Helenio Herrera, an Argentine of Spanish descent (not Hungarian), managed Inter Milan to consecutive European Cup titles in 1964 and 1965 with his Grande Inter side.",
      },
      {
        q: "Which club was relegated from Serie A despite winning the league multiple times in the 1990s?",
        a: "Sampdoria, the 1990-91 Serie A champions under Vujadin Boskov with players like Mancini and Vialli, have been relegated from Serie A multiple times.",
      },
    ],
    cta: {
      text: "Trace players through Italian football's most storied clubs.",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "seriea-tactics",
    title: "Calcio Tactics",
    description:
      "Italian football is famous for its tactical sophistication. From catenaccio to zona mista, Serie A has produced more influential tactical thinkers than perhaps any other league.",
    easy: [
      {
        q: "What is 'catenaccio'?",
        a: "Catenaccio, meaning 'door-bolt', is a defensive tactical system that became synonymous with Italian football, emphasising organisation, marking and the libero (sweeper).",
      },
      {
        q: "Which Italian manager is associated with the development of catenaccio at Inter Milan in the 1960s?",
        a: "Helenio Herrera popularised the catenaccio system at Inter Milan during the 1960s.",
      },
      {
        q: "What is a 'libero' in Italian football?",
        a: "The libero, or sweeper, is a defender who plays behind the defensive line, free from man-marking duties to read the game and clean up.",
      },
      {
        q: "Which legendary Italian defender was famously a libero for AC Milan and Italy?",
        a: "Franco Baresi played as libero for AC Milan throughout the 1980s and 1990s, captaining the club and Italy with distinction.",
      },
      {
        q: "Which manager revolutionised AC Milan with high-pressing football in the late 1980s?",
        a: "Arrigo Sacchi managed AC Milan to back-to-back European Cup titles in 1989 and 1990 with a pressing, zonal-marking system.",
      },
    ],
    medium: [
      {
        q: "Which manager won three Champions League titles with three different clubs and is known for tactical pragmatism?",
        a: "Carlo Ancelotti won the Champions League with AC Milan, Real Madrid and others, becoming one of the most decorated managers in European football.",
      },
      {
        q: "Which manager is famous for his 'Sarri-ball' philosophy at Napoli?",
        a: "Maurizio Sarri's Napoli side of 2017-18 played fluid, high-tempo possession football and finished as runners-up to Juventus.",
      },
      {
        q: "Which legendary Italian manager led the national team to the 1982 World Cup?",
        a: "Enzo Bearzot managed Italy to the 1982 World Cup title in Spain, with Paolo Rossi as the tournament's top scorer.",
      },
      {
        q: "Which Italian manager famously led Juventus to consecutive Champions League finals in 2015 and 2017?",
        a: "Massimiliano Allegri led Juventus to the Champions League finals of 2015 and 2017, losing both to Barcelona and Real Madrid respectively.",
      },
      {
        q: "Which manager is credited with bringing 'zona mista' (mixed zone) tactics to prominence in Italy?",
        a: "Giovanni Trapattoni used zona mista, a hybrid of zonal and man-marking, to great effect in his decorated Juventus career.",
      },
      {
        q: "Which Italian coach is famous for his work at Sassuolo and later Inter Milan, winning Serie A in 2020-21?",
        a: "Antonio Conte managed Inter Milan to the 2020-21 Serie A title, ending Juventus's nine-season run.",
      },
    ],
    hard: [
      {
        q: "Which tactic, used by Italian clubs in the 1990s, involved a three-man defence with two wing-backs in midfield?",
        a: "The 3-5-2 formation, popularised by Italian managers like Trapattoni and adopted across European football, used a three-man defence with attacking wing-backs.",
      },
      {
        q: "Which manager won Serie A with five different clubs?",
        a: "Fabio Capello won Serie A with AC Milan, Roma and others, while also winning La Liga at Real Madrid - one of the most successful Italian coaches.",
      },
      {
        q: "Which 1980s manager pioneered the 4-4-2 'flat-back-four' system in Italy at AC Milan?",
        a: "Arrigo Sacchi pioneered the 4-4-2 with a flat-back-four and zonal marking, breaking with Italy's traditional libero system.",
      },
      {
        q: "Which Italian manager is famous for using a 4-2-3-1 formation and won Serie A with Inter Milan in 2009-10?",
        a: "Jose Mourinho managed Inter Milan to the 2009-10 treble (Serie A, Coppa Italia, Champions League) with a tactically disciplined side, though he is Portuguese.",
      },
    ],
    cta: {
      text: "Connect Serie A players through their tactical journeys.",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
  {
    id: "seriea-records",
    title: "Serie A Record Holders",
    description:
      "Italian football has produced extraordinary individuals - from Paolo Maldini's career-long loyalty to Buffon's longevity, Serie A record books read like a hall of fame.",
    easy: [
      {
        q: "Who is the all-time Serie A top scorer?",
        a: "Silvio Piola is the all-time Serie A top scorer with 274 goals, scored across multiple clubs between 1929 and 1954.",
      },
      {
        q: "Which goalkeeper holds the record for most Serie A appearances?",
        a: "Gianluigi Buffon holds the record for most Serie A appearances by a goalkeeper, with over 650 matches.",
      },
      {
        q: "Which Italian defender played his entire career at AC Milan from 1985 to 2009?",
        a: "Paolo Maldini played his entire 25-year senior career at AC Milan, winning seven Serie A titles and five European Cups.",
      },
      {
        q: "Who scored 36 goals for Juventus in the 1933-34 Serie A season?",
        a: "Felice Borel scored 31 goals in 33 games during 1933-34. The all-time single-season record holders include Gunnar Nordahl and others.",
      },
      {
        q: "Which Swedish striker scored a record number of goals for AC Milan in the 1940s and 50s?",
        a: "Gunnar Nordahl scored 210 Serie A goals for AC Milan in just eight seasons - one of the most prolific scoring rates in league history.",
      },
    ],
    medium: [
      {
        q: "Which Argentine forward holds the modern-era record for goals scored in a Serie A season?",
        a: "Gonzalo Higuain scored 36 Serie A goals for Napoli in the 2015-16 season, breaking the long-standing record held by Gunnar Nordahl.",
      },
      {
        q: "Which legendary Inter Milan striker is the club's all-time top scorer?",
        a: "Giuseppe Meazza is Inter Milan's all-time top scorer. The San Siro stadium is officially named after him.",
      },
      {
        q: "Who was the first goalkeeper to win the Ballon d'Or while playing in Serie A?",
        a: "Lev Yashin won the Ballon d'Or as a goalkeeper but did not play in Serie A. Dino Zoff is the legendary Italian goalkeeper who won the World Cup at age 40.",
      },
      {
        q: "Which Italian midfielder was nicknamed 'Il Principino' and played for Juventus and AS Roma?",
        a: "Andrea Pirlo, nicknamed 'Il Maestro', played for AC Milan, Juventus and the Italian national team and is one of the great deep-lying playmakers.",
      },
      {
        q: "Which Brazilian midfielder won three consecutive Ballon d'Or trophies while playing in Serie A?",
        a: "Brazilian forward Ronaldo won the Ballon d'Or twice (1997 at Inter, and 2002 at Real Madrid). No player has won three consecutive while playing Serie A.",
      },
      {
        q: "Which Italian striker famously won the World Cup Golden Boot in 1982?",
        a: "Paolo Rossi won the Golden Boot at the 1982 World Cup with six goals, leading Italy to the title.",
      },
    ],
    hard: [
      {
        q: "Which striker holds the record for most goals scored in the Milan derby?",
        a: "Andriy Shevchenko and Giuseppe Meazza are among the leading scorers in the Derby della Madonnina, with multiple goals across their careers.",
      },
      {
        q: "Which Argentine forward was the first foreign winner of the Capocannoniere (Serie A top scorer)?",
        a: "Multiple foreign winners exist. Diego Maradona never won it outright. Renato Cesarini was an early Argentine star at Juventus in the 1930s.",
      },
      {
        q: "Which goalkeeper has the most clean sheets in Serie A history?",
        a: "Gianluigi Buffon, with his exceptional career at Parma and Juventus, leads the all-time clean sheets list in Serie A.",
      },
      {
        q: "Which player has been involved in the most Scudetto-winning squads?",
        a: "Gianluigi Buffon won 10 Serie A titles with Juventus, the most of any player in the modern era.",
      },
    ],
    cta: {
      text: "Test your knowledge of Italy's biggest transfers.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "seriea-iconic",
    title: "Iconic Matches",
    description:
      "From titanic European nights at the San Siro to dramatic Scudetto deciders, Serie A has produced some of the most memorable matches in football history.",
    easy: [
      {
        q: "Which AC Milan side beat Barcelona 4-0 in the 1994 Champions League final?",
        a: "Fabio Capello's AC Milan beat Johan Cruyff's Barcelona 4-0 in Athens on 18 May 1994, with goals from Massaro (2), Savicevic and Desailly.",
      },
      {
        q: "Which Italian club won the Champions League in 2010 to complete a famous treble?",
        a: "Inter Milan, managed by Jose Mourinho, won the Champions League in 2010, beating Bayern Munich 2-0 in the final.",
      },
      {
        q: "Which Serie A side won the European Cup in 1996 by beating Ajax on penalties?",
        a: "Juventus beat Ajax on penalties in the 1996 Champions League final in Rome, with Marcello Lippi as head coach.",
      },
      {
        q: "Which Brazilian forward famously scored 'a match for the ages' for Inter against Lazio in 1998?",
        a: "Ronaldo's solo goal and overall display for Inter Milan in the late 1990s, particularly in the 1998 UEFA Cup final against Lazio, cemented his legendary status.",
      },
    ],
    medium: [
      {
        q: "What was the score of the 'Five Star Final' when AC Milan beat Steaua Bucharest in the 1989 European Cup final?",
        a: "AC Milan beat Steaua Bucharest 4-0 in the 1989 European Cup final in Barcelona. Gullit and Van Basten each scored twice.",
      },
      {
        q: "Which match in May 2003 saw two Italian clubs face each other in a Champions League final?",
        a: "AC Milan beat Juventus on penalties in the 2003 Champions League final at Old Trafford - the first all-Italian European Cup final.",
      },
      {
        q: "What happened in the 2005 Champions League final between AC Milan and Liverpool?",
        a: "AC Milan led 3-0 at half-time but Liverpool came back to draw 3-3 and win on penalties in Istanbul, in one of the most dramatic finals ever.",
      },
      {
        q: "Which Inter Milan player scored the famous winning goal in the 1965 European Cup final?",
        a: "Jair scored as Inter Milan beat Benfica 1-0 at the San Siro in the 1965 European Cup final under Helenio Herrera.",
      },
      {
        q: "What was the result of the famous 'Fatal Verona' match in 1990 that decided the Scudetto?",
        a: "AC Milan, going for back-to-back titles, lost 2-1 at Verona in May 1990, allowing Napoli (with Maradona) to win their second Scudetto.",
      },
    ],
    hard: [
      {
        q: "Which Italian striker famously turned in a hat-trick for Italy against Brazil in the 1982 World Cup?",
        a: "Paolo Rossi scored a hat-trick for Italy in their 3-2 win over Brazil at the 1982 World Cup - one of football's greatest individual performances.",
      },
      {
        q: "Which Diego Maradona moment defined the Napoli vs Bari match in 1989?",
        a: "Maradona's free kicks and assists for Napoli during their two Scudetto-winning campaigns (1986-87 and 1989-90) included many iconic Serie A moments.",
      },
      {
        q: "Which Roma forward led the club to their famous 2000-01 Scudetto?",
        a: "Francesco Totti, alongside Vincenzo Montella and Gabriel Batistuta, led Roma to the 2000-01 Serie A title under Fabio Capello.",
      },
      {
        q: "What was the score of the 2017 Champions League final between Juventus and Real Madrid?",
        a: "Real Madrid beat Juventus 4-1 in Cardiff, with Cristiano Ronaldo scoring twice. It was Juventus's second loss in three years to Spanish opposition.",
      },
    ],
    cta: {
      text: "Place legendary Serie A moments in chronological order.",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
];

function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "Which club has won Serie A the most times?",
      acceptedAnswer:
        "Juventus have won Serie A more times than any other club, including a record nine consecutive Scudetti from 2011-12 to 2019-20.",
    },
    {
      name: "What is catenaccio?",
      acceptedAnswer:
        "Catenaccio, meaning 'door-bolt', is a defensive tactical system associated with Italian football, emphasising organisation, man-marking and the libero (sweeper) role.",
    },
    {
      name: "Who is Serie A's all-time top scorer?",
      acceptedAnswer:
        "Silvio Piola is the all-time Serie A top scorer with 274 goals, scored across multiple clubs between 1929 and 1954.",
    },
    {
      name: "What is the Derby della Madonnina?",
      acceptedAnswer:
        "The Derby della Madonnina is the rivalry between AC Milan and Inter Milan, named after the statue of the Virgin Mary atop Milan Cathedral.",
    },
    {
      name: "What was the Calciopoli scandal?",
      acceptedAnswer:
        "Calciopoli was a 2006 match-fixing scandal that resulted in Juventus being stripped of two Serie A titles and relegated to Serie B.",
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

export default function SerieAQuizPage() {
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
                  name: "Serie A Trivia",
                  item: "https://www.football-iq.app/quiz/serie-a",
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
                Serie A
              </li>
            </ol>
          </nav>

          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Serie A Football Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ Serie A trivia questions covering Italian football
            history, calcio tactics, record holders and iconic matches.
            Questions are organised by difficulty - tap any question to reveal
            the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From Grande Torino to Juventus&apos;s nine-Scudetto
            dynasty.
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
