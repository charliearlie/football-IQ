/**
 * The Thread Game Types
 *
 * Type definitions for The Thread game mode where players
 * guess a football club from a chronological list of kit sponsors or suppliers.
 */

import { UnifiedClub } from "@/services/club/types";

// Re-export scoring types for convenience
export type { ThreadScore } from "../utils/scoring";

// =============================================================================
// CONTENT TYPES (mirror CMS schema from web/lib/schemas/puzzle-schemas.ts)
// =============================================================================

/**
 * Thread type - sponsor (shirt sponsor) or supplier (kit manufacturer)
 */
export type ThreadType = "sponsor" | "supplier";

/**
 * A brand entry in the thread path
 */
export interface ThreadBrand {
  /** Brand/company name (e.g., "Nike", "Sharp") */
  brand_name: string;
  /** Year range in format YYYY-YYYY or YYYY- (ongoing) */
  years: string;
  /** Whether this brand is hidden at start (player must reveal as a hint) */
  is_hidden?: boolean;
}

/**
 * Kit lore - fun fact revealed after game ends
 */
export interface KitLore {
  /** Interesting historical fact about the kit sponsorship */
  fun_fact: string;
}

/**
 * The Thread puzzle content structure
 * Mirrors web/lib/schemas/puzzle-schemas.ts TheThreadContent
 */
export interface TheThreadContent {
  /** Whether this is a sponsor or kit supplier thread */
  thread_type: ThreadType;
  /** Chronological list of brands (minimum 3) */
  path: ThreadBrand[];
  /** Wikidata QID for the correct club (e.g., "Q18656") */
  correct_club_id: string;
  /** Club name for fallback validation */
  correct_club_name: string;
  /** Fun fact revealed after game ends */
  kit_lore: KitLore;
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

/**
 * Game status values
 */
export type ThreadGameStatus = "playing" | "won" | "lost" | "revealed";

/**
 * The Thread game state
 */
export interface TheThreadState {
  /** Array of guesses made (UnifiedClub objects from club search) */
  guesses: UnifiedClub[];
  /** Current game status */
  gameStatus: ThreadGameStatus;
  /** Score when game ends (null while playing) */
  score: import("../utils/scoring").ThreadScore | null;
  /** Whether the last guess was incorrect (for shake animation) */
  lastGuessIncorrect: boolean;
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved to local DB */
  attemptSaved: boolean;
  /** Timestamp when game started (ISO string) */
  startedAt: string | null;
  /** Number of hidden brands the player has revealed (0-3) */
  hintsRevealed: number;
}

/**
 * Payload for restoring progress from saved attempt
 */
export interface ThreadRestorePayload {
  /** Restored guesses */
  guesses: UnifiedClub[];
  /** Restored attempt ID */
  attemptId: string;
  /** Restored start timestamp */
  startedAt: string;
  /** Restored hint count (optional for backwards compat with old saves) */
  hintsRevealed?: number;
}

/**
 * Actions for The Thread game reducer
 */
export type TheThreadAction =
  | { type: "SUBMIT_GUESS"; payload: { club: UnifiedClub; isCorrect: boolean } }
  | { type: "GIVE_UP" }
  | { type: "REVEAL_HINT" }
  | { type: "CLEAR_SHAKE" }
  | { type: "SET_ATTEMPT_ID"; payload: string }
  | { type: "RESTORE_PROGRESS"; payload: ThreadRestorePayload }
  | { type: "ATTEMPT_SAVED" }
  | { type: "RESET" };

/**
 * Metadata structure saved with The Thread attempts
 */
export interface TheThreadAttemptMetadata {
  /** Guesses made (club IDs and names for serialization) */
  guesses: { id: string; name: string }[];
  /** Number of guesses made */
  guessCount: number;
  /** Whether player won */
  won: boolean;
  /** Whether player gave up */
  gaveUp?: boolean;
  /** Thread type for this puzzle */
  threadType: ThreadType;
  /** Number of hints revealed during this attempt */
  hintsRevealed?: number;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create initial game state
 */
export function createInitialState(): TheThreadState {
  return {
    guesses: [],
    gameStatus: "playing",
    score: null,
    lastGuessIncorrect: false,
    attemptId: null,
    attemptSaved: false,
    startedAt: new Date().toISOString(),
    hintsRevealed: 0,
  };
}

// =============================================================================
// CONTENT PARSING & VALIDATION
// =============================================================================

/**
 * Validate a ThreadBrand object
 */
function isValidThreadBrand(value: unknown): value is ThreadBrand {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.brand_name === "string" &&
    obj.brand_name.length > 0 &&
    typeof obj.years === "string" &&
    obj.years.length > 0 &&
    (obj.is_hidden === undefined || typeof obj.is_hidden === "boolean")
  );
}

/**
 * Validate a KitLore object
 */
function isValidKitLore(value: unknown): value is KitLore {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.fun_fact === "string" && obj.fun_fact.length > 0;
}

/**
 * Parse and validate The Thread content from puzzle JSON
 *
 * @param content - Raw puzzle content
 * @returns Validated TheThreadContent or null if invalid
 */
export function parseTheThreadContent(
  content: unknown
): TheThreadContent | null {
  if (!content || typeof content !== "object") return null;

  const obj = content as Record<string, unknown>;

  // Validate thread_type
  if (obj.thread_type !== "sponsor" && obj.thread_type !== "supplier") {
    return null;
  }

  // Validate path (minimum 3 brands)
  if (!Array.isArray(obj.path) || obj.path.length < 3) {
    return null;
  }
  for (const brand of obj.path) {
    if (!isValidThreadBrand(brand)) return null;
  }

  // Validate correct_club_id
  if (typeof obj.correct_club_id !== "string" || !obj.correct_club_id) {
    return null;
  }

  // Validate correct_club_name
  if (typeof obj.correct_club_name !== "string" || !obj.correct_club_name) {
    return null;
  }

  // Validate kit_lore
  if (!isValidKitLore(obj.kit_lore)) {
    return null;
  }

  return {
    thread_type: obj.thread_type as ThreadType,
    path: obj.path as ThreadBrand[],
    correct_club_id: obj.correct_club_id,
    correct_club_name: obj.correct_club_name,
    kit_lore: obj.kit_lore as KitLore,
  };
}
