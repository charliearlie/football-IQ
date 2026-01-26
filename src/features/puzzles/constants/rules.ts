/**
 * Game Rules Configuration
 *
 * Centralized "Source of Truth" for all game mode instructions and scoring logic.
 * Used by the onboarding intro screens and in-game help modals.
 */

import { ImageSourcePropType } from 'react-native';
import { GameMode } from '../types/puzzle.types';
import { colors } from '@/theme';

/**
 * 15-tier intelligence hierarchy for IQ Growth display.
 * Used across all game modes to map performance to scouting rank.
 */
export const INTELLIGENCE_TIERS = [
  'Trainee',            // 1
  'Scout',              // 2
  'Senior Scout',       // 3
  'Lead Scout',         // 4
  'Chief Scout',        // 5
  'Regional Director',  // 6
  'Head of Scouting',   // 7
  'Technical Analyst',  // 8
  'Technical Director', // 9
  'Director of Football', // 10
  'Sporting Director',  // 11
  'Football Genius',    // 12
  'World Class',        // 13
  'Legendary',          // 14
  'Hall of Famer',      // 15
] as const;

export type IntelligenceTier = (typeof INTELLIGENCE_TIERS)[number];

/**
 * Scoring tier configuration for progressive scoring games.
 * Labels describe performance level without explicit point values.
 */
export interface ScoringTier {
  /** Range description (e.g., "0 hints", "10 correct") */
  range: string;
  /** Intelligence tier label for this range */
  label: string;
}

/**
 * Rule bullet point for intro screen
 */
export interface RuleBullet {
  /** Rule text */
  text: string;
  /** Optional text to highlight in pitchGreen */
  highlight?: string;
}

/**
 * Scoring mechanism configuration
 */
export interface ScoringConfig {
  /** Type of scoring system */
  type: 'dynamic' | 'tiered' | 'percentage' | 'fixed';
  /** Human-readable description of scoring */
  description: string;
  /** IQ Growth potential label (e.g., "HALL OF FAMER", "LEGENDARY") */
  potentialLabel?: string;
  /** Scoring tiers for tiered scoring type */
  tiers?: ScoringTier[];
}

/**
 * Complete game rules configuration
 */
export interface GameRules {
  /** Game mode identifier */
  gameMode: GameMode;
  /** Display title for the intro screen */
  displayTitle: string;
  /** Short goal description (1 sentence) */
  goal: string;
  /** Bullet-point rules (2-4 items) */
  rules: RuleBullet[];
  /** Scoring mechanism configuration */
  scoring: ScoringConfig;
  /** Path to game icon image (undefined for Lucide icon fallback) */
  icon: ImageSourcePropType | undefined;
  /** Theme accent color for this game */
  accentColor: string;
}

/**
 * Centralized rules map for all game modes.
 * This is the single source of truth for game instructions and scoring.
 */
export const RULES_MAP: Record<GameMode, GameRules> = {
  career_path: {
    gameMode: 'career_path',
    displayTitle: 'Career Path',
    goal: 'Identify the player from their club history',
    rules: [
      { text: 'Clubs revealed one at a time', highlight: 'one at a time' },
      { text: 'Incorrect guesses reveal the next club' },
      { text: 'Guess with fewer clues for higher IQ', highlight: 'higher IQ' },
    ],
    scoring: {
      type: 'dynamic',
      description: 'IQ tier based on clubs remaining when you guess correctly',
      potentialLabel: 'HALL OF FAMER',
    },
    icon: require('../../../../assets/images/puzzles/career-path.png'),
    accentColor: colors.cardYellow,
  },

  career_path_pro: {
    gameMode: 'career_path_pro',
    displayTitle: 'Career Path Pro',
    goal: 'A harder challenge with legendary and obscure players',
    rules: [
      { text: 'Clubs revealed one at a time', highlight: 'one at a time' },
      { text: 'Incorrect guesses reveal the next club' },
      { text: 'Pro puzzles feature legendary and obscure players', highlight: 'legendary and obscure' },
    ],
    scoring: {
      type: 'dynamic',
      description: 'IQ tier based on clubs remaining when you guess correctly',
      potentialLabel: 'HALL OF FAMER',
    },
    icon: require('../../../../assets/images/puzzles/career-path.png'),
    accentColor: colors.cardYellow,
  },

  guess_the_transfer: {
    gameMode: 'guess_the_transfer',
    displayTitle: 'Guess the Transfer',
    goal: 'Name the player from their transfer',
    rules: [
      { text: 'Shows: clubs and fee' },
      { text: 'Hints reveal year, position, nation' },
      { text: 'Fewer hints = higher IQ', highlight: 'higher IQ' },
    ],
    scoring: {
      type: 'tiered',
      description: 'Maximize IQ by solving with fewer hints revealed',
      potentialLabel: 'LEGENDARY',
      tiers: [
        { range: '0 hints', label: 'Legendary' },
        { range: '1 hint', label: 'Director of Football' },
        { range: '2 hints', label: 'Chief Scout' },
        { range: '3 hints', label: 'Scout' },
      ],
    },
    icon: require('../../../../assets/images/puzzles/guess-the-transfer.png'),
    accentColor: colors.pitchGreen,
  },

  guess_the_goalscorers: {
    gameMode: 'guess_the_goalscorers',
    displayTitle: 'Goalscorer Recall',
    goal: 'Name all the goalscorers from a classic match',
    rules: [
      { text: 'You have 60 seconds to name all scorers', highlight: '60 seconds' },
      { text: 'Type a player name and tap Guess' },
      { text: 'Find all scorers for bonus IQ!', highlight: 'bonus IQ' },
    ],
    scoring: {
      type: 'fixed',
      description: 'IQ growth per scorer found, plus bonus for finding all',
      potentialLabel: 'WORLD CLASS',
    },
    icon: require('../../../../assets/images/puzzles/goalscorer-recall.png'),
    accentColor: colors.redCard,
  },

  starting_xi: {
    gameMode: 'starting_xi',
    displayTitle: 'Starting XI',
    goal: 'Find all the missing players in the starting lineup',
    rules: [
      { text: 'Some players are hidden - identify them all' },
      { text: 'Tap a position to guess the player' },
      { text: 'Find all hidden players for the Perfect XI bonus!', highlight: 'Perfect XI bonus' },
    ],
    scoring: {
      type: 'fixed',
      description: 'IQ growth for each player found, plus a Perfect XI bonus',
      potentialLabel: 'WORLD CLASS',
    },
    icon: require('../../../../assets/images/puzzles/starting-xi.png'),
    accentColor: colors.cardYellow,
  },

  top_tens: {
    gameMode: 'top_tens',
    displayTitle: 'Top Tens',
    goal: 'Name all 10 players in the ranking category',
    rules: [
      { text: 'A category is revealed (e.g., Top 10 Premier League scorers)' },
      { text: 'Correct guesses slot into their rank position' },
      { text: 'Find all 10 for Hall of Famer status!', highlight: 'Hall of Famer' },
    ],
    scoring: {
      type: 'tiered',
      description: 'Progressive IQ growth - more correct answers unlock higher ranks',
      potentialLabel: 'HALL OF FAMER',
      tiers: [
        { range: '1-2 correct', label: 'Scout' },
        { range: '3-4 correct', label: 'Chief Scout' },
        { range: '5-6 correct', label: 'Head of Scouting' },
        { range: '7-8 correct', label: 'Director of Football' },
        { range: '9 correct', label: 'World Class' },
        { range: '10 correct', label: 'Hall of Famer' },
      ],
    },
    icon: require('../../../../assets/images/puzzles/top-tens.png'),
    accentColor: colors.pitchGreen,
  },

  the_grid: {
    gameMode: 'the_grid',
    displayTitle: 'The Grid',
    goal: 'Fill the 3x3 grid with players matching each criteria',
    rules: [
      { text: 'Each cell has row AND column criteria to match' },
      { text: 'Search for players who fit both requirements' },
      { text: 'Rarer answers earn higher IQ', highlight: 'higher IQ' },
    ],
    scoring: {
      type: 'dynamic',
      description: 'IQ based on answer rarity - obscure picks earn more',
      potentialLabel: 'HALL OF FAMER',
    },
    icon: undefined, // Uses Grid3X3 Lucide icon as fallback
    accentColor: colors.pitchGreen,
  },

  topical_quiz: {
    gameMode: 'topical_quiz',
    displayTitle: 'Topical Quiz',
    goal: 'Answer 5 multiple choice questions correctly',
    rules: [
      { text: '5 questions on current football topics' },
      { text: 'Each question has 4 answer options' },
      { text: 'Get all 5 correct for maximum IQ!', highlight: 'maximum IQ' },
    ],
    scoring: {
      type: 'fixed',
      description: 'IQ growth for each correct answer',
      potentialLabel: 'FOOTBALL GENIUS',
    },
    icon: require('../../../../assets/images/puzzles/quiz.png'),
    accentColor: colors.cardYellow,
  },
};

/**
 * Get rules for a specific game mode
 */
export function getGameRules(gameMode: GameMode): GameRules {
  return RULES_MAP[gameMode];
}

/**
 * Get display title for a game mode
 */
export function getGameDisplayTitle(gameMode: GameMode): string {
  return RULES_MAP[gameMode].displayTitle;
}

/**
 * Get all game modes that have onboarding
 */
export function getAllGameModes(): GameMode[] {
  return Object.keys(RULES_MAP) as GameMode[];
}
