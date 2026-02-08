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

/**
 * Formation-specific coordinates for all positions.
 * Mirrors the mobile app's FORMATION_COORDS exactly.
 * Each formation defines exact x,y coordinates for its 11 positions.
 */
export const FORMATION_COORDS: Record<string, Array<{ key: string; x: number; y: number }>> = {
  "4-3-3": [
    { key: "GK", x: 50, y: 90 },
    { key: "RB", x: 85, y: 75 },
    { key: "RCB", x: 65, y: 78 },
    { key: "LCB", x: 35, y: 78 },
    { key: "LB", x: 15, y: 75 },
    { key: "RCM", x: 65, y: 50 },
    { key: "CM", x: 50, y: 50 },
    { key: "LCM", x: 35, y: 50 },
    { key: "RW", x: 82, y: 25 },
    { key: "ST", x: 50, y: 15 },
    { key: "LW", x: 18, y: 25 },
  ],
  "4-2-3-1": [
    { key: "GK", x: 50, y: 90 },
    { key: "RB", x: 85, y: 75 },
    { key: "RCB", x: 65, y: 78 },
    { key: "LCB", x: 35, y: 78 },
    { key: "LB", x: 15, y: 75 },
    { key: "RCDM", x: 60, y: 55 },
    { key: "LCDM", x: 40, y: 55 },
    { key: "RCAM", x: 82, y: 28 },
    { key: "CAM", x: 50, y: 30 },
    { key: "LCAM", x: 18, y: 28 },
    { key: "ST", x: 50, y: 15 },
  ],
  "4-4-2": [
    { key: "GK", x: 50, y: 90 },
    { key: "RB", x: 85, y: 75 },
    { key: "RCB", x: 65, y: 78 },
    { key: "LCB", x: 35, y: 78 },
    { key: "LB", x: 15, y: 75 },
    { key: "RM", x: 85, y: 50 },
    { key: "RCM", x: 60, y: 52 },
    { key: "LCM", x: 40, y: 52 },
    { key: "LM", x: 15, y: 50 },
    { key: "RST", x: 60, y: 18 },
    { key: "LST", x: 40, y: 18 },
  ],
  "4-4-1-1": [
    { key: "GK", x: 50, y: 90 },
    { key: "RB", x: 85, y: 75 },
    { key: "RCB", x: 65, y: 78 },
    { key: "LCB", x: 35, y: 78 },
    { key: "LB", x: 15, y: 75 },
    { key: "RM", x: 85, y: 50 },
    { key: "RCM", x: 60, y: 52 },
    { key: "LCM", x: 40, y: 52 },
    { key: "LM", x: 15, y: 50 },
    { key: "CAM", x: 50, y: 35 },
    { key: "ST", x: 50, y: 18 },
  ],
  "3-5-2": [
    { key: "GK", x: 50, y: 90 },
    { key: "RCB", x: 68, y: 78 },
    { key: "CB", x: 50, y: 78 },
    { key: "LCB", x: 32, y: 78 },
    { key: "RWB", x: 88, y: 58 },
    { key: "RCM", x: 62, y: 50 },
    { key: "CDM", x: 50, y: 55 },
    { key: "LCM", x: 38, y: 50 },
    { key: "LWB", x: 12, y: 58 },
    { key: "RST", x: 60, y: 18 },
    { key: "LST", x: 40, y: 18 },
  ],
  "3-4-3": [
    { key: "GK", x: 50, y: 90 },
    { key: "RCB", x: 68, y: 78 },
    { key: "CB", x: 50, y: 78 },
    { key: "LCB", x: 32, y: 78 },
    { key: "RWB", x: 88, y: 55 },
    { key: "RCM", x: 60, y: 50 },
    { key: "LCM", x: 40, y: 50 },
    { key: "LWB", x: 12, y: 55 },
    { key: "RW", x: 82, y: 25 },
    { key: "ST", x: 50, y: 15 },
    { key: "LW", x: 18, y: 25 },
  ],
  "5-3-2": [
    { key: "GK", x: 50, y: 90 },
    { key: "RWB", x: 88, y: 68 },
    { key: "RCB", x: 68, y: 78 },
    { key: "CB", x: 50, y: 78 },
    { key: "LCB", x: 32, y: 78 },
    { key: "LWB", x: 12, y: 68 },
    { key: "RCM", x: 65, y: 50 },
    { key: "CM", x: 50, y: 50 },
    { key: "LCM", x: 35, y: 50 },
    { key: "RST", x: 60, y: 18 },
    { key: "LST", x: 40, y: 18 },
  ],
  "5-4-1": [
    { key: "GK", x: 50, y: 90 },
    { key: "RWB", x: 88, y: 68 },
    { key: "RCB", x: 68, y: 78 },
    { key: "CB", x: 50, y: 78 },
    { key: "LCB", x: 32, y: 78 },
    { key: "LWB", x: 12, y: 68 },
    { key: "RM", x: 85, y: 50 },
    { key: "RCM", x: 60, y: 52 },
    { key: "LCM", x: 40, y: 52 },
    { key: "LM", x: 15, y: 50 },
    { key: "ST", x: 50, y: 18 },
  ],
  "4-1-4-1": [
    { key: "GK", x: 50, y: 90 },
    { key: "RB", x: 85, y: 75 },
    { key: "RCB", x: 65, y: 78 },
    { key: "LCB", x: 35, y: 78 },
    { key: "LB", x: 15, y: 75 },
    { key: "CDM", x: 50, y: 60 },
    { key: "RM", x: 85, y: 45 },
    { key: "RCM", x: 60, y: 48 },
    { key: "LCM", x: 40, y: 48 },
    { key: "LM", x: 15, y: 45 },
    { key: "ST", x: 50, y: 18 },
  ],
  "4-3-2-1": [
    { key: "GK", x: 50, y: 90 },
    { key: "RB", x: 85, y: 75 },
    { key: "RCB", x: 65, y: 78 },
    { key: "LCB", x: 35, y: 78 },
    { key: "LB", x: 15, y: 75 },
    { key: "RCM", x: 65, y: 52 },
    { key: "CM", x: 50, y: 55 },
    { key: "LCM", x: 35, y: 52 },
    { key: "RCAM", x: 62, y: 35 },
    { key: "LCAM", x: 38, y: 35 },
    { key: "ST", x: 50, y: 18 },
  ],
};

// Helper to get positions for a formation
export function getFormationPositions(formation: string): string[] {
  return FORMATION_POSITIONS[formation] || FORMATION_POSITIONS["4-3-3"];
}

/**
 * Get formation-specific default coordinates for a position.
 * Falls back to a generic position map if formation or position not found.
 */
export function getFormationDefaultCoords(
  formation: string,
  positionKey: string
): { x: number; y: number } {
  const formationCoords = FORMATION_COORDS[formation];
  if (formationCoords) {
    const pos = formationCoords.find((p) => p.key === positionKey);
    if (pos) return { x: pos.x, y: pos.y };
  }
  // Fallback: generic defaults
  const FALLBACK: Record<string, { x: number; y: number }> = {
    GK: { x: 50, y: 90 }, ST: { x: 50, y: 15 }, CF: { x: 50, y: 25 },
  };
  return FALLBACK[positionKey] || { x: 50, y: 50 };
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
