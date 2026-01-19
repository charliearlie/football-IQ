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
 * Scoring tier configuration for progressive scoring games
 */
export interface ScoringTier {
  /** Range description (e.g., "1-2", "9", "10") */
  range: string;
  /** Points awarded for this tier */
  points: number;
  /** Optional label like "Jackpot!" */
  label?: string;
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
  /** Maximum possible points (if applicable) */
  maxPoints?: number;
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
      { text: 'Guess correctly with fewer clues for more points' },
    ],
    scoring: {
      type: 'dynamic',
      description: 'IQ points based on clubs remaining when you guess correctly',
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
      description: 'IQ points based on clubs remaining when you guess correctly',
    },
    icon: require('../../../../assets/images/puzzles/career-path.png'),
    accentColor: colors.cardYellow,
  },

  guess_the_transfer: {
    gameMode: 'guess_the_transfer',
    displayTitle: 'Guess the Transfer',
    goal: 'Name the player from their transfer',
    rules: [
      { text: 'Shows: year, clubs, and fee' },
      { text: 'Hints reveal more intel (costs points)' },
      { text: 'No hints = max points', highlight: 'max points' },
    ],
    scoring: {
      type: 'tiered',
      description: 'Points decrease with each hint revealed',
      maxPoints: 5,
      tiers: [
        { range: '0 hints', points: 5 },
        { range: '1 hint', points: 3 },
        { range: '2 hints', points: 2 },
        { range: '3 hints', points: 1 },
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
      { text: 'Find all scorers for a 3pt bonus!', highlight: '3pt bonus' },
    ],
    scoring: {
      type: 'fixed',
      description: '1 point per scorer + 3 point bonus for all',
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
      description: '1 point per player + 3 point "Perfect XI" bonus',
      maxPoints: 8,
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
      { text: 'Higher ranks are worth more points', highlight: 'Higher ranks' },
    ],
    scoring: {
      type: 'tiered',
      description: 'Progressive points - harder ranks worth more',
      maxPoints: 30,
      tiers: [
        { range: '1-2 correct', points: 1 },
        { range: '3-4 correct', points: 2 },
        { range: '5-6 correct', points: 3 },
        { range: '7-8 correct', points: 4 },
        { range: '9-10 correct', points: 5 },
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
      { text: 'Rarer answers score higher points', highlight: 'Rarer answers' },
    ],
    scoring: {
      type: 'dynamic',
      description: '~11 points per cell based on answer rarity',
      maxPoints: 100,
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
      { text: '2 points per correct answer', highlight: '2 points' },
    ],
    scoring: {
      type: 'fixed',
      description: '2 points per correct answer',
      maxPoints: 10,
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
