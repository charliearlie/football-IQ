import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "International Football Trivia Questions & Answers (2026)",
  description:
    "Test your international football knowledge with 60+ trivia questions on the World Cup, European Championship, Copa America and the great record holders of national team football.",
  alternates: {
    canonical: "https://www.football-iq.app/quiz/international-football",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "International Football Trivia Questions & Answers (2026) | Football IQ",
    description:
      "60+ international football trivia questions covering the World Cup, Euros, Copa America and World Cup records. Can you answer them all?",
    url: "https://www.football-iq.app/quiz/international-football",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "International Football Trivia Questions & Answers (2026) | Football IQ",
    description:
      "Test your international football knowledge with 60+ trivia questions. World Cups, Euros and Copa America.",
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
    id: "intl-worldcup",
    title: "FIFA World Cup",
    description:
      "The FIFA World Cup is the most-watched sporting event on the planet. Held every four years since 1930, it has crowned legends, broken hearts and shaped the history of football itself.",
    easy: [
      {
        q: "In which year was the first FIFA World Cup held?",
        a: "The first FIFA World Cup was held in 1930 in Uruguay, with 13 teams competing.",
      },
      {
        q: "Which country won the inaugural World Cup in 1930?",
        a: "Uruguay won the inaugural 1930 World Cup, beating Argentina 4-2 in the final on home soil.",
      },
      {
        q: "Which country has won the most FIFA World Cup titles?",
        a: "Brazil have won the World Cup five times: 1958, 1962, 1970, 1994, and 2002.",
      },
      {
        q: "Which legendary Brazilian forward is the only player to have won three World Cups?",
        a: "Pele is the only player to have won three World Cups, doing so with Brazil in 1958, 1962, and 1970.",
      },
      {
        q: "How often is the FIFA World Cup held?",
        a: "The FIFA World Cup is held every four years.",
      },
      {
        q: "Which country hosted and won the 1998 World Cup?",
        a: "France hosted and won the 1998 World Cup, beating Brazil 3-0 in the final, with Zinedine Zidane scoring twice.",
      },
    ],
    medium: [
      {
        q: "Which European country won the 2014 World Cup?",
        a: "Germany won the 2014 World Cup in Brazil, beating Argentina 1-0 in the final thanks to a Mario Gotze extra-time goal.",
      },
      {
        q: "Which country famously beat Brazil 7-1 in the 2014 World Cup semi-final?",
        a: "Germany beat Brazil 7-1 in the semi-final of the 2014 World Cup, one of the most shocking results in football history.",
      },
      {
        q: "Which player scored a hat-trick in a World Cup final?",
        a: "Geoff Hurst scored a hat-trick for England in the 1966 World Cup final, the only player to score three goals in a final.",
      },
      {
        q: "Which Argentinian forward won the World Cup in 1986?",
        a: "Diego Maradona was instrumental in Argentina's 1986 World Cup win, scoring twice against England including the famous 'Hand of God' and 'Goal of the Century'.",
      },
      {
        q: "Which country was the first World Cup hosted in Africa?",
        a: "South Africa hosted the 2010 World Cup, the first World Cup held on the African continent. Spain won the tournament.",
      },
      {
        q: "Which country hosted the World Cup in 2018?",
        a: "Russia hosted the 2018 World Cup, with France winning their second title by beating Croatia 4-2 in the final.",
      },
    ],
    hard: [
      {
        q: "Which country won the 1934 and 1938 World Cups consecutively?",
        a: "Italy won consecutive World Cups in 1934 (on home soil) and 1938 (in France), under manager Vittorio Pozzo.",
      },
      {
        q: "What was the only World Cup hosted by two countries?",
        a: "The 2002 World Cup was jointly hosted by South Korea and Japan, the first held in Asia.",
      },
      {
        q: "Which player has scored the most World Cup finals goals?",
        a: "Multiple players have scored in two finals (Pele, Vava, Zidane, Mbappe). Geoff Hurst's hat-trick in 1966 remains the only one in a final.",
      },
      {
        q: "Which country won the 1950 World Cup?",
        a: "Uruguay won the 1950 World Cup in Brazil, famously defeating the hosts 2-1 in the deciding match (the 'Maracanazo').",
      },
    ],
    cta: {
      text: "Trace World Cup heroes through their international careers.",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "intl-euros",
    title: "European Championship",
    description:
      "The UEFA European Championship is held every four years and is one of the most prestigious tournaments in football. From Greece's shock 2004 win to Spain's tiki-taka era, the Euros have produced unforgettable moments.",
    easy: [
      {
        q: "In which year was the first European Championship held?",
        a: "The first European Championship (then called the European Nations' Cup) was held in 1960 in France.",
      },
      {
        q: "Which country won the inaugural European Championship in 1960?",
        a: "The Soviet Union won the inaugural European Championship in 1960, beating Yugoslavia 2-1 in the final.",
      },
      {
        q: "Which country won three consecutive Euro tournaments and a World Cup between 2008 and 2012?",
        a: "Spain won Euro 2008, the 2010 World Cup, and Euro 2012 - the only team to win three consecutive major international tournaments.",
      },
      {
        q: "Which country shocked the football world by winning Euro 2004?",
        a: "Greece shocked Europe by winning Euro 2004, beating hosts Portugal in the final under German coach Otto Rehhagel.",
      },
      {
        q: "Which country won the first European Championship to be hosted across Europe (Euro 2020)?",
        a: "Italy won Euro 2020 (held in 2021 due to COVID-19), beating England on penalties at Wembley in the final.",
      },
      {
        q: "Which country won Euro 2016 hosted by France?",
        a: "Portugal won Euro 2016, beating France 1-0 in the final at the Stade de France with an Eder extra-time goal.",
      },
    ],
    medium: [
      {
        q: "Which Danish player famously had a cardiac arrest during a Euro 2020 match?",
        a: "Christian Eriksen suffered a cardiac arrest during Denmark's opening Euro 2020 match against Finland but later returned to professional football.",
      },
      {
        q: "Which country has won the European Championship the most times?",
        a: "Germany and Spain have each won the European Championship three times - the joint-most in the competition's history.",
      },
      {
        q: "Which English manager led the country to the Euro 2020 final?",
        a: "Gareth Southgate managed England to the Euro 2020 final at Wembley, where they lost on penalties to Italy.",
      },
      {
        q: "Which Czech midfielder famously won the Euros in 1976?",
        a: "Antonin Panenka famously chipped the winning penalty in the 1976 Euros final shootout, giving Czechoslovakia victory over West Germany.",
      },
      {
        q: "Which country was the first to host the European Championship?",
        a: "France hosted the inaugural European Championship in 1960 with just four teams in the final tournament.",
      },
      {
        q: "Which Cristiano Ronaldo moment defined Portugal's Euro 2016 final?",
        a: "Cristiano Ronaldo went off injured in the first half of the Euro 2016 final but supported the team from the touchline as Portugal beat France 1-0.",
      },
    ],
    hard: [
      {
        q: "Which country won the first European Championship to expand to 16 teams in 1996?",
        a: "Germany won Euro 96 in England, the first tournament with 16 teams. Oliver Bierhoff scored the golden goal winner against the Czech Republic.",
      },
      {
        q: "Which player scored the first golden goal in European Championship history?",
        a: "Oliver Bierhoff scored the first golden goal winner for Germany against the Czech Republic in the Euro 96 final at Wembley.",
      },
      {
        q: "Which country was the first to win the European Championship as host?",
        a: "Spain (1964) and France (1984) were among the early host winners, with several other host nations having lifted the trophy on home soil.",
      },
      {
        q: "Which country won Euro 1992 in unusual circumstances?",
        a: "Denmark won Euro 1992, having only been called up to replace Yugoslavia after the Balkans war. They beat Germany 2-0 in the final.",
      },
    ],
    cta: {
      text: "Test your knowledge of Euro tournament transfers.",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
  {
    id: "intl-copa",
    title: "Copa America",
    description:
      "The Copa America is the oldest international continental tournament in the world, first held in 1916. Featuring South American giants and now expanded to include guests, it has crowned generations of legends.",
    easy: [
      {
        q: "In which year was the first Copa America held?",
        a: "The first Copa America was held in 1916, making it the oldest international continental football tournament.",
      },
      {
        q: "Which two countries are the most successful in Copa America history?",
        a: "Uruguay and Argentina are the most successful teams in Copa America history, having each won the tournament 15 times.",
      },
      {
        q: "Which Argentine forward finally won the Copa America in 2021?",
        a: "Lionel Messi finally won the Copa America with Argentina in 2021, beating Brazil 1-0 in the final at the Maracana.",
      },
      {
        q: "What is the name of the famous tournament that brought together North and South American teams in the 21st century?",
        a: "Copa America Centenario was held in 2016 in the United States to celebrate the centenary of the tournament.",
      },
      {
        q: "Which country won the Copa America Centenario in 2016?",
        a: "Chile won the Copa America Centenario in 2016, beating Argentina on penalties in the final at MetLife Stadium.",
      },
    ],
    medium: [
      {
        q: "Which Brazilian forward holds the record for most Copa America goals?",
        a: "Norberto Mendez of Argentina and Brazilian Zizinho both hold the record for most Copa America goals with 17 each.",
      },
      {
        q: "Which Chilean manager led the country to back-to-back Copa America titles in 2015 and 2016?",
        a: "Jorge Sampaoli (2015) and Juan Antonio Pizzi (2016) led Chile to back-to-back Copa America wins, both against Argentina on penalties.",
      },
      {
        q: "Which country is the third-most successful in Copa America history?",
        a: "Brazil have won the Copa America nine times, making them the third-most successful nation behind Uruguay and Argentina.",
      },
      {
        q: "Which year did Argentina end their 28-year wait for a major trophy by winning the Copa America?",
        a: "Argentina ended a 28-year wait for major trophy success by winning Copa America 2021 in Brazil under manager Lionel Scaloni.",
      },
      {
        q: "Which Brazilian Copa America-winning manager later won the World Cup?",
        a: "Tite, Mano Menezes and other Brazilian managers have won the Copa America. Tite was Brazil manager from 2016 to 2022.",
      },
    ],
    hard: [
      {
        q: "Which non-CONMEBOL country has performed best as a Copa America guest team?",
        a: "Mexico, a regular guest in Copa America, reached the final of the 1993 and 2001 tournaments, losing both.",
      },
      {
        q: "Which Bolivian player is the country's all-time top scorer in Copa America?",
        a: "Marco Antonio Etcheverry is one of Bolivia's most famous players, though specific scoring records vary.",
      },
      {
        q: "Which country won the Copa America in the 1940s with multiple consecutive victories?",
        a: "Argentina won three consecutive Copa America titles in 1945, 1946 and 1947, with Norberto Mendez leading the scoring.",
      },
      {
        q: "Which Colombian player is famous for his hairstyle and central role at Copa America in the 1990s?",
        a: "Carlos Valderrama, with his iconic blonde curly hair, was central to Colombia's golden era including their Copa America 2001 win.",
      },
    ],
    cta: {
      text: "Connect international stars across South American football.",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
  {
    id: "intl-records",
    title: "World Cup Records",
    description:
      "The World Cup record book features extraordinary feats - from Just Fontaine's 13 goals in a single tournament to Pele's three trophies. Test your knowledge of football's grandest stage.",
    easy: [
      {
        q: "Who is the all-time leading World Cup goalscorer?",
        a: "Miroslav Klose of Germany is the all-time leading World Cup goalscorer with 16 goals across four tournaments (2002-2014).",
      },
      {
        q: "Which player scored the most goals in a single World Cup tournament?",
        a: "Just Fontaine of France scored 13 goals in the 1958 World Cup - a record that still stands today.",
      },
      {
        q: "Which player has been awarded the Ballon d'Or the most times?",
        a: "Lionel Messi has won the Ballon d'Or eight times - more than any other player in history.",
      },
      {
        q: "Which goalkeeper holds the record for most clean sheets in World Cup history?",
        a: "Peter Shilton (England) and Fabien Barthez (France) jointly held the record for World Cup clean sheets with 10 each.",
      },
      {
        q: "Which player scored in three different World Cup finals?",
        a: "Pele (1958, 1970), Vava (1958, 1962), Paul Breitner (1974, 1982) and Zinedine Zidane (1998, 2006) and Kylian Mbappe (2018, 2022) have all scored in multiple World Cup finals.",
      },
    ],
    medium: [
      {
        q: "Who has played in the most World Cup matches?",
        a: "Lionel Messi has played in the most World Cup matches in history, surpassing Lothar Matthaus's previous record of 25.",
      },
      {
        q: "Which player won the Golden Ball at the 2022 World Cup?",
        a: "Lionel Messi won the Golden Ball at the 2022 World Cup, leading Argentina to victory over France in the final.",
      },
      {
        q: "Which country has appeared in the most World Cup tournaments?",
        a: "Brazil are the only country to have appeared in every World Cup tournament since the competition began in 1930.",
      },
      {
        q: "Which French striker won the Golden Boot in 1998?",
        a: "Davor Suker of Croatia won the Golden Boot at the 1998 World Cup with six goals, leading his country to a third-place finish.",
      },
      {
        q: "Which player is the youngest to score in a World Cup final?",
        a: "Pele scored in the 1958 World Cup final at age 17, the youngest scorer in a World Cup final.",
      },
      {
        q: "Which World Cup record was set by Kylian Mbappe in the 2022 final?",
        a: "Kylian Mbappe scored a hat-trick in the 2022 World Cup final - the first hat-trick in a final since Geoff Hurst in 1966.",
      },
    ],
    hard: [
      {
        q: "Which goalkeeper made the most saves in a single World Cup tournament?",
        a: "Multiple goalkeepers have set saves records. Tim Howard's 16 saves in a single match against Belgium in 2014 is one notable record.",
      },
      {
        q: "Which country has appeared in the most World Cup finals without winning?",
        a: "The Netherlands have appeared in three World Cup finals (1974, 1978, 2010) without winning the trophy - the most appearances without victory.",
      },
      {
        q: "Which player has the most career goals across all major international tournaments?",
        a: "Cristiano Ronaldo and Ali Daei are among the all-time top international goalscorers, with Ronaldo holding the record across major tournaments.",
      },
      {
        q: "Which Italian goalkeeper became the oldest player to win the World Cup at age 40?",
        a: "Dino Zoff captained Italy to the 1982 World Cup at age 40, becoming the oldest World Cup-winning captain.",
      },
    ],
    cta: {
      text: "Place international football's biggest moments in chronological order.",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
];

function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [
    {
      name: "Which country has won the FIFA World Cup the most times?",
      acceptedAnswer:
        "Brazil have won the FIFA World Cup five times: 1958, 1962, 1970, 1994, and 2002.",
    },
    {
      name: "Who is the all-time top goalscorer in World Cup history?",
      acceptedAnswer:
        "Miroslav Klose of Germany is the all-time top World Cup goalscorer with 16 goals across four tournaments (2002-2014).",
    },
    {
      name: "Which two countries are the most successful in Copa America?",
      acceptedAnswer:
        "Uruguay and Argentina are jointly the most successful teams in Copa America history, having each won the tournament 15 times.",
    },
    {
      name: "Which country won the inaugural European Championship?",
      acceptedAnswer:
        "The Soviet Union won the inaugural European Championship in 1960, beating Yugoslavia 2-1 in the final.",
    },
    {
      name: "Which player has won the most Ballon d'Or awards?",
      acceptedAnswer:
        "Lionel Messi has won the Ballon d'Or eight times - more than any other player in history.",
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

export default function InternationalFootballQuizPage() {
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
                  name: "International Football Trivia",
                  item: "https://www.football-iq.app/quiz/international-football",
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
                International Football
              </li>
            </ol>
          </nav>

          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            International Football Trivia Questions & Answers (2026)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            {totalQuestions}+ international football trivia questions covering
            the FIFA World Cup, European Championship, Copa America and the
            greatest record holders. Questions are organised by difficulty - tap
            any question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. From the 1930 World Cup in Uruguay to the modern
            era of international football.
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
