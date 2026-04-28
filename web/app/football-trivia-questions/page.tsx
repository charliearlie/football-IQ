import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "100+ Football Trivia Questions and Answers (2026)",
  description:
    "Test your football knowledge with over 100 trivia questions and answers covering the Premier League, World Cup, Champions League, transfers, and records. Organised by difficulty.",
  alternates: {
    canonical: "https://www.football-iq.app/football-trivia-questions",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
  },
  openGraph: {
    title: "100+ Football Trivia Questions and Answers | Football IQ",
    description:
      "Over 100 football trivia questions organised by topic and difficulty. Premier League, World Cup, Champions League, transfers, and records.",
    url: "https://www.football-iq.app/football-trivia-questions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "100+ Football Trivia Questions and Answers | Football IQ",
    description:
      "Over 100 football trivia questions organised by topic and difficulty. Test your football knowledge now.",
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
    id: "premier-league",
    title: "Premier League",
    description:
      "How well do you know the English top flight? From all-time records to iconic moments, these Premier League trivia questions will test every fan.",
    easy: [
      {
        q: "Which club has won the most Premier League titles?",
        a: "Manchester United with 13 Premier League titles (1992-93 to 2012-13).",
      },
      {
        q: "Who is the Premier League's all-time top scorer?",
        a: "Alan Shearer with 260 Premier League goals, scored for Blackburn Rovers and Newcastle United.",
      },
      {
        q: "Which team went unbeaten for an entire Premier League season?",
        a: "Arsenal in 2003-04, earning the nickname 'The Invincibles'. They won 26 and drew 12 of their 38 matches.",
      },
      {
        q: "How many teams play in the Premier League each season?",
        a: "20 teams compete in the Premier League each season.",
      },
      {
        q: "Which club won the first-ever Premier League title in 1992-93?",
        a: "Manchester United, managed by Sir Alex Ferguson.",
      },
      {
        q: "Who holds the record for most Premier League assists?",
        a: "Ryan Giggs with 162 assists across his career at Manchester United.",
      },
      {
        q: "Which goalkeeper has kept the most Premier League clean sheets?",
        a: "Petr Cech with 202 clean sheets for Chelsea and Arsenal.",
      },
    ],
    medium: [
      {
        q: "Which player has made the most Premier League appearances?",
        a: "Gareth Barry with 653 appearances for Aston Villa, Manchester City, Everton, and West Bromwich Albion.",
      },
      {
        q: "Who scored the fastest hat-trick in Premier League history?",
        a: "Sadio Mane scored a hat-trick in 2 minutes 56 seconds for Southampton against Aston Villa in May 2015.",
      },
      {
        q: "Which club won the Premier League title in 2015-16 as 5,000-1 outsiders?",
        a: "Leicester City, managed by Claudio Ranieri, in one of sport's greatest-ever underdog stories.",
      },
      {
        q: "What is the record for most goals scored in a single Premier League season by one player?",
        a: "Erling Haaland scored 36 goals for Manchester City in the 2022-23 season.",
      },
      {
        q: "Which player was the first to score 100 Premier League goals?",
        a: "Alan Shearer reached 100 Premier League goals in April 1995 while playing for Blackburn Rovers.",
      },
      {
        q: "Who scored the Premier League's first-ever goal?",
        a: "Brian Deane scored the first Premier League goal for Sheffield United against Manchester United on 15 August 1992.",
      },
      {
        q: "Which manager has won the most Premier League titles?",
        a: "Sir Alex Ferguson with 13 titles, all with Manchester United between 1993 and 2013.",
      },
    ],
    hard: [
      {
        q: "Which player has scored in the most consecutive Premier League matches?",
        a: "Jamie Vardy scored in 11 consecutive Premier League matches for Leicester City in 2015-16.",
      },
      {
        q: "What is the biggest margin of victory in a single Premier League match?",
        a: "Manchester United beat Ipswich Town 9-0 in March 1995 — equalled by Manchester United 9-0 Southampton in 2021.",
      },
      {
        q: "Who is the youngest player to score a Premier League hat-trick?",
        a: "Michael Owen scored a hat-trick aged 18 years and 62 days for Liverpool against Sheffield Wednesday in February 1998.",
      },
      {
        q: "Which team holds the record for most points in a single Premier League season?",
        a: "Manchester City with 100 points in the 2017-18 season under Pep Guardiola.",
      },
      {
        q: "Name the only player to score five goals in a single Premier League match.",
        a: "Andy Cole (Manchester United vs Ipswich, 1995), Alan Shearer (Newcastle vs Sheffield Wednesday, 1999), Jermain Defoe (Tottenham vs Wigan, 2009), Dimitar Berbatov (Manchester United vs Blackburn, 2010), and Sergio Aguero (Manchester City vs Newcastle, 2015) have all scored five.",
      },
      {
        q: "Which club was the first to be relegated from the Premier League?",
        a: "Crystal Palace, Middlesbrough, and Nottingham Forest were all relegated at the end of the first Premier League season in 1992-93.",
      },
      {
        q: "Who scored the fastest goal in Premier League history?",
        a: "Shane Long scored after 7.69 seconds for Southampton against Watford in April 2019.",
      },
    ],
    cta: {
      text: "Think you can guess a player from their Premier League career?",
      href: "/play/career-path",
      label: "Play Career Path",
    },
  },
  {
    id: "world-cup",
    title: "World Cup",
    description:
      "The FIFA World Cup is football's biggest stage. From 1930 to 2022, test your knowledge of the tournament's greatest moments, records, and winners.",
    easy: [
      {
        q: "Which country has won the most FIFA World Cup titles?",
        a: "Brazil with 5 World Cup wins (1958, 1962, 1970, 1994, 2002).",
      },
      {
        q: "Who won the 2022 FIFA World Cup in Qatar?",
        a: "Argentina, beating France on penalties in the final. Lionel Messi won the Golden Ball.",
      },
      {
        q: "In which year was the first FIFA World Cup held?",
        a: "1930, hosted by Uruguay. Uruguay also won the tournament.",
      },
      {
        q: "Who is the all-time top scorer in World Cup history?",
        a: "Miroslav Klose of Germany with 16 goals across four World Cups (2002-2014).",
      },
      {
        q: "How often is the FIFA World Cup held?",
        a: "Every four years. The next edition is the 2026 World Cup in the USA, Canada, and Mexico.",
      },
      {
        q: "Which country hosted and won the 1966 World Cup?",
        a: "England, beating West Germany 4-2 in the final at Wembley. Geoff Hurst scored a hat-trick.",
      },
      {
        q: "How many teams compete in the 2026 FIFA World Cup?",
        a: "48 teams, expanded from 32 for the first time in World Cup history.",
      },
    ],
    medium: [
      {
        q: "Who scored the 'Hand of God' goal in the 1986 World Cup?",
        a: "Diego Maradona scored it against England in the quarter-final. He also scored the 'Goal of the Century' in the same match.",
      },
      {
        q: "Which player has scored in the most World Cup tournaments?",
        a: "Cristiano Ronaldo and Lionel Messi have both scored in five different World Cup tournaments.",
      },
      {
        q: "What was the 'Miracle of Bern'?",
        a: "West Germany's 3-2 victory over Hungary in the 1954 World Cup final, considered one of the greatest upsets in football history.",
      },
      {
        q: "Which is the only country to have played in every World Cup?",
        a: "Brazil have appeared in every FIFA World Cup since the tournament's inception in 1930.",
      },
      {
        q: "Who won the first World Cup Golden Boot awarded to the tournament's top scorer?",
        a: "The first official Golden Boot (then Golden Shoe) was awarded to Guillermo Stabile of Argentina in 1930 (8 goals).",
      },
      {
        q: "Which World Cup final featured the most goals?",
        a: "The 1958 final: Brazil 5-2 Sweden. Also, the 2022 final (Argentina 3-3 France, with Argentina winning on penalties) featured 6 goals in regular/extra time.",
      },
      {
        q: "Which African nation reached the World Cup quarter-finals for the first time in 1990?",
        a: "Cameroon, led by 38-year-old Roger Milla, beat Argentina in the opening match and reached the quarter-finals.",
      },
    ],
    hard: [
      {
        q: "Which player has received the most red cards in World Cup history?",
        a: "Zinedine Zidane and Rigobert Song each received two red cards across their World Cup careers.",
      },
      {
        q: "What is the fastest goal ever scored in a World Cup match?",
        a: "Hakan Sukur of Turkey scored after 11 seconds against South Korea in the 2002 World Cup third-place play-off.",
      },
      {
        q: "Which country suffered the heaviest defeat in World Cup history?",
        a: "Brazil lost 7-1 to Germany in the 2014 World Cup semi-final at the Mineirao Stadium. It is the most lopsided World Cup semi-final in history.",
      },
      {
        q: "Who is the oldest player to score in a World Cup match?",
        a: "Roger Milla of Cameroon scored aged 42 years and 39 days against Russia at the 1994 World Cup.",
      },
      {
        q: "In which World Cup did penalty shootouts first decide a match?",
        a: "1982 World Cup in Spain. The first shootout was in the semi-final between West Germany and France.",
      },
      {
        q: "Name the player who scored in both the 1998 and 2006 World Cup finals.",
        a: "Zinedine Zidane scored in both finals — two headers against Brazil in 1998 and a Panenka penalty against Italy in 2006.",
      },
      {
        q: "Which country won the World Cup despite losing their opening group match?",
        a: "Spain in 2010 lost their opening match 1-0 to Switzerland but went on to win the tournament.",
      },
    ],
    cta: {
      text: "Can you sort World Cup moments into the correct timeline?",
      href: "/play/timeline",
      label: "Play Timeline",
    },
  },
  {
    id: "champions-league",
    title: "Champions League",
    description:
      "Europe's elite club competition has produced some of football's most unforgettable nights. How much do you know about the Champions League and its predecessor, the European Cup?",
    easy: [
      {
        q: "Which club has won the most Champions League / European Cup titles?",
        a: "Real Madrid with 15 titles (as of 2024).",
      },
      {
        q: "What was the Champions League called before 1992?",
        a: "The European Cup (officially the European Champion Clubs' Cup), first held in 1955-56.",
      },
      {
        q: "Which English club won the Champions League in 2005 after being 3-0 down at half-time?",
        a: "Liverpool came back from 3-0 down against AC Milan in Istanbul to win on penalties. It's known as the 'Miracle of Istanbul'.",
      },
      {
        q: "Who is the all-time top scorer in Champions League history?",
        a: "Cristiano Ronaldo with 140 goals for Manchester United, Real Madrid, and Juventus.",
      },
      {
        q: "How many clubs compete in the Champions League group stage?",
        a: "From 2024-25, the Champions League uses a 36-team league phase instead of the traditional group stage.",
      },
      {
        q: "Which English club won back-to-back European Cups in 1979 and 1980?",
        a: "Nottingham Forest under Brian Clough won consecutive European Cups.",
      },
      {
        q: "What is the iconic Champions League anthem adapted from?",
        a: "Handel's 'Zadok the Priest'. The anthem was composed by Tony Britten in 1992.",
      },
    ],
    medium: [
      {
        q: "Which club won the first-ever European Cup in 1956?",
        a: "Real Madrid beat Stade de Reims 4-3 in the final held in Paris.",
      },
      {
        q: "Who scored the winning goal in the 1999 Champions League final for Manchester United?",
        a: "Ole Gunnar Solskjaer scored in injury time. Teddy Sheringham had equalised moments before. Both goals came after the 90th minute against Bayern Munich.",
      },
      {
        q: "Which club won six consecutive European Cups from 1956 to 1960?",
        a: "Real Madrid won the first five European Cups (1956-1960), not six.",
      },
      {
        q: "Who has won the most Champions League titles as a player?",
        a: "Francisco Gento won 6 European Cups with Real Madrid (1956-1966). In the modern Champions League era, Dani Carvajal, Luka Modric, Toni Kroos, and Nacho each won 6 combined European Cup/Champions League titles.",
      },
      {
        q: "What is the record for most goals in a single Champions League season?",
        a: "Cristiano Ronaldo scored 17 goals in the 2013-14 season for Real Madrid.",
      },
      {
        q: "Which was the last team to win back-to-back Champions League titles?",
        a: "Real Madrid in 2016-17 and 2017-18 under Zinedine Zidane.",
      },
      {
        q: "Who scored the fastest hat-trick in Champions League history?",
        a: "Mike Owen scored a hat-trick in 24 minutes for Liverpool against Spartak Moscow in 2002 (sometimes disputed). Bafetimbi Gomis also scored a rapid hat-trick.",
      },
    ],
    hard: [
      {
        q: "Which was the first English club to win the European Cup?",
        a: "Manchester United in 1968, beating Benfica 4-1 at Wembley with goals from Charlton (2), Best, and Kidd.",
      },
      {
        q: "Name the only club to win the Champions League final on penalties twice.",
        a: "No club has won the Champions League on penalties twice. Liverpool (2005), Chelsea (2012), and Real Madrid (2022 was not penalties) each won once via shootout.",
      },
      {
        q: "Which player scored in two Champions League finals for two different clubs?",
        a: "Didier Drogba scored in finals for Chelsea (2008 vs Man Utd and 2012 vs Bayern Munich). Also, Cristiano Ronaldo scored in finals for Man Utd (2008) and Real Madrid (multiple years).",
      },
      {
        q: "What is the biggest aggregate victory in a Champions League knockout tie?",
        a: "Several large aggregate wins exist, including Bayern Munich's 12-1 aggregate over Sporting CP in the 2008-09 round of 16.",
      },
      {
        q: "Which team won the European Cup three consecutive times from 1971 to 1973?",
        a: "Ajax, under coach Rinus Michels (1971) and then Stefan Kovacs (1972-73), featuring Johan Cruyff.",
      },
      {
        q: "Who is the youngest player to score in a Champions League final?",
        a: "Patrick Kluivert scored in the 1995 final for Ajax aged 18 years and 327 days against AC Milan.",
      },
      {
        q: "Name the only manager to win the Champions League with two different clubs.",
        a: "Several managers have done this: Ernst Happel (Feyenoord & Hamburg), Jupp Heynckes (Real Madrid & Bayern Munich), Carlo Ancelotti (AC Milan & Real Madrid), and Bob Paisley (if counting European Cup era).",
      },
    ],
    cta: {
      text: "Know your European football connections?",
      href: "/play/connections",
      label: "Play Connections",
    },
  },
  {
    id: "records-and-stats",
    title: "Records & Stats",
    description:
      "From the fastest goals to the longest unbeaten runs, football is full of remarkable records. Put your stat knowledge to the test.",
    easy: [
      {
        q: "Who holds the record for most international goals in men's football?",
        a: "Cristiano Ronaldo with 130+ goals for Portugal (record still being extended as of 2025).",
      },
      {
        q: "Which player has won the most Ballon d'Or awards?",
        a: "Lionel Messi with 8 Ballon d'Or awards (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023).",
      },
      {
        q: "What is the fastest red card in football history?",
        a: "Lee Todd was sent off after 2 seconds for Cross Farm Park Celtic in 2000 for saying 'f*** me, that was loud' after the whistle.",
      },
      {
        q: "Which country has the most international football caps ever recorded?",
        a: "Bader Al-Mutawa of Kuwait holds the record with 196 caps (as of 2024). Cristiano Ronaldo holds the European record with 200+.",
      },
      {
        q: "How long is a standard professional football match?",
        a: "90 minutes (two halves of 45 minutes each), plus any added stoppage time.",
      },
      {
        q: "Which club has won the most domestic league titles in Europe?",
        a: "Rangers (Scotland) and Linfield (Northern Ireland) both claim the most with 55+ league titles each.",
      },
      {
        q: "Who was the first player to score 100 international goals?",
        a: "Daei scored his 100th international goal for Iran in 2004. Ali Daei held the men's record (109) until Cristiano Ronaldo surpassed it in 2021.",
      },
    ],
    medium: [
      {
        q: "What is the longest unbeaten run in top-flight football history?",
        a: "Bayer Leverkusen went 51 Bundesliga matches unbeaten across the 2023-24 season.",
      },
      {
        q: "Who scored the most goals in a single calendar year?",
        a: "Lionel Messi scored 91 goals in 2012 for Barcelona and Argentina.",
      },
      {
        q: "What is the highest-scoring professional football match on record?",
        a: "AS Adema 149-0 SO l'Emyrne in Madagascar in 2002. SO l'Emyrne scored own goals in protest throughout the match.",
      },
      {
        q: "Which club has won the most Copa Libertadores titles?",
        a: "Independiente (Argentina) with 7 Copa Libertadores titles.",
      },
      {
        q: "Who was the first goalkeeper to win the Ballon d'Or?",
        a: "Lev Yashin of the Soviet Union won the Ballon d'Or in 1963. He remains the only goalkeeper to have won it.",
      },
      {
        q: "What is the longest penalty shootout in professional football?",
        a: "Washington NL vs Bedlington Terriers in the FA Vase 2009: 25 penalties each (Washington won 14-13).",
      },
      {
        q: "Which player has the most assists in international football history?",
        a: "Lionel Messi holds the record with 50+ assists for Argentina.",
      },
    ],
    hard: [
      {
        q: "Who scored the fastest goal in professional football history?",
        a: "Nawaf Al-Abed scored after 2 seconds for Al-Hilal in a Saudi league match in 2009, though the most widely recognised is Hakan Sukur's 11-second World Cup goal.",
      },
      {
        q: "What is the record for most consecutive domestic league titles?",
        a: "Skonto Riga won 14 consecutive Latvian league titles (1991-2004).",
      },
      {
        q: "Which player has been transferred for the highest combined transfer fees across their career?",
        a: "Neymar holds this record with combined fees exceeding EUR500 million across moves between Santos, Barcelona, PSG, and Al-Hilal.",
      },
      {
        q: "What is the record attendance for a football match?",
        a: "199,854 at the 1950 World Cup final (Uruguay vs Brazil) at the Maracana in Rio de Janeiro. Some estimates put the actual figure above 200,000.",
      },
      {
        q: "Who is the oldest player to appear in a professional football match?",
        a: "Kazuyoshi Miura played for Oliveirense aged 56 in Portugal's second division in 2024.",
      },
      {
        q: "Which national team holds the record for most consecutive World Cup qualifications?",
        a: "Brazil qualified for every World Cup from 1930 to 2022 — 22 consecutive tournaments.",
      },
      {
        q: "What is the fastest hat-trick in professional football?",
        a: "Tommy Ross scored a hat-trick in 90 seconds for Ross County against Nairn County in 1964.",
      },
    ],
    cta: {
      text: "Think you know your football stats? Try the daily quiz.",
      href: "/play/topical-quiz",
      label: "Play Topical Quiz",
    },
  },
  {
    id: "transfers",
    title: "Transfers",
    description:
      "From world-record fees to shock deadline-day deals, the transfer market produces some of football's biggest stories. Test your knowledge of the moves that shaped the game.",
    easy: [
      {
        q: "Who is the most expensive footballer of all time by transfer fee?",
        a: "Neymar, who moved from Barcelona to Paris Saint-Germain for EUR222 million in 2017.",
      },
      {
        q: "Which club did Cristiano Ronaldo join after leaving Manchester United in 2009?",
        a: "Real Madrid, for a then-world-record fee of GBP80 million.",
      },
      {
        q: "What are the two main transfer windows in European football?",
        a: "The summer window (typically June to August/September) and the January window (typically the whole month of January).",
      },
      {
        q: "Which club did Lionel Messi join after leaving Barcelona in 2021?",
        a: "Paris Saint-Germain (PSG) on a free transfer after Barcelona could not register his new contract under La Liga's financial fair play rules.",
      },
      {
        q: "What does a 'free transfer' or 'Bosman' mean in football?",
        a: "A player whose contract has expired can join a new club without a transfer fee. Named after Jean-Marc Bosman, whose 1995 court case established this right in EU law.",
      },
      {
        q: "Which club did Wayne Rooney join from Everton in 2004?",
        a: "Manchester United for GBP25.6 million when Rooney was just 18 years old.",
      },
      {
        q: "Who did Chelsea sign for a British-record fee in 2023?",
        a: "Enzo Fernandez from Benfica for GBP107 million in January 2023.",
      },
    ],
    medium: [
      {
        q: "Which player moved from Ajax to Juventus to Inter Milan to Barcelona to AC Milan?",
        a: "Edgar Davids had stints at all these clubs, but the most famous player to make most of these moves was Patrick Kluivert (Ajax-Milan-Barcelona). Zlatan Ibrahimovic played for Ajax, Juventus, Inter, and Barcelona (though also AC Milan).",
      },
      {
        q: "What was the first GBP1 million transfer in British football?",
        a: "Trevor Francis moved from Birmingham City to Nottingham Forest for GBP1 million in February 1979.",
      },
      {
        q: "Which player was sold by Liverpool to Barcelona in 2014 for GBP75 million?",
        a: "Luis Suarez, after scoring 31 Premier League goals in the 2013-14 season.",
      },
      {
        q: "Name the player who moved from Southampton to Liverpool in January 2018.",
        a: "Virgil van Dijk for GBP75 million, a world-record fee for a defender at the time.",
      },
      {
        q: "Which club did Zinedine Zidane join for a then-world-record fee in 2001?",
        a: "Real Madrid, from Juventus for EUR77.5 million.",
      },
      {
        q: "Who moved from Tottenham to Real Madrid in 2013 for a then-world-record fee?",
        a: "Gareth Bale for approximately GBP85 million (EUR100 million).",
      },
      {
        q: "Which English club sold Declan Rice in the summer of 2023?",
        a: "West Ham United sold Declan Rice to Arsenal for a reported GBP105 million.",
      },
    ],
    hard: [
      {
        q: "Name the first GBP100 million+ transfer in world football.",
        a: "Neymar's EUR222 million move from Barcelona to PSG in 2017 was the first to break the EUR100 million and GBP100 million barrier.",
      },
      {
        q: "Which player was the most expensive teenager in football history as of 2024?",
        a: "Endrick moved from Palmeiras to Real Madrid in 2024 for a deal worth up to EUR72 million, though Jude Bellingham's 2020 move (at 17, GBP25m) was also record-breaking at the time. Moises Caicedo's teenage move was GBP4.5m but his later Chelsea fee was GBP115m.",
      },
      {
        q: "What is the 'Webster ruling' in football transfers?",
        a: "A 2001 FIFA regulation allowing players to unilaterally terminate contracts after a 'protected period' (3 years for players over 28, 2 years in some jurisdictions) by paying compensation. Named after Andy Webster's case at Hearts.",
      },
      {
        q: "Which club bought Rio Ferdinand, Juan Sebastian Veron, and Ruud van Nistelrooy in the same transfer window?",
        a: "Trick question: they were bought in different windows. Veron and van Nistelrooy arrived in summer 2001; Ferdinand joined Manchester United in summer 2002.",
      },
      {
        q: "Name the player who was sold by Athletic Bilbao to Chelsea for his release clause in 2019.",
        a: "Kepa Arrizabalaga for EUR80 million, the highest fee ever paid for a goalkeeper.",
      },
      {
        q: "Which player moved from Benfica to Atletico Madrid to Chelsea to Barcelona, all for fees over EUR100 million?",
        a: "Joao Felix. Benfica to Atletico Madrid (EUR126m, 2019), Atletico to Chelsea (loan), then eventually to Barcelona.",
      },
      {
        q: "What is the largest profit ever made on a single player sale?",
        a: "One of the largest is Philippe Coutinho: Liverpool bought him for approximately GBP8.5 million from Inter in 2013 and sold him to Barcelona for GBP142 million in 2018, a profit of over GBP130 million.",
      },
    ],
    cta: {
      text: "Can you guess the transfer fee?",
      href: "/play/transfer-guess",
      label: "Play Transfer Guess",
    },
  },
];

// Pick representative Q&A pairs for FAQ schema (max ~20 to stay within limits)
function getFaqSchemaEntities() {
  const faqQuestions: { name: string; acceptedAnswer: string }[] = [];
  for (const section of sections) {
    // Take 2 easy + 1 medium + 1 hard per section = 4 per section * 5 sections = 20
    const picks = [
      ...section.easy.slice(0, 2),
      ...section.medium.slice(0, 1),
      ...section.hard.slice(0, 1),
    ];
    for (const pick of picks) {
      faqQuestions.push({ name: pick.q, acceptedAnswer: pick.a });
    }
  }
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

function DifficultyBadge({
  level,
}: {
  level: "Easy" | "Medium" | "Hard";
}) {
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

export default function FootballTriviaQuestionsPage() {
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
          {/* Intro */}
          <h1 className="font-bebas text-4xl md:text-5xl tracking-wide text-white mb-4">
            {totalQuestions}+ Football Trivia Questions & Answers
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-4 max-w-2xl">
            Test your football knowledge with our collection of trivia questions
            covering the Premier League, World Cup, Champions League, all-time
            records, and transfer history. Questions are organised by topic and
            difficulty — tap any question to reveal the answer.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Updated for 2026. Questions range from pub-quiz easy to football-nerd
            hard.
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
                {section.title} Trivia Questions
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
              Football IQ has 5 free daily games — guess players from career
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
