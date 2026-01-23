/**
 * Briefing Schedule Constants
 *
 * Static schedule data for the onboarding briefing screen.
 * Displays the weekly fixture schedule to new users.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

export interface BriefingFixture {
  /** Game mode identifier */
  gameMode: GameMode;
  /** Display label for the fixture */
  label: string;
  /** Days when this mode is available */
  days: string;
  /** Whether this is a premium-only mode */
  isPremium: boolean;
}

/**
 * Weekly fixture schedule for the briefing screen.
 * Ordered by frequency (daily first) then by day of week.
 */
export const BRIEFING_FIXTURES: BriefingFixture[] = [
  // Daily Free modes
  {
    gameMode: 'career_path',
    label: 'Career Path',
    days: 'Daily',
    isPremium: false,
  },
  {
    gameMode: 'guess_the_transfer',
    label: 'Transfer Guess',
    days: 'Daily',
    isPremium: false,
  },
  // Daily Premium mode
  {
    gameMode: 'career_path_pro',
    label: 'Career Path Pro',
    days: 'Daily',
    isPremium: true,
  },
  // Weekly Free modes
  {
    gameMode: 'guess_the_goalscorers',
    label: 'Goalscorer Recall',
    days: 'Wed, Sat',
    isPremium: false,
  },
  {
    gameMode: 'starting_xi',
    label: 'Starting XI',
    days: 'Sunday',
    isPremium: false,
  },
  {
    gameMode: 'topical_quiz',
    label: 'Topical Quiz',
    days: 'Fri / Tue',
    isPremium: false,
  },
  // Weekly Premium mode
  {
    gameMode: 'top_tens',
    label: 'Top Tens',
    days: 'Mon, Thu',
    isPremium: true,
  },
];

/**
 * AsyncStorage key for tracking onboarding completion.
 */
export const ONBOARDING_STORAGE_KEY = '@app_onboarding_completed';
