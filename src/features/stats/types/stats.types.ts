/**
 * Type definitions for the My IQ Profile feature.
 *
 * Aggregates performance data across all game modes to calculate
 * a global Football IQ score and per-mode proficiency metrics.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { FieldExperience } from './fieldExperience.types';
import {
  FormGuideEntry,
  StrengthWeaknessAnalysis,
  MonthReport,
  FormationClassificationResult,
  MilestoneInfo,
  BestDayInfo,
  WeakSpotInfo,
} from './scoutReport.types';

// Re-export existing score types for metadata parsing
export { GameScore } from '@/features/career-path/utils/scoring';
export { TransferGuessScore } from '@/features/transfer-guess/utils/transferScoring';
export { GoalscorerRecallScore } from '@/features/goalscorer-recall/types/goalscorerRecall.types';
export { TopicalQuizScore } from '@/features/topical-quiz/types/topicalQuiz.types';

/**
 * Game mode display configuration.
 * Maps internal game_mode values to user-facing labels.
 */
export const GAME_MODE_DISPLAY: Record<
  GameMode,
  { displayName: string; skillName: string }
> = {
  career_path: { displayName: 'Career Path', skillName: 'Deduction' },
  career_path_pro: { displayName: 'Career Path Pro', skillName: 'Expert Deduction' },
  guess_the_transfer: { displayName: 'Transfer Guess', skillName: 'Market Knowledge' },
  guess_the_goalscorers: { displayName: 'Goalscorer Recall', skillName: 'Rapid Recall' },
  the_grid: { displayName: 'The Grid (beta)', skillName: 'Pattern Recognition' },
  the_chain: { displayName: 'The Chain', skillName: 'Connection Master' },
  the_thread: { displayName: 'Threads', skillName: 'Kit Historian' },
  topical_quiz: { displayName: 'Topical Quiz', skillName: 'Current Affairs' },
  top_tens: { displayName: 'Top Tens', skillName: 'Deep Knowledge' },
  starting_xi: { displayName: 'Starting XI', skillName: 'Squad Recall' },
  connections: { displayName: 'Connections', skillName: 'Group Recognition' },
  timeline: { displayName: 'Timeline', skillName: 'Chronological Memory' },
  who_am_i: { displayName: 'Who Am I?', skillName: 'Player Knowledge' },
};

/**
 * Weights for Global IQ calculation.
 * Career Path and Transfer Guess are weighted higher as flagship modes.
 * Total: 100%
 */
export const IQ_WEIGHTS: Record<GameMode, number> = {
  career_path: 0.12, // 12% - flagship mode
  career_path_pro: 0.09, // 9% - premium flagship
  guess_the_transfer: 0.12, // 12% - flagship mode
  guess_the_goalscorers: 0.10, // 10%
  the_grid: 0.10, // 10%
  the_chain: 0.09, // 9%
  the_thread: 0.08, // 8% - kit history mode
  topical_quiz: 0.09, // 9%
  top_tens: 0.11, // 11% - premium mode
  starting_xi: 0.08, // 8%
  connections: 0.02, // 2% - new mode, low weight initially
  timeline: 0.02, // 2% - new mode, low weight initially
  who_am_i: 0.02, // 2% - new mode, low weight initially
};

/**
 * Detailed stats for a single game mode.
 * Used in the MODE BREAKDOWN section of the Scout Report.
 */
export interface DetailedModeStats {
  /** The game mode identifier */
  gameMode: GameMode;
  /** User-facing mode name (e.g., "Career Path") */
  displayName: string;
  /** Skill name (e.g., "Deduction") */
  skillName: string;
  /** Total games played in this mode */
  gamesPlayed: number;
  /** Average normalized accuracy (0-100) */
  accuracyPercent: number;
  /** Highest raw score achieved */
  bestScore: number;
  /** Sum of all raw scores from this mode */
  totalPoints: number;
  /** Count of perfect scores */
  perfectScores: number;
}

/**
 * Proficiency data for a single game mode.
 */
export interface GameProficiency {
  /** The game mode identifier */
  gameMode: GameMode;
  /** User-facing skill name (e.g., "Deduction") */
  displayName: string;
  /** Normalized proficiency percentage (0-100) */
  percentage: number;
  /** Total games played in this mode */
  gamesPlayed: number;
  /** Count of perfect scores achieved */
  perfectScores: number;
}

/**
 * Badge earned by the user.
 */
export interface Badge {
  /** Unique badge identifier */
  id: string;
  /** Display name for the badge */
  name: string;
  /** Description of how to earn the badge */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** ISO date when earned, or null if not yet earned */
  earnedAt: string | null;
}

/**
 * Badge definition with earn criteria.
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * All available badges in the Trophy Room.
 * Ordered by logical unlock progression: milestone badges first, then perfect score badges.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'games_10',
    name: 'Getting Started',
    description: 'Completed 10 puzzles',
    icon: 'Award',
  },
  {
    id: 'games_50',
    name: 'Dedicated Fan',
    description: 'Completed 50 puzzles',
    icon: 'Trophy',
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Played 7 days in a row',
    icon: 'Flame',
  },
  {
    id: 'perfect_career',
    name: 'Detective',
    description: 'Perfect score on Career Path',
    icon: 'Search',
  },
  {
    id: 'perfect_transfer',
    name: 'Scout',
    description: 'Perfect score on Transfer Guess',
    icon: 'DollarSign',
  },
  {
    id: 'perfect_goalscorer',
    name: 'Historian',
    description: '100% on Goalscorer Recall',
    icon: 'Clock',
  },
  {
    id: 'perfect_grid',
    name: 'Mastermind',
    description: 'Complete The Grid perfectly',
    icon: 'Grid3X3',
  },
  {
    id: 'perfect_quiz',
    name: 'Pundit',
    description: 'Perfect score on Topical Quiz',
    icon: 'MessageCircle',
  },
];

/**
 * Complete performance statistics for the My IQ screen.
 */
export interface PerformanceStats {
  /** Global Football IQ score (0-100) */
  globalIQ: number;
  /** Proficiency data for each game mode */
  proficiencies: GameProficiency[];
  /** Total puzzles completed across all modes */
  totalPuzzlesSolved: number;
  /** Total perfect scores across all modes */
  totalPerfectScores: number;
  /** Sum of all points earned */
  totalPoints: number;
  /** Current consecutive day streak */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Earned badges */
  badges: Badge[];
  /** Field Experience: per-mode completion counts */
  fieldExperience: FieldExperience;
  /** Detailed per-mode statistics for MODE BREAKDOWN section */
  detailedModeStats: DetailedModeStats[];

  // ─── Scout Report Upgrade Fields ─────────────────────────────

  /** Last 10 completed attempts as form guide (W-D-L style) */
  formGuide: FormGuideEntry[];
  /** Signature strength and achilles heel analysis */
  strengthWeakness: StrengthWeaknessAnalysis | null;
  /** Generated scouting verdict text (4 sentences, displayed on screen) */
  scoutingVerdict: string;
  /** Short scouting verdict (2 sentences, for share card) */
  shortVerdict: string;
  /** Current calendar month summary */
  thisMonthReport: MonthReport;
  /** Knowledge map formation classification */
  formationClassification: FormationClassificationResult;
  /** Next closest milestone to unlock */
  nextMilestone: MilestoneInfo | null;
  /** Best single-day performance record */
  bestDay: BestDayInfo | null;
  /** Weakest game mode for CTA */
  weakSpotMode: WeakSpotInfo | null;
}

/**
 * Return type for usePerformanceStats hook.
 */
export interface UsePerformanceStatsResult {
  /** Performance statistics or null if loading */
  stats: PerformanceStats | null;
  /** Whether data is being fetched */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refresh data from database */
  refresh: () => Promise<void>;
}
