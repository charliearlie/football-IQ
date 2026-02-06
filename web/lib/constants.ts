// Game modes supported by Football IQ
export const GAME_MODES = [
  "career_path",
  "career_path_pro",
  "the_grid",
  "the_chain",
  "guess_the_transfer",
  "guess_the_goalscorers",
  "topical_quiz",
  "top_tens",
  "starting_xi",
] as const;

export type GameMode = (typeof GAME_MODES)[number];

// Display names for game modes
export const GAME_MODE_DISPLAY_NAMES: Record<GameMode, string> = {
  career_path: "Career Path",
  career_path_pro: "Career Path Pro",
  the_grid: "The Grid",
  the_chain: "The Chain",
  guess_the_transfer: "Transfer Guess",
  guess_the_goalscorers: "Goalscorer Recall",
  topical_quiz: "Topical Quiz",
  top_tens: "Top Tens",
  starting_xi: "Starting XI",
};

// Short names for compact display
export const GAME_MODE_SHORT_NAMES: Record<GameMode, string> = {
  career_path: "CP",
  career_path_pro: "CPP",
  the_grid: "TG",
  the_chain: "TC",
  guess_the_transfer: "TR",
  guess_the_goalscorers: "GR",
  topical_quiz: "TQ",
  top_tens: "TT",
  starting_xi: "XI",
};

// Premium-only modes
export const PREMIUM_MODES: GameMode[] = ["career_path_pro", "top_tens"];

// Design tokens (matching mobile app)
export const COLORS = {
  pitchGreen: "#58CC02",
  grassShadow: "#46A302",
  stadiumNavy: "#0F172A",
  floodlight: "#F8FAFC",
  cardYellow: "#FACC15",
  redCard: "#EF4444",
  warningOrange: "#FF4D00",
  amber: "#F59E0B",
} as const;

// Puzzle status values
export const PUZZLE_STATUSES = ["live", "draft", "archived"] as const;
export type PuzzleStatus = (typeof PUZZLE_STATUSES)[number];

// App Store URLs (placeholder - update when app is published)
export const IOS_APP_ID = "footballiq";
export const ANDROID_PACKAGE = "com.footballiq.app";
export const APP_STORE_URL = `https://apps.apple.com/app/${IOS_APP_ID}`;
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

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
