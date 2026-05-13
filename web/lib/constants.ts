// Game modes supported by Football IQ
export const GAME_MODES = [
  "career_path",
  "career_path_pro",
  "the_grid",
  "the_chain",
  "the_thread",
  "guess_the_transfer",
  "guess_the_goalscorers",
  "topical_quiz",
  "top_tens",
  "last_tens",
  "starting_xi",
  "connections",
  "timeline",
  "who_am_i",
  "higher_lower",
  "whos-that",
] as const;

export type GameMode = (typeof GAME_MODES)[number];

// Display names for game modes
export const GAME_MODE_DISPLAY_NAMES: Record<GameMode, string> = {
  career_path: "Career Path",
  career_path_pro: "Career Path Pro",
  the_grid: "The Grid",
  the_chain: "The Chain",
  the_thread: "Threads",
  guess_the_transfer: "Transfer Guess",
  guess_the_goalscorers: "Goalscorer Recall",
  topical_quiz: "Topical Quiz",
  top_tens: "Top Tens",
  last_tens: "Last 10",
  starting_xi: "Starting XI",
  connections: "Connections",
  timeline: "Timeline",
  who_am_i: "Who Am I?",
  higher_lower: "Higher/Lower",
  "whos-that": "Who's That?",
};

// Short names for compact display
export const GAME_MODE_SHORT_NAMES: Record<GameMode, string> = {
  career_path: "CP",
  career_path_pro: "CPP",
  the_grid: "TG",
  the_chain: "TC",
  the_thread: "THR",
  guess_the_transfer: "TR",
  guess_the_goalscorers: "GR",
  topical_quiz: "TQ",
  top_tens: "TT",
  last_tens: "L10",
  starting_xi: "XI",
  connections: "CON",
  timeline: "TL",
  who_am_i: "WAI",
  higher_lower: "HL",
  "whos-that": "WT",
};

// Premium-only modes. Free users hit the orchestrator paywall when they open
// any of these. Mirrors mobile's hardcoded checks in `useDailyPuzzles.ts`
// (`gameMode === 'top_tens' || gameMode === 'career_path_pro'`) and the
// archive components — full cross-platform parity on which modes paywall.
export const PREMIUM_MODES: GameMode[] = ["career_path_pro", "top_tens"];

// Design tokens (matching mobile app)
export const COLORS = {
  pitchGreen: "#2EFC5D",
  grassShadow: "#1A9E38",
  stadiumNavy: "#05050A",
  floodlight: "#FFFFFF",
  cardYellow: "#FACC15",
  redCard: "#EF4444",
  warningOrange: "#FF4D00",
  amber: "#F59E0B",
} as const;

// Puzzle status values
export const PUZZLE_STATUSES = ["live", "draft", "archived"] as const;
export type PuzzleStatus = (typeof PUZZLE_STATUSES)[number];

// App Store URLs
export const ANDROID_PACKAGE = "com.footballiq.app";
export const APP_STORE_URL = "https://apps.apple.com/app/football-iq-daily-quiz-game/id6757344691";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/** App Store URL with campaign tracking for App Store Connect analytics */
export function appStoreUrl(campaign: string): string {
  return `${APP_STORE_URL}?mt=8&ct=${encodeURIComponent(campaign)}`;
}

// Web-playable game modes (available on /play)
export interface WebPlayableGame {
  dbMode: GameMode;
  slug: string;
  title: string;
  description: string;
  accentColor: string;
}

// Ordered for the /play hub + homepage. Flagship daily games first (the ones
// we run new content for), then the engine-reuse variants, then the older
// modes that still publish but are less central.
export const WEB_PLAYABLE_GAMES: WebPlayableGame[] = [
  {
    dbMode: "career_path",
    slug: "career-path",
    title: "Career Path",
    description: "Guess the player from their career history",
    accentColor: COLORS.pitchGreen,
  },
  {
    dbMode: "whos-that",
    slug: "whos-that",
    title: "Who's That?",
    description: "Wordle for footballers — 6 guesses, attribute feedback",
    accentColor: "#A855F7",
  },
  {
    dbMode: "higher_lower",
    slug: "higher-lower",
    title: "Higher/Lower",
    description: "Higher or lower? Compare real player stats over 10 rounds",
    accentColor: "#F59E0B",
  },
  {
    dbMode: "top_tens",
    slug: "top-tens",
    title: "Top Tens",
    description: "Guess all 10 entries in a top-10 list — Tenable style",
    accentColor: "#FF6B6B",
  },
  {
    dbMode: "last_tens",
    slug: "last-tens",
    title: "Last 10",
    description: "Name the last 10 winners, scorers or transfers",
    accentColor: "#FB923C",
  },
  {
    dbMode: "who_am_i",
    slug: "who-am-i",
    title: "Who Am I?",
    description: "Guess the footballer from 5 progressive clues",
    accentColor: "#22D3EE",
  },
  {
    dbMode: "the_thread",
    slug: "the-thread",
    title: "The Thread",
    description: "Trace a club's kit-sponsor or supplier history",
    accentColor: "#EC4899",
  },
  {
    dbMode: "career_path_pro",
    slug: "career-path-pro",
    title: "Career Path Pro",
    description: "Career Path turned up to 11 — longer chain, deeper cuts",
    accentColor: COLORS.pitchGreen,
  },
  {
    dbMode: "connections",
    slug: "connections",
    title: "Connections",
    description: "Group 16 players into 4 categories",
    accentColor: "#3B82F6",
  },
  {
    dbMode: "guess_the_transfer",
    slug: "transfer-guess",
    title: "Transfer Guess",
    description: "Name the player from a single transfer",
    accentColor: COLORS.cardYellow,
  },
  {
    dbMode: "timeline",
    slug: "timeline",
    title: "Timeline",
    description: "Sort 6 events into chronological order",
    accentColor: COLORS.amber,
  },
  {
    dbMode: "topical_quiz",
    slug: "topical-quiz",
    title: "Topical Quiz",
    description: "5 questions on this week's headlines",
    accentColor: "#FF6B6B",
  },
];

// App-only modes shown as teasers in the /play hub. Only modes we don't
// currently publish daily content for — the rest now live in the browser.
export const APP_ONLY_GAMES: { title: string; description: string }[] = [
  { title: "The Grid", description: "Fill the 3x3 grid matching criteria" },
  { title: "The Chain", description: "Link players through shared clubs" },
  { title: "Goalscorer Recall", description: "Name every scorer from a classic match" },
  { title: "Starting XI", description: "Find the missing players in iconic lineups" },
];

// Fallback puzzle data for when no puzzle exists for today
export const FALLBACK_CAREER_PUZZLE = {
  answer: "Bukayo Saka",
  career_steps: [
    {
      type: "club" as const,
      text: "Arsenal",
      year: "2018-present",
      apps: 180,
      goals: 45,
    },
    { type: "club" as const, text: "Arsenal Academy", year: "2008-2018" },
  ],
};

export const FALLBACK_TRANSFER_PUZZLE = {
  answer: "Philippe Coutinho",
  from_club: "Liverpool",
  to_club: "Barcelona",
  fee: "\u00A3105m",
  from_club_color: "#C8102E",
  to_club_color: "#A50044",
  from_club_abbreviation: "LIV",
  to_club_abbreviation: "BAR",
  hints: ["2018", "Midfielder", "BR"] as [string, string, string],
};

export const FALLBACK_CONNECTIONS_PUZZLE = {
  groups: [
    {
      category: "Won Premier League Golden Boot",
      difficulty: "yellow" as const,
      players: ["Thierry Henry", "Mohamed Salah", "Harry Kane", "Robin van Persie"] as [string, string, string, string],
    },
    {
      category: "Played for AC Milan and Juventus",
      difficulty: "green" as const,
      players: ["Andrea Pirlo", "Zlatan Ibrahimovic", "Gonzalo Higuain", "Leonardo Bonucci"] as [string, string, string, string],
    },
    {
      category: "Won the World Cup as captain",
      difficulty: "blue" as const,
      players: ["Franz Beckenbauer", "Didier Deschamps", "Diego Maradona", "Iker Casillas"] as [string, string, string, string],
    },
    {
      category: "First name is the same as a city",
      difficulty: "purple" as const,
      players: ["Milan Baros", "Santiago Munez", "Orlando Engelaar", "Sydney Leroux"] as [string, string, string, string],
    },
  ] as [
    { category: string; difficulty: "yellow"; players: [string, string, string, string] },
    { category: string; difficulty: "green"; players: [string, string, string, string] },
    { category: string; difficulty: "blue"; players: [string, string, string, string] },
    { category: string; difficulty: "purple"; players: [string, string, string, string] },
  ],
};

export const FALLBACK_TIMELINE_PUZZLE = {
  title: "Cristiano Ronaldo",
  subject: "Cristiano Ronaldo",
  events: [
    { text: "Joined Sporting CP academy", year: 2001 },
    { text: "Signed for Manchester United", year: 2003 },
    { text: "Won Champions League with Man United", year: 2008 },
    { text: "Transferred to Real Madrid", year: 2009 },
    { text: "Won first Ballon d'Or at Real Madrid", year: 2014 },
    { text: "Moved to Juventus", year: 2018 },
  ],
};

export const FALLBACK_QUIZ_PUZZLE = {
  questions: [
    {
      id: "fb-q1",
      question: "Who won the 2024 Ballon d'Or?",
      options: ["Vinicius Jr", "Rodri", "Jude Bellingham", "Erling Haaland"] as [string, string, string, string],
      correctIndex: 1,
    },
    {
      id: "fb-q2",
      question: "Which club won the 2023-24 Champions League?",
      options: ["Manchester City", "Real Madrid", "Bayern Munich", "Inter Milan"] as [string, string, string, string],
      correctIndex: 1,
    },
    {
      id: "fb-q3",
      question: "Who is the Premier League's all-time top scorer?",
      options: ["Wayne Rooney", "Andrew Cole", "Alan Shearer", "Thierry Henry"] as [string, string, string, string],
      correctIndex: 2,
    },
    {
      id: "fb-q4",
      question: "Which country hosted the 2022 World Cup?",
      options: ["Saudi Arabia", "UAE", "Qatar", "Bahrain"] as [string, string, string, string],
      correctIndex: 2,
    },
    {
      id: "fb-q5",
      question: "Who scored the fastest hat-trick in Premier League history?",
      options: ["Sadio Mane", "Robbie Fowler", "Alan Shearer", "Michael Owen"] as [string, string, string, string],
      correctIndex: 0,
    },
  ],
};

export const FALLBACK_WHOS_THAT_PUZZLE = {
  answer: {
    player_name: "Mohamed Salah",
    player_id: "Q346551",
    club: "Liverpool",
    league: "Premier League",
    nationality: "Egypt",
    position: "Right Winger",
    birth_year: 1992,
  },
};

// Mixed order so the fallback game has both "higher" and "lower" correct answers
// (a strictly-decreasing chain would teach players the wrong mechanic).
export const FALLBACK_HIGHER_LOWER_PUZZLE = {
  players: [
    { name: "Paul Pogba", context: "Juventus → Man United", statLabel: "Transfer Fee", statType: "transfer_fee", value: 105 },
    { name: "Neymar Jr.", context: "Barcelona → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 222 },
    { name: "Eden Hazard", context: "Chelsea → Real Madrid", statLabel: "Transfer Fee", statType: "transfer_fee", value: 89 },
    { name: "Kylian Mbappé", context: "Monaco → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 180 },
    { name: "Cristiano Ronaldo", context: "Man United → Real Madrid", statLabel: "Transfer Fee", statType: "transfer_fee", value: 94 },
    { name: "Philippe Coutinho", context: "Liverpool → Barcelona", statLabel: "Transfer Fee", statType: "transfer_fee", value: 145 },
    { name: "Virgil van Dijk", context: "Southampton → Liverpool", statLabel: "Transfer Fee", statType: "transfer_fee", value: 84 },
    { name: "João Félix", context: "Benfica → Atlético", statLabel: "Transfer Fee", statType: "transfer_fee", value: 126 },
    { name: "Gareth Bale", context: "Tottenham → Real Madrid", statLabel: "Transfer Fee", statType: "transfer_fee", value: 100 },
    { name: "Antoine Griezmann", context: "Atlético → Barcelona", statLabel: "Transfer Fee", statType: "transfer_fee", value: 120 },
    { name: "Romelu Lukaku", context: "Everton → Man United", statLabel: "Transfer Fee", statType: "transfer_fee", value: 85 },
  ],
};

export const FALLBACK_TOP_TENS_PUZZLE = {
  title: "Top 10 Premier League All-Time Goalscorers",
  category: "Premier League",
  answers: [
    { name: "Alan Shearer", aliases: ["Shearer"], info: "260 goals" },
    { name: "Harry Kane", aliases: ["Kane"], info: "213 goals" },
    { name: "Wayne Rooney", aliases: ["Rooney"], info: "208 goals" },
    { name: "Andy Cole", aliases: ["Andrew Cole", "Cole"], info: "187 goals" },
    { name: "Sergio Agüero", aliases: ["Aguero", "Sergio Aguero"], info: "184 goals" },
    { name: "Frank Lampard", aliases: ["Lampard"], info: "177 goals" },
    { name: "Thierry Henry", aliases: ["Henry"], info: "175 goals" },
    { name: "Mohamed Salah", aliases: ["Salah", "Mo Salah"], info: "169 goals" },
    { name: "Robbie Fowler", aliases: ["Fowler"], info: "163 goals" },
    { name: "Jermain Defoe", aliases: ["Defoe"], info: "162 goals" },
  ],
};

export const FALLBACK_WHO_AM_I_PUZZLE = {
  clues: [
    { number: 1, text: "I came through the youth ranks of a Catalan giant." },
    { number: 2, text: "I've won the Ballon d'Or more times than anyone in history." },
    { number: 3, text: "I left Barcelona on a tearful press conference in 2021." },
    { number: 4, text: "I led my national team to a World Cup in 2022." },
    { number: 5, text: "I was born in Rosario, Argentina, in 1987." },
  ],
  correct_player_name: "Lionel Messi",
  correct_player_id: "Q615",
  fun_fact: "Messi holds the record for most goals scored in a single calendar year (91 in 2012).",
};

export const FALLBACK_LAST_TENS_PUZZLE = {
  title: "Last 10 Premier League Top Scorers (Golden Boot Winners)",
  category: "Premier League",
  answers: [
    { name: "Erling Haaland", aliases: ["Haaland"], info: "2023-24 (27 goals)" },
    { name: "Erling Haaland", aliases: ["Haaland"], info: "2022-23 (36 goals)" },
    { name: "Mohamed Salah", aliases: ["Salah", "Mo Salah"], info: "2021-22 (23 goals)" },
    { name: "Son Heung-min", aliases: ["Son"], info: "2021-22 (23 goals — shared)" },
    { name: "Harry Kane", aliases: ["Kane"], info: "2020-21 (23 goals)" },
    { name: "Jamie Vardy", aliases: ["Vardy"], info: "2019-20 (23 goals)" },
    { name: "Pierre-Emerick Aubameyang", aliases: ["Aubameyang"], info: "2018-19 (22 goals — shared)" },
    { name: "Sadio Mané", aliases: ["Mane", "Sadio Mane"], info: "2018-19 (22 goals — shared)" },
    { name: "Mohamed Salah", aliases: ["Salah", "Mo Salah"], info: "2018-19 (22 goals — shared)" },
    { name: "Mohamed Salah", aliases: ["Salah", "Mo Salah"], info: "2017-18 (32 goals)" },
  ],
};

// Longer chain (8 steps) than the standard Career Path puzzle, which is the
// Pro variant's signature difficulty bump.
export const FALLBACK_CAREER_PATH_PRO_PUZZLE = {
  answer: "Cristiano Ronaldo",
  career_steps: [
    { type: "club" as const, text: "Sporting CP", year: "2002-2003", apps: 25, goals: 5 },
    { type: "club" as const, text: "Manchester United", year: "2003-2009", apps: 196, goals: 84 },
    { type: "club" as const, text: "Real Madrid", year: "2009-2018", apps: 292, goals: 311 },
    { type: "club" as const, text: "Juventus", year: "2018-2021", apps: 98, goals: 81 },
    { type: "club" as const, text: "Manchester United", year: "2021-2022", apps: 41, goals: 18 },
    { type: "club" as const, text: "Al-Nassr", year: "2023-present", apps: 60, goals: 50 },
    { type: "club" as const, text: "Sporting CP Academy", year: "1997-2002" },
    { type: "club" as const, text: "Andorinha (youth)", year: "1992-1995" },
  ],
};

// Liverpool's kit-supplier chronology — 3 entries hidden, 6 visible. Hidden
// brand count must be exactly 0 or 3 (schema invariant).
export const FALLBACK_THE_THREAD_PUZZLE = {
  thread_type: "supplier" as const,
  path: [
    { brand_name: "Umbro", years: "1973-1985", is_hidden: false },
    { brand_name: "Adidas", years: "1985-1996", is_hidden: true },
    { brand_name: "Reebok", years: "1996-2006", is_hidden: false },
    { brand_name: "Adidas", years: "2006-2012", is_hidden: true },
    { brand_name: "Warrior", years: "2012-2015", is_hidden: false },
    { brand_name: "New Balance", years: "2015-2020", is_hidden: false },
    { brand_name: "Nike", years: "2020-", is_hidden: true },
  ],
  correct_club_id: "Q1130849",
  correct_club_name: "Liverpool",
  kit_lore: {
    fun_fact: "Liverpool's 2020 Nike deal followed a public lawsuit with New Balance over a 'matched offer' clause — won by Nike.",
  },
};
