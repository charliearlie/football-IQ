/**
 * Scouting Verdict Template Engine
 *
 * Generates a deterministic 4-sentence "scouting report verdict" paragraph
 * from template fragment pools. No LLM involved — selection is driven by
 * `totalGames % pool.length` so the same stats always produce the same text,
 * only rotating when new games are played.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import {
  VerdictInput,
  FormationClassification,
  StreakCategory,
  Trajectory,
} from '../types/scoutReport.types';
import { GAME_MODE_DISPLAY } from '../types/stats.types';

// ─── Internal Types ───────────────────────────────────────────────────────────

type TierBucket = 'high' | 'mid' | 'low';
type PerfectBucket = 'high' | 'low';
type OpeningKey = `${FormationClassification}_${TierBucket}`;
type SummaryKey = `${StreakCategory}_${PerfectBucket}`;

// ─── Fragment Pools ───────────────────────────────────────────────────────────

const OPENING_FRAGMENTS: Record<OpeningKey, string[]> = {
  'Total Football_high': [
    'The complete football brain — versatile, consistent, and relentless.',
    'A supremely well-rounded analyst who reads the game from every angle.',
  ],
  'Total Football_mid': [
    'A solid all-rounder building depth across every discipline.',
    'Developing into a genuinely versatile football mind.',
  ],
  'Total Football_low': [
    'Showing early signs of an all-round football education.',
  ],
  'The Scout_high': [
    'An elite talent spotter with an unerring eye for player potential.',
    'Reads careers and transfer markets like a seasoned DOF.',
  ],
  'The Scout_mid': [
    'A keen eye for player paths and market movements.',
    'Growing into a proper scouting mind.',
  ],
  'The Scout_low': [
    'Starting to develop an instinct for spotting talent.',
  ],
  'The Pundit_high': [
    "An encyclopaedic knowledge of football's facts, records, and history.",
    'The kind of brain that wins pub quizzes before the second round.',
  ],
  'The Pundit_mid': [
    'Building an impressive football knowledge base.',
    'Increasingly dangerous when facts are on the table.',
  ],
  'The Pundit_low': [
    'The foundations of deep football knowledge are forming.',
  ],
  'The Specialist_high': [
    'Absolutely devastating in their area of expertise.',
    'A true master of their craft — world class in what they know.',
  ],
  'The Specialist_mid': [
    'Developing serious depth in their chosen discipline.',
  ],
  'The Specialist_low': [
    'Finding their niche in the football knowledge world.',
  ],
};

const STRENGTH_FRAGMENTS: Record<GameMode, string[]> = {
  career_path: [
    'Reads a career trajectory like a seasoned chief scout.',
    'Can trace a player\'s journey from youth academy to retirement.',
  ],
  career_path_pro: [
    'Handles the deep cuts that separate good scouts from great ones.',
  ],
  guess_the_transfer: [
    'Has an encyclopaedic knowledge of the transfer market.',
    'Thrives when the window opens — a true market insider.',
  ],
  guess_the_goalscorers: [
    'Knows every big-game goalscorer from memory.',
    'Has an instinct for who finds the back of the net.',
  ],
  the_grid: [
    'Finds the overlap between clubs and players like nobody else.',
  ],
  the_chain: [
    'Links players together with the precision of a transfer broker.',
  ],
  the_thread: [
    'A walking archive of football shirt history.',
  ],
  topical_quiz: [
    'Always first to know the latest football headlines.',
    'Current affairs is their bread and butter.',
  ],
  top_tens: [
    "Deep knowledge of football's greatest — a true historian.",
    'Rankings and records are second nature.',
  ],
  starting_xi: [
    'Can recall any starting lineup from memory.',
  ],
  connections: [
    'Spots hidden patterns that others miss entirely.',
  ],
  timeline: [
    'Has an innate sense of when football history happened.',
  ],
  who_am_i: [
    'Identifies players from the smallest of clues.',
    'Reads between the lines to uncover the mystery player.',
  ],
};

/** Opportunity fragments may contain a `{weaknessDisplay}` placeholder. */
const OPPORTUNITY_FRAGMENTS: Record<Trajectory, string[]> = {
  improving: [
    'Recent form suggests the gaps are closing fast.',
    'The upward trajectory is clear — watch this space.',
    'Improving week on week with no sign of slowing down.',
  ],
  declining: [
    'A dip in recent form, but the fundamentals are strong.',
    "Going through a rough patch, but quality doesn't disappear overnight.",
  ],
  stable: [
    'Consistent across the board, with room to grow in {weaknessDisplay}.',
    'Solid and reliable, though {weaknessDisplay} remains an area to develop.',
  ],
};

const SUMMARY_FRAGMENTS: Record<SummaryKey, string[]> = {
  high_high: [
    'Currently in the form of their life. A genuine contender for the top.',
    'On fire right now — consistency and quality in equal measure.',
  ],
  high_low: [
    'The dedication is undeniable. Perfect scores will come with time.',
  ],
  medium_high: [
    'Capable of brilliance when it matters most.',
    'Flashes of excellence that hint at what\'s to come.',
  ],
  medium_low: [
    'Building match fitness. The best is yet to come.',
  ],
  low_high: [
    'Quality over quantity — when they play, they play well.',
  ],
  low_low: [
    'The foundations are set. Needs match fitness to reach the next level.',
    'Early days, but the potential is there.',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickFragment(pool: string[], totalGames: number): string {
  return pool[totalGames % pool.length];
}

function getTierBucket(tierNumber: number): TierBucket {
  if (tierNumber >= 7) return 'high';
  if (tierNumber >= 4) return 'mid';
  return 'low';
}

function getPerfectBucket(perfectRate: number): PerfectBucket {
  return perfectRate > 15 ? 'high' : 'low';
}

function resolveWeaknessDisplay(weaknessMode: GameMode | null): string {
  if (weaknessMode === null) return 'weaker areas';
  return GAME_MODE_DISPLAY[weaknessMode].displayName;
}

// ─── Fragment Builders ────────────────────────────────────────────────────────

function buildOpening(input: VerdictInput): string {
  const tierBucket = getTierBucket(input.tier.tier);
  const key: OpeningKey = `${input.formationLabel}_${tierBucket}`;
  const pool = OPENING_FRAGMENTS[key];
  return pickFragment(pool, input.totalGames);
}

function buildStrength(input: VerdictInput): string {
  const mode = input.dominantMode ?? input.strengthMode;
  if (mode === null) {
    return 'A broad knowledge base that covers the full width of the pitch.';
  }
  const pool = STRENGTH_FRAGMENTS[mode];
  return pickFragment(pool, input.totalGames);
}

function buildOpportunity(input: VerdictInput): string {
  const pool = OPPORTUNITY_FRAGMENTS[input.trajectory];
  const raw = pickFragment(pool, input.totalGames);
  const weaknessDisplay = resolveWeaknessDisplay(input.weaknessMode);
  return raw.replace('{weaknessDisplay}', weaknessDisplay);
}

function buildSummary(input: VerdictInput): string {
  const perfectBucket = getPerfectBucket(input.perfectRate);
  const key: SummaryKey = `${input.streakCategory}_${perfectBucket}`;
  const pool = SUMMARY_FRAGMENTS[key];
  return pickFragment(pool, input.totalGames);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full 4-sentence scouting verdict from the provided stats input.
 *
 * The selection is deterministic: the same `VerdictInput` always returns the
 * same string. The verdict only changes when `totalGames` increments.
 */
export function generateScoutingVerdict(input: VerdictInput): string {
  const opening = buildOpening(input);
  const strength = buildStrength(input);
  const opportunity = buildOpportunity(input);
  const summary = buildSummary(input);

  return `${opening} ${strength} ${opportunity} ${summary}`;
}

/**
 * Generate a condensed 2-sentence verdict for use on share cards.
 *
 * Returns only the opening (formation + tier) and summary (streak + perfect
 * rate) sentences, keeping the share card tight and punchy.
 */
export function generateShortVerdict(input: VerdictInput): string {
  const opening = buildOpening(input);
  const summary = buildSummary(input);

  return `${opening} ${summary}`;
}
