// web/lib/higher-lower/content.ts
import type { HigherLowerEntry, StatType, TransferPair } from "./types";

const VALID_STAT_TYPES: Set<string> = new Set([
  "transfer_fee",
  "league_appearances",
  "international_caps",
  "goals",
  "assists",
  "clean_sheets",
]);

function isValidStatType(value: unknown): value is StatType {
  return typeof value === "string" && VALID_STAT_TYPES.has(value);
}

/**
 * Normalise a raw entry to HigherLowerEntry.
 * Accepts the new shape (context/statLabel/statType/value) or legacy shape (club/fee).
 * Unknown statType values are coerced to "transfer_fee".
 */
function normalizeEntry(value: unknown): HigherLowerEntry | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.length === 0) return null;

  // New format: has context + value
  if (typeof obj.context === "string" && typeof obj.value === "number") {
    return {
      name: obj.name,
      context: obj.context,
      statLabel: typeof obj.statLabel === "string" ? obj.statLabel : "Transfer Fee",
      statType: isValidStatType(obj.statType) ? obj.statType : "transfer_fee",
      value: obj.value,
    };
  }

  // Legacy format: has club + fee → normalise
  if (
    typeof obj.club === "string" &&
    obj.club.length > 0 &&
    typeof obj.fee === "number" &&
    obj.fee >= 0
  ) {
    return {
      name: obj.name,
      context: obj.club,
      statLabel: "Transfer Fee",
      statType: "transfer_fee",
      value: obj.fee,
    };
  }

  return null;
}

function normalizePair(value: unknown): TransferPair | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const player1 = normalizeEntry(obj.player1);
  const player2 = normalizeEntry(obj.player2);
  if (!player1 || !player2) return null;
  return { player1, player2 };
}

export interface ParsedHigherLowerContent {
  pairs: TransferPair[];
}

/**
 * Parse and normalise Higher/Lower puzzle content into a uniform pairs array.
 *
 * Supports:
 * - Chain format (`players: HigherLowerEntry[]`) — round N compares players[N] vs players[N+1]
 * - Pairs format (`pairs: TransferPair[]`) — explicit independent pairs
 * - Both new (context/statLabel/statType/value) and legacy (club/fee) entry shapes
 *
 * Returns null if input is malformed.
 */
export function parseHigherLowerContent(content: unknown): ParsedHigherLowerContent | null {
  if (!content || typeof content !== "object") return null;
  const obj = content as Record<string, unknown>;

  // Chain format
  if (Array.isArray(obj.players) && obj.players.length >= 2) {
    const players: HigherLowerEntry[] = [];
    for (const raw of obj.players) {
      const entry = normalizeEntry(raw);
      if (!entry) return null;
      players.push(entry);
    }
    const pairs: TransferPair[] = [];
    for (let i = 0; i < players.length - 1; i++) {
      pairs.push({ player1: players[i], player2: players[i + 1] });
    }
    return { pairs };
  }

  // Pairs format
  if (!Array.isArray(obj.pairs) || obj.pairs.length < 1) {
    return null;
  }
  const pairs: TransferPair[] = [];
  for (const raw of obj.pairs) {
    const pair = normalizePair(raw);
    if (!pair) return null;
    pairs.push(pair);
  }
  return { pairs };
}
