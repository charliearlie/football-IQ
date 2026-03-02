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
  "starting_xi",
  "connections",
  "timeline",
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
  starting_xi: "Starting XI",
  connections: "Connections",
  timeline: "Timeline",
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
  starting_xi: "XI",
  connections: "CON",
  timeline: "TL",
};

// Premium-only modes — temporarily disabled for outreach
export const PREMIUM_MODES: GameMode[] = []; // Temporarily disabled — all modes free for outreach

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
export const APP_STORE_URL = "https://apps.apple.com/us/app/football-iq-football-trivia/id6757344691";
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

// Web-playable game modes (available on /play)
export interface WebPlayableGame {
  dbMode: GameMode;
  slug: string;
  title: string;
  description: string;
  accentColor: string;
}

export const WEB_PLAYABLE_GAMES: WebPlayableGame[] = [
  {
    dbMode: "career_path",
    slug: "career-path",
    title: "Career Path",
    description: "Guess the player from their career history",
    accentColor: COLORS.pitchGreen,
  },
  {
    dbMode: "guess_the_transfer",
    slug: "transfer-guess",
    title: "Transfer Guess",
    description: "Name the player from a single transfer",
    accentColor: COLORS.cardYellow,
  },
  {
    dbMode: "connections",
    slug: "connections",
    title: "Connections",
    description: "Group 16 players into 4 categories",
    accentColor: "#3B82F6",
  },
  {
    dbMode: "topical_quiz",
    slug: "topical-quiz",
    title: "Topical Quiz",
    description: "5 questions on this week's headlines",
    accentColor: "#FF6B6B",
  },
  {
    dbMode: "timeline",
    slug: "timeline",
    title: "Timeline",
    description: "Sort 6 events into chronological order",
    accentColor: COLORS.amber,
  },
];

// App-only modes shown as teasers in the /play hub
export const APP_ONLY_GAMES: { title: string; description: string }[] = [
  { title: "Top Tens", description: "Guess the top 10 in each category" },
  { title: "Career Path Pro", description: "Expert mode — fewer clues, harder players" },
  { title: "The Grid", description: "Fill the 3x3 grid matching criteria" },
  { title: "The Chain", description: "Link players through shared clubs" },
  { title: "Threads", description: "Identify the club from kit history" },
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
