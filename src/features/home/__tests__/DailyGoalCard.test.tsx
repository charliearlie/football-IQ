/**
 * DailyGoalCard Component Tests
 *
 * Tests for the DailyGoalCard component, which shows:
 * - Daily progress ring
 * - Games completed with archive progress bar and percentage
 * - IQ level with animated progress bar
 * - YOUR RANK row with rank number and player count context
 *
 * Covers:
 * - YOUR RANK renders rank when provided
 * - YOUR RANK shows "---" and "Play to rank up" when null
 * - Archive percentage calculation is correct
 * - onPressRank fires when the rank row is pressed
 * - onPressGames fires when the games row is pressed
 * - onPressIQ fires when the IQ row is pressed
 * - Max Level text when iqNextTierName is null
 * - Progress text when iqNextTierName is set
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DailyGoalCard } from '../components/new/DailyGoalCard';

// ── Mocks ─────────────────────────────────────────────────────────────────

// Mock expo-linear-gradient (used inside DailyGoalCard)
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <View style={style}>{children}</View>
    ),
  };
});

// Mock DailyProgressRing (SVG / Animated component; not the subject of these tests)
jest.mock('../components/new/DailyProgressRing', () => ({
  DailyProgressRing: () => null,
}));

jest.mock('lucide-react-native', () => ({
  Flame: () => null,
}));

// home-design theme uses @/theme/typography which is already mocked globally;
// also mock @/theme/home-design so fonts resolve to plain strings.
jest.mock('@/theme/home-design', () => ({
  HOME_COLORS: {
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    pitchGreen: '#2EFC5D',
    cardYellow: '#FACC15',
    textMain: '#FFFFFF',
    textSecondary: 'rgba(248, 250, 252, 0.7)',
  },
  HOME_FONTS: {
    heading: 'System',
    body: 'System',
    stats: 'System',
  },
}));

// ── Default props helper ──────────────────────────────────────────────────

function buildProps(overrides: Partial<React.ComponentProps<typeof DailyGoalCard>> = {}) {
  return {
    percent: 40,
    countString: '2/5',
    isComplete: false,
    gamesCompleted: 150,
    totalGames: 300,
    iqTitle: 'Scout',
    iqProgress: 60,
    iqPointsToNext: 50,
    iqNextTierName: 'Tactical Analyst',
    iqTierColor: '#3B82F6',
    userRank: null,
    totalUsers: null,
    onPressGames: jest.fn(),
    onPressIQ: jest.fn(),
    currentStreak: 5,
    onPressRank: jest.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('DailyGoalCard', () => {
  describe('YOUR RANK section', () => {
    it('displays the formatted rank when userRank is provided', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ userRank: 42, totalUsers: 1500 })} />
      );

      expect(getByText('#42')).toBeTruthy();
    });

    it('displays "of N players" context when rank and totalUsers are provided', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ userRank: 7, totalUsers: 2000 })} />
      );

      expect(getByText('of 2,000 players')).toBeTruthy();
    });

    it('shows "---" when userRank is null', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ userRank: null, totalUsers: null })} />
      );

      expect(getByText('---')).toBeTruthy();
    });

    it('shows "Play to rank up" when userRank is null', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ userRank: null, totalUsers: null })} />
      );

      expect(getByText('Play to rank up')).toBeTruthy();
    });

    it('shows "Play to rank up" when userRank is provided but totalUsers is null', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ userRank: 10, totalUsers: null })} />
      );

      // Context string falls back to 'Play to rank up' when totalUsers is missing
      expect(getByText('Play to rank up')).toBeTruthy();
    });

    it('renders the YOUR RANK label', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps()} />
      );

      expect(getByText('YOUR RANK')).toBeTruthy();
    });

    it('calls onPressRank when the rank row is pressed', () => {
      const onPressRank = jest.fn();
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ userRank: 5, totalUsers: 100, onPressRank })} />
      );

      fireEvent.press(getByText('YOUR RANK'));

      expect(onPressRank).toHaveBeenCalledTimes(1);
    });

    it('formats large rank numbers with locale separators', () => {
      const { getByText } = render(
        <DailyGoalCard
          {...buildProps({ userRank: 1234567, totalUsers: 5000000 })}
        />
      );

      // toLocaleString should produce comma-separated value
      expect(getByText('#1,234,567')).toBeTruthy();
    });
  });

  describe('GAMES COMPLETED section', () => {
    it('renders gamesCompleted and totalGames', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ gamesCompleted: 75, totalGames: 300 })} />
      );

      expect(getByText('75 / 300')).toBeTruthy();
    });

    it('calculates and displays the correct archive percentage', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ gamesCompleted: 150, totalGames: 300 })} />
      );

      expect(getByText('50% of archive complete')).toBeTruthy();
    });

    it('rounds the archive percentage', () => {
      // 1 / 3 * 100 = 33.333... → rounds to 33
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ gamesCompleted: 1, totalGames: 3 })} />
      );

      expect(getByText('33% of archive complete')).toBeTruthy();
    });

    it('shows 0% when totalGames is 0', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ gamesCompleted: 0, totalGames: 0 })} />
      );

      expect(getByText('0% of archive complete')).toBeTruthy();
    });

    it('shows 100% when all games are completed', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ gamesCompleted: 5, totalGames: 5 })} />
      );

      expect(getByText('100% of archive complete')).toBeTruthy();
    });

    it('calls onPressGames when the games row is pressed', () => {
      const onPressGames = jest.fn();
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ onPressGames })} />
      );

      fireEvent.press(getByText('GAMES COMPLETED'));

      expect(onPressGames).toHaveBeenCalledTimes(1);
    });
  });

  describe('IQ LEVEL section', () => {
    it('renders the IQ title', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ iqTitle: 'Head of Analysis' })} />
      );

      expect(getByText('Head of Analysis')).toBeTruthy();
    });

    it('renders progress text showing points to next tier', () => {
      const { getByText } = render(
        <DailyGoalCard
          {...buildProps({
            iqPointsToNext: 75,
            iqNextTierName: 'Tactical Analyst',
          })}
        />
      );

      expect(getByText('75 pts to Tactical Analyst')).toBeTruthy();
    });

    it('renders "Max Level" when iqNextTierName is null', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ iqNextTierName: null })} />
      );

      expect(getByText('Max Level')).toBeTruthy();
    });

    it('formats large iqPointsToNext values with comma separators', () => {
      const { getByText } = render(
        <DailyGoalCard
          {...buildProps({
            iqPointsToNext: 15000,
            iqNextTierName: 'Director of Football',
          })}
        />
      );

      // Values >= 1000 get toLocaleString formatting
      expect(getByText('15,000 pts to Director of Football')).toBeTruthy();
    });

    it('calls onPressIQ when the IQ row is pressed', () => {
      const onPressIQ = jest.fn();
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ onPressIQ })} />
      );

      fireEvent.press(getByText('IQ LEVEL'));

      expect(onPressIQ).toHaveBeenCalledTimes(1);
    });
  });

  describe('Streak display', () => {
    it('renders the streak count when provided', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ currentStreak: 12 })} />
      );
      expect(getByText('12')).toBeTruthy();
      expect(getByText('day streak')).toBeTruthy();
    });

    it('renders zero streak', () => {
      const { getByText } = render(
        <DailyGoalCard {...buildProps({ currentStreak: 0 })} />
      );
      expect(getByText('0')).toBeTruthy();
      expect(getByText('day streak')).toBeTruthy();
    });

    it('does not render streak row when currentStreak is undefined', () => {
      const { queryByText } = render(
        <DailyGoalCard {...buildProps({ currentStreak: undefined })} />
      );
      expect(queryByText('day streak')).toBeNull();
    });
  });
});
