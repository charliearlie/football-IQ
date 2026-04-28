import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Bundesliga Football Trivia Questions & Answers (2026)",
  description:
    "Test your Bundesliga knowledge with 60+ trivia questions covering German football history, the Bayern Munich era, record holders, stadiums and the league's incredible fan culture.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/bundesliga",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "Bundesliga Trivia Questions & Answers (2026) | Football IQ",
    description:
      "60+ Bundesliga trivia questions on German football history, Bayern's dominance, record holders, stadiums and fans. Can you answer them all?",
    url: "https://www.football-iq.app/quiz/bundesliga",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bundesliga Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your Bundesliga knowledge with 60+ trivia questions. German football history, Bayern Munich and stadium culture.",
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
    id: "bundesliga-history",
    title: "Bundesliga History",
    description:
      "The Bundesliga is Germany's top football league, founded in 1963 to replace the regional Oberliga system. Test your knowledge of the league's origins, founding clubs and how it grew into one of Europe's premier competitions.",
    easy: [
      {
        q: "In which year was the Bundesliga founded?",
        a: "The Bundesliga was founded in 1963, with the inaugural season being 1963-64.",
      },
      {
        q: "How many clubs currently play in the Bundesliga?",
        a: "18 clubs play in the Bundesliga, each playing 34 matches per season.",
      },
      {
        q: "Which club won the inaugural Bundesliga title in 1963-64?",
        a: "1. FC Koln won the inaugural Bundesliga title in the 1963-64 season.",
      },
      {
        q: "What is the German term for the silver platter trophy awarded to Bundesliga champions?",
        a: "The trophy is called the 'Meisterschale', meaning 'Championship Plate' or 'Champions' Salad Bowl'.",
      },
      {
        q: "What is the '50+1' rule in German football?",
        a: "The '50+1' rule requires that club members hold a majority (50% plus one share) of the voting rights, preventing investors from taking full control of clubs.",
      },
      {
        q: "Which famous Munich-based club is the most successful in Bundesliga history?",
        a: "Bayern Munich is the most successful club in Bundesliga history, having won the title many more times than any other team.",
      },
    ],
    medium: [
      {
        q: "Which Hamburg-based club is one of only three founding members never to be relegated from the Bundesliga at one point?",
        a: "Hamburger SV held a famous record of being ever-present in the Bundesliga from its foundation until they were relegated in 2018.",
      },
      {
        q: "Which Borussia Dortmund manager won back-to-back Bundesliga titles in 2010-11 and 2011-12?",
        a: "Jurgen Klopp managed Borussia Dortmund to consecutive Bundesliga titles in 2010-11 and 2011-12, also reaching the 2013 Champions League final.",
      },
      {
        q: "Which manager led Bayern Munich to the famous treble in the 2012-13 season?",
        a: "Jupp Heynckes led Bayern Munich to the treble in 2012-13: Bundesliga, DFB-Pokal and Champions League.",
      },
      {
        q: "Which East German club has won the Bundesliga since reunification?",
        a: "No former East German club has won the Bundesliga since German reunification in 1990. RB Leipzig, an Eastern-based club but not historically rooted in East Germany, has come close.",
      },
      {
        q: "Which two clubs play in the famous 'Klassiker' rivalry?",
        a: "Der Klassiker is the rivalry between Bayern Munich and Borussia Dortmund, the two most successful clubs of the modern era.",
      },
      {
        q: "Why was the Bundesliga formed in 1963?",
        a: "To create a single national professional league. Before 1963, German football was organised in regional leagues with a national playoff to determine the champion.",
      },
    ],
    hard: [
      {
        q: "Which club, founded as a workers' team in 1900, plays in iconic black and yellow and is based in the Ruhr area?",
        a: "Borussia Dortmund, founded in 1909 (not 1900), play in their famous black and yellow at the Westfalenstadion (Signal Iduna Park).",
      },
      {
        q: "Which Bundesliga club was famously involved in the 1971 match-fixing scandal that nearly destroyed the league?",
        a: "Several clubs were implicated in the 1971 Bundesliga scandal, including Arminia Bielefeld and others, leading to bans, fines and forced relegations.",
      },
      {
        q: "Which club from the small town of Sinsheim joined the Bundesliga and reached European competition in the 2010s?",
        a: "TSG 1899 Hoffenheim, backed by SAP founder Dietmar Hopp, rose from amateur leagues to the Bundesliga and competed in European football.",
      },
      {
        q: "Which Bundesliga club won the title in 2009 with a famous 'Klinsmann-style' attacking philosophy?",
        a: "VfL Wolfsburg won the Bundesliga in 2008-09 under Felix Magath, with Edin Dzeko and Grafite forming a prolific strike partnership.",
      },
    ],
    cta: {
      text: "Trace players through German football's most storied clubs.",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "bundesliga-bayern",
    title: "Bayern Munich Era",
    description:
      "Bayern Munich's dominance of the Bundesliga is unmatched in European football. Test your knowledge of the club's history, players and the era of relentless title winning.",
    easy: [
      {
        q: "In which year was Bayern Munich founded?",
        a: "Bayern Munich was founded in 1900 in Bavaria, Germany.",
      },
      {
        q: "What is the name of Bayern Munich's home stadium since 2005?",
        a: "Bayern Munich play at the Allianz Arena, opened in 2005, in the north of Munich.",
      },
      {
        q: "How many consecutive Bundesliga titles did Bayern Munich win between 2012-13 and 2022-23?",
        a: "Bayern Munich won 11 consecutive Bundesliga titles from 2012-13 to 2022-23, an unprecedented run in European top-flight football.",
      },
      {
        q: "Which legendary German defender captained Bayern Munich and West Germany to the 1974 World Cup?",
        a: "Franz Beckenbauer, 'Der Kaiser', captained both Bayern Munich and West Germany, winning the 1974 World Cup.",
      },
      {
        q: "Which Bayern Munich striker was Germany's all-time top international scorer for many years?",
        a: "Gerd Muller scored 365 Bundesliga goals for Bayern and 68 in 62 international matches for West Germany, holding records for decades.",
      },
      {
        q: "Which Polish striker became Bayern Munich's record signing from Borussia Dortmund in 2014?",
        a: "Robert Lewandowski moved from Borussia Dortmund to Bayern Munich on a free transfer in 2014, becoming one of the most prolific strikers in club history.",
      },
    ],
    medium: [
      {
        q: "Which Bayern Munich striker scored five goals in nine minutes against Wolfsburg in 2015?",
        a: "Robert Lewandowski scored five goals in nine minutes against Wolfsburg on 22 September 2015 - a Bundesliga record.",
      },
      {
        q: "Which Bayern manager won the Champions League in 2020 as part of an undefeated European run?",
        a: "Hansi Flick led Bayern Munich to the 2020 Champions League title, going unbeaten throughout the tournament including a 8-2 win over Barcelona.",
      },
      {
        q: "Which Bayern Munich captain made over 700 Bundesliga appearances?",
        a: "Sepp Maier, Bayern's legendary goalkeeper, made over 700 appearances for the club between 1962 and 1979.",
      },
      {
        q: "Who scored Bayern's winner in the 2013 Champions League final at Wembley?",
        a: "Arjen Robben scored an 89th-minute winner as Bayern Munich beat Borussia Dortmund 2-1 in the 2013 Champions League final at Wembley.",
      },
      {
        q: "Which Dutch winger was famous for cutting in from the right and shooting with his left foot for Bayern?",
        a: "Arjen Robben, who joined Bayern from Real Madrid in 2009, was famous for his trademark cut-inside-and-shoot move.",
      },
      {
        q: "Which iconic French midfielder joined Bayern Munich in 2007 and became a club legend?",
        a: "Franck Ribery joined Bayern Munich in 2007 from Marseille and formed the famous 'Robbery' partnership with Arjen Robben.",
      },
    ],
    hard: [
      {
        q: "Which Bayern Munich manager won three consecutive European Cups from 1974 to 1976?",
        a: "Udo Lattek and Dettmar Cramer were the managers during Bayern's three consecutive European Cup wins from 1974 to 1976.",
      },
      {
        q: "Who was Bayern Munich's first foreign Bundesliga top scorer?",
        a: "Foreign Bundesliga top scorers at Bayern have included Brazilian Giovane Elber and others. Roy Makaay and Luca Toni also led the scoring charts in their seasons.",
      },
      {
        q: "Which player was the first to win the Bundesliga top scorer award seven times?",
        a: "Robert Lewandowski won the Bundesliga top scorer (Torjagerkanone) seven times, all but one with Bayern Munich.",
      },
      {
        q: "Which Bayern Munich goalkeeper revolutionised the sweeper-keeper role?",
        a: "Manuel Neuer, joining from Schalke 04 in 2011, redefined the goalkeeper role with his sweeper-keeper style and ball-playing ability.",
      },
    ],
    cta: {
      text: "Test your transfer knowledge across Bayern's eras.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "bundesliga-records",
    title: "Bundesliga Record Holders",
    description:
      "From Gerd Muller's goal records to Manuel Neuer's clean sheets, the Bundesliga has produced extraordinary individual achievements. Test your knowledge of German football's record book.",
    easy: [
      {
        q: "Who is the Bundesliga's all-time top scorer?",
        a: "Gerd Muller scored 365 Bundesliga goals for Bayern Munich between 1965 and 1979 - a record that stood for decades.",
      },
      {
        q: "Which Polish striker broke Gerd Muller's single-season record in 2020-21?",
        a: "Robert Lewandowski scored 41 Bundesliga goals in the 2020-21 season, breaking Gerd Muller's 49-year-old single-season record of 40.",
      },
      {
        q: "Which player has made the most Bundesliga appearances of all time?",
        a: "Karl-Heinz Korbel, who spent his entire career at Eintracht Frankfurt, made 602 Bundesliga appearances - the most in history.",
      },
      {
        q: "Who has won the most Bundesliga titles as a manager?",
        a: "Bayern Munich managers including Udo Lattek and Ottmar Hitzfeld are among the most successful, with multiple title-winning campaigns.",
      },
      {
        q: "Which Bundesliga club has the highest average attendance in European football?",
        a: "Borussia Dortmund consistently leads European football for average attendance, with the Westfalenstadion (Signal Iduna Park) holding nearly 82,000 supporters.",
      },
    ],
    medium: [
      {
        q: "Which player won the Bundesliga top scorer award the most times?",
        a: "Robert Lewandowski won the Bundesliga top scorer award seven times - the most in league history.",
      },
      {
        q: "Which Bayern Munich goalkeeper holds the record for most Bundesliga clean sheets in a single season?",
        a: "Multiple Bayern goalkeepers have set clean sheet records. Manuel Neuer's defensive records during Bayern's dominant years are well documented.",
      },
      {
        q: "Who scored the fastest hat-trick in Bundesliga history?",
        a: "Robert Lewandowski's five goals in nine minutes against Wolfsburg in 2015 included the fastest hat-trick in Bundesliga history.",
      },
      {
        q: "Which striker scored 40 Bundesliga goals in the 1971-72 season?",
        a: "Gerd Muller scored 40 Bundesliga goals in the 1971-72 season - a record that stood for 49 years until Lewandowski broke it in 2020-21.",
      },
      {
        q: "Which Bundesliga manager won three Champions League titles?",
        a: "Ottmar Hitzfeld won the Champions League with both Borussia Dortmund (1997) and Bayern Munich (2001), establishing himself as one of Germany's greatest coaches.",
      },
      {
        q: "Which club holds the record for the biggest Bundesliga win?",
        a: "Borussia Monchengladbach beat Borussia Dortmund 12-0 in April 1978 - a Bundesliga record scoreline.",
      },
    ],
    hard: [
      {
        q: "Which striker famously won the Bundesliga top scorer award while at a club other than Bayern Munich in the 2000s?",
        a: "Theofanis Gekas (Bochum, 2007), Edin Dzeko (Wolfsburg, 2009) and others have won the Bundesliga top scorer award outside Bayern in the modern era.",
      },
      {
        q: "Which goalkeeper kept clean sheets in 21 Bundesliga matches in a single season?",
        a: "Bayern Munich goalkeepers, particularly during their dominant years under Pep Guardiola and others, have set numerous clean sheet records.",
      },
      {
        q: "Which player won the German Footballer of the Year award the most consecutive times?",
        a: "Robert Lewandowski and Manuel Neuer have both won the German Footballer of the Year award multiple times in the modern era.",
      },
      {
        q: "Which Bundesliga club holds the longest unbeaten run in league history?",
        a: "Bayern Munich went 53 matches unbeaten in the Bundesliga between 2012 and 2014, a league record.",
      },
    ],
    cta: {
      text: "Place German football's biggest moments in chronological order.",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
  {
    id: "bundesliga-stadiums",
    title: "Stadiums & Fan Culture",
    description:
      "The Bundesliga is famous for its incredible fan culture, atmospheric stadiums and supporter-friendly policies. Test your knowledge of Germany's iconic venues and the fans that fill them.",
    easy: [
      {
        q: "Which famous 'Yellow Wall' is found in a Bundesliga stadium?",
        a: "The Sudtribune (South Stand) at Borussia Dortmund's Signal Iduna Park is known as the 'Yellow Wall', holding around 25,000 standing fans.",
      },
      {
        q: "Which Bayern Munich stadium hosted the 2006 World Cup opening match?",
        a: "The Allianz Arena hosted the 2006 World Cup opening match between Germany and Costa Rica.",
      },
      {
        q: "Which Hamburg-based club shares the Volksparkstadion?",
        a: "Hamburger SV (HSV) play at the Volksparkstadion, a stadium that has been redeveloped multiple times.",
      },
      {
        q: "Which famous Bundesliga stadium is known for its red brick exterior and is in Stuttgart?",
        a: "VfB Stuttgart play at the MHPArena (formerly Mercedes-Benz Arena), one of the most modern stadiums in the Bundesliga.",
      },
      {
        q: "What is unique about Bundesliga stadium ticketing compared to other major European leagues?",
        a: "Bundesliga clubs offer some of the cheapest ticket prices in major European football, with substantial standing terraces still permitted in domestic matches.",
      },
    ],
    medium: [
      {
        q: "What is the total capacity of Borussia Dortmund's Signal Iduna Park?",
        a: "Signal Iduna Park (formerly Westfalenstadion) holds 81,365 spectators in domestic matches, making it Germany's largest stadium.",
      },
      {
        q: "Which Bundesliga stadium is famous for its facade that lights up in club colours?",
        a: "The Allianz Arena, home of Bayern Munich, is famous for its inflatable ETFE panels that can light up in red (Bayern), blue (formerly 1860 Munich) or white.",
      },
      {
        q: "Which traditional German club, known as 'Die Knappen', plays at the Veltins-Arena?",
        a: "Schalke 04, nicknamed 'Die Knappen' (The Miners), play at the Veltins-Arena (formerly Arena AufSchalke) in Gelsenkirchen.",
      },
      {
        q: "Which fan group culture is associated with Bundesliga matches but uncommon in the Premier League?",
        a: "Ultra culture is strong in the Bundesliga, with elaborate choreographies, banners and flares that are central to matchday atmosphere.",
      },
      {
        q: "Why are German fans known for opposing kickoff times that prevent travel to away matches?",
        a: "German fan culture emphasises traditional weekend football and accessibility, leading to organised protests against Monday night matches and kickoff times that disadvantage traveling supporters.",
      },
    ],
    hard: [
      {
        q: "Which Bundesliga club's stadium was originally built for the 1974 World Cup?",
        a: "The Olympiastadion in Munich and the Westfalenstadion in Dortmund were both built or expanded for the 1974 World Cup. Bayern Munich played at the Olympiastadion until 2005.",
      },
      {
        q: "What is the name of the famous Hamburg-based club whose fans famously protested gentrification?",
        a: "FC St. Pauli, based in Hamburg's red-light district, have a famously left-wing fan culture and play at the Millerntor-Stadion.",
      },
      {
        q: "Which club has the smallest stadium currently in the Bundesliga?",
        a: "Stadium capacities vary by season. SC Paderborn, Greuther Furth and other promoted clubs have historically had some of the smallest grounds.",
      },
      {
        q: "Which Bundesliga stadium is built into a mountain valley and is famous for its setting?",
        a: "Several German stadiums have unique settings. SC Freiburg's Europa-Park Stadion (opened 2021) is famous for its modern design near the Black Forest.",
      },
    ],
    cta: {
      text: "Test how well you know German football's connections.",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
];

function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "Which club has won the most Bundesliga titles?",
      acceptedAnswer:
        "Bayern Munich are the most successful club in Bundesliga history, having won the title many more times than any other team, including 11 in a row from 2012-13 to 2022-23.",
    },
    {
      name: "Who is the Bundesliga's all-time top scorer?",
      acceptedAnswer:
        "Gerd Muller scored 365 Bundesliga goals for Bayern Munich between 1965 and 1979, a long-standing record.",
    },
    {
      name: "When was the Bundesliga founded?",
      acceptedAnswer:
        "The Bundesliga was founded in 1963, with the inaugural season being 1963-64. It replaced the regional Oberliga system.",
    },
    {
      name: "What is the 50+1 rule?",
      acceptedAnswer:
        "The 50+1 rule requires that club members hold a majority of the voting rights, preventing investors from taking full control of Bundesliga clubs.",
    },
    {
      name: "What is the 'Yellow Wall'?",
      acceptedAnswer:
        "The 'Yellow Wall' is the South Stand (Sudtribune) of Borussia Dortmund's Signal Iduna Park, the largest standing terrace in European football, holding around 25,000 supporters.",
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

export default function BundesligaQuizPage() {
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
                  name: "Bundesliga Trivia",
                  item: "https://www.football-iq.app/quiz/bundesliga",
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
                Bundesliga
              </li>
            </ol>
          </nav>

          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            Bundesliga Football Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ Bundesliga trivia questions covering German
            football history, the Bayern Munich era, record holders and stadium
            culture. Questions are organised by difficulty - tap any question to
            reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From the league&apos;s 1963 founding to Bayern&apos;s 11
            consecutive titles.
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
