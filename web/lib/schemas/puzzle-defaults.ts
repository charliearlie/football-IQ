import type { GameMode } from "@/lib/constants";
import type {
  CareerPathContent,
  TransferGuessContent,
  GoalscorerRecallContent,
  TheGridContent,
  TheChainContent,
  TheThreadContent,
  TopicalQuizContent,
  TopTensContent,
  StartingXIContent,
} from "./puzzle-schemas";

// ============================================================================
// DEFAULT VALUES FOR EACH GAME MODE
// ============================================================================

export function getCareerPathDefaults(): CareerPathContent {
  return {
    answer: "",
    career_steps: [
      { type: "club", text: "", year: "", apps: null, goals: null },
      { type: "club", text: "", year: "", apps: null, goals: null },
      { type: "club", text: "", year: "", apps: null, goals: null },
    ],
  };
}

export function getTransferGuessDefaults(): TransferGuessContent {
  return {
    answer: "",
    from_club: "",
    to_club: "",
    fee: "",
    hints: ["", "", ""],
  };
}

export function getGoalscorerRecallDefaults(): GoalscorerRecallContent {
  return {
    home_team: "",
    away_team: "",
    home_score: 0,
    away_score: 0,
    competition: "",
    match_date: "",
    goals: [
      { scorer: "", minute: 1, team: "home", isOwnGoal: false },
    ],
  };
}

export function getTheGridDefaults(): TheGridContent {
  return {
    xAxis: [
      { type: "club", value: "" },
      { type: "club", value: "" },
      { type: "club", value: "" },
    ],
    yAxis: [
      { type: "nation", value: "" },
      { type: "nation", value: "" },
      { type: "nation", value: "" },
    ],
    valid_answers: {
      "0": [],
      "1": [],
      "2": [],
      "3": [],
      "4": [],
      "5": [],
      "6": [],
      "7": [],
      "8": [],
    },
  };
}

export function getTheChainDefaults(): TheChainContent {
  return {
    start_player: { qid: "", name: "", nationality_code: undefined },
    end_player: { qid: "", name: "", nationality_code: undefined },
    par: 5,
    solution_path: undefined,
    hint_player: undefined,
  };
}

export function getTheThreadDefaults(): TheThreadContent {
  return {
    thread_type: "sponsor",
    path: [
      { brand_name: "", years: "", is_hidden: false },
      { brand_name: "", years: "", is_hidden: false },
      { brand_name: "", years: "", is_hidden: false },
    ],
    correct_club_id: "",
    correct_club_name: "",
    kit_lore: { fun_fact: "" },
  };
}

export function getTopicalQuizDefaults(): TopicalQuizContent {
  return {
    questions: [
      { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctIndex: 0, imageUrl: "" },
      { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctIndex: 0, imageUrl: "" },
      { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctIndex: 0, imageUrl: "" },
      { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctIndex: 0, imageUrl: "" },
      { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctIndex: 0, imageUrl: "" },
    ],
  };
}

export function getTopTensDefaults(): TopTensContent {
  return {
    title: "",
    category: "",
    answers: Array.from({ length: 10 }, () => ({
      name: "",
      aliases: [],
      info: "",
    })),
  };
}

export function getStartingXIDefaults(): StartingXIContent {
  // Default 4-3-3 formation
  return {
    match_name: "",
    competition: "",
    match_date: "",
    formation: "4-3-3",
    team: "",
    players: [
      { position_key: "GK", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "RB", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "RCB", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "LCB", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "LB", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "RCM", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "CM", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "LCM", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "RW", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "ST", player_name: "", is_hidden: false, override_x: null, override_y: null },
      { position_key: "LW", player_name: "", is_hidden: false, override_x: null, override_y: null },
    ],
  };
}

// ============================================================================
// DEFAULT VALUES MAP
// ============================================================================

export const defaultValuesMap: Record<GameMode, () => unknown> = {
  career_path: getCareerPathDefaults,
  career_path_pro: getCareerPathDefaults,
  the_grid: getTheGridDefaults,
  the_chain: getTheChainDefaults,
  the_thread: getTheThreadDefaults,
  guess_the_transfer: getTransferGuessDefaults,
  guess_the_goalscorers: getGoalscorerRecallDefaults,
  topical_quiz: getTopicalQuizDefaults,
  top_tens: getTopTensDefaults,
  starting_xi: getStartingXIDefaults,
};

export function getDefaultContent(gameMode: GameMode): unknown {
  const factory = defaultValuesMap[gameMode];
  return factory();
}

// ============================================================================
// FORMATION POSITION MAPPINGS
// ============================================================================

export const FORMATION_POSITIONS: Record<string, string[]> = {
  "4-3-3": ["GK", "RB", "RCB", "LCB", "LB", "RCM", "CM", "LCM", "RW", "ST", "LW"],
  "4-2-3-1": ["GK", "RB", "RCB", "LCB", "LB", "RCDM", "LCDM", "RCAM", "CAM", "LCAM", "ST"],
  "4-4-2": ["GK", "RB", "RCB", "LCB", "LB", "RM", "RCM", "LCM", "LM", "RST", "LST"],
  "4-4-1-1": ["GK", "RB", "RCB", "LCB", "LB", "RM", "RCM", "LCM", "LM", "CAM", "ST"],
  "3-5-2": ["GK", "RCB", "CB", "LCB", "RWB", "RCM", "CDM", "LCM", "LWB", "RST", "LST"],
  "3-4-3": ["GK", "RCB", "CB", "LCB", "RM", "RCM", "LCM", "LM", "RW", "ST", "LW"],
  "5-3-2": ["GK", "RWB", "RCB", "CB", "LCB", "LWB", "RCM", "CM", "LCM", "RST", "LST"],
  "5-4-1": ["GK", "RWB", "RCB", "CB", "LCB", "LWB", "RM", "RCM", "LCM", "LM", "ST"],
  "4-1-4-1": ["GK", "RB", "RCB", "LCB", "LB", "CDM", "RM", "RCM", "LCM", "LM", "ST"],
  "4-3-2-1": ["GK", "RB", "RCB", "LCB", "LB", "RCM", "CM", "LCM", "RCAM", "LCAM", "ST"],
};

// Helper to get positions for a formation
export function getFormationPositions(formation: string): string[] {
  return FORMATION_POSITIONS[formation] || FORMATION_POSITIONS["4-3-3"];
}

// Helper to generate default players for a formation
export function getDefaultPlayersForFormation(formation: string): StartingXIContent["players"] {
  const positions = getFormationPositions(formation);
  return positions.map((pos) => ({
    position_key: pos as StartingXIContent["players"][0]["position_key"],
    player_name: "",
    is_hidden: false,
    override_x: null,
    override_y: null,
  }));
}
