/**
 * Leaderboard UI Component Tests
 *
 * TDD tests for leaderboard UI components:
 * - LeaderboardToggle (Daily/All-Time switching)
 * - LeaderboardList (entries display)
 * - LeaderboardEntry (individual row)
 * - StickyMeBar (current user bar)
 * - Loading and empty states
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeaderboardToggle } from '../components/LeaderboardToggle';
import { LeaderboardEntry } from '../components/LeaderboardEntry';
import { LeaderboardList } from '../components/LeaderboardList';
import { StickyMeBar } from '../components/StickyMeBar';
import { LeaderboardEmptyState } from '../components/LeaderboardEmptyState';
import { LeaderboardEntry as EntryType, UserRank } from '../types/leaderboard.types';

// Mock theme
jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    cardYellow: '#FACC15',
    textSecondary: 'rgba(248, 250, 252, 0.7)',
  },
  textStyles: {
    h2: { fontSize: 24, fontFamily: 'BebasNeue-Regular' },
    body: { fontSize: 16, fontFamily: 'Montserrat', fontWeight: '400' },
    bodySmall: { fontSize: 14, fontFamily: 'Montserrat', fontWeight: '400' },
    caption: { fontSize: 12, fontFamily: 'Montserrat', fontWeight: '400' },
  },
  fonts: {
    headline: 'BebasNeue-Regular',
    body: 'Montserrat',
    subheading: 'Montserrat',
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
}));

// Mock GlassCard
jest.mock('@/components/GlassCard', () => {
  const { View } = require('react-native');
  return {
    GlassCard: ({ children, testID, style }: { children: React.ReactNode; testID?: string; style?: object }) => (
      <View testID={testID} style={style}>{children}</View>
    ),
  };
});

// Mock icons
jest.mock('lucide-react-native', () => ({
  Trophy: () => null,
  Medal: () => null,
  User: () => null,
  Calendar: () => null,
  TrendingUp: () => null,
  Clock: () => null,
  AlertCircle: () => null,
}));

// Helper to create mock entries
function createMockEntry(overrides: Partial<EntryType> = {}): EntryType {
  return {
    rank: 1,
    userId: 'user-1',
    displayName: 'Test User',
    avatarUrl: null,
    score: 100,
    gamesPlayed: 5,
    ...overrides,
  };
}

describe('LeaderboardUI', () => {
  describe('LeaderboardToggle', () => {
    it('renders Daily and All-Time options', () => {
      const { getByText } = render(
        <LeaderboardToggle selected="daily" onSelect={() => {}} />
      );

      expect(getByText('Daily')).toBeTruthy();
      expect(getByText('All-Time')).toBeTruthy();
    });

    it('highlights selected option', () => {
      const { getByTestId } = render(
        <LeaderboardToggle
          selected="daily"
          onSelect={() => {}}
          testID="toggle"
        />
      );

      const dailyChip = getByTestId('toggle-daily');
      const globalChip = getByTestId('toggle-global');

      // Daily should be selected (has selected style)
      expect(dailyChip.props.accessibilityState?.selected).toBe(true);
      expect(globalChip.props.accessibilityState?.selected).toBe(false);
    });

    it('calls onSelect when option is tapped', () => {
      const onSelect = jest.fn();
      const { getByTestId } = render(
        <LeaderboardToggle
          selected="daily"
          onSelect={onSelect}
          testID="toggle"
        />
      );

      fireEvent.press(getByTestId('toggle-global'));

      expect(onSelect).toHaveBeenCalledWith('global');
    });

    it('switches selection when tapped', () => {
      const onSelect = jest.fn();
      const { getByTestId, rerender } = render(
        <LeaderboardToggle
          selected="daily"
          onSelect={onSelect}
          testID="toggle"
        />
      );

      fireEvent.press(getByTestId('toggle-global'));
      expect(onSelect).toHaveBeenCalledWith('global');

      // Re-render with new selection
      rerender(
        <LeaderboardToggle
          selected="global"
          onSelect={onSelect}
          testID="toggle"
        />
      );

      const globalChip = getByTestId('toggle-global');
      expect(globalChip.props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('LeaderboardEntry', () => {
    it('renders rank, name, and score', () => {
      const entry = createMockEntry({
        rank: 5,
        displayName: 'John Doe',
        score: 350,
      });

      const { getByText } = render(<LeaderboardEntry entry={entry} />);

      expect(getByText('#5')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('350')).toBeTruthy();
    });

    it('shows gold medal for rank 1', () => {
      const entry = createMockEntry({ rank: 1 });
      const { getByTestId } = render(
        <LeaderboardEntry entry={entry} testID="entry" />
      );

      expect(getByTestId('entry-medal-gold')).toBeTruthy();
    });

    it('shows silver medal for rank 2', () => {
      const entry = createMockEntry({ rank: 2 });
      const { getByTestId } = render(
        <LeaderboardEntry entry={entry} testID="entry" />
      );

      expect(getByTestId('entry-medal-silver')).toBeTruthy();
    });

    it('shows bronze medal for rank 3', () => {
      const entry = createMockEntry({ rank: 3 });
      const { getByTestId } = render(
        <LeaderboardEntry entry={entry} testID="entry" />
      );

      expect(getByTestId('entry-medal-bronze')).toBeTruthy();
    });

    it('shows numeric rank for rank > 3', () => {
      const entry = createMockEntry({ rank: 10 });
      const { getByText, queryByTestId } = render(
        <LeaderboardEntry entry={entry} testID="entry" />
      );

      expect(getByText('#10')).toBeTruthy();
      expect(queryByTestId('entry-medal-gold')).toBeNull();
      expect(queryByTestId('entry-medal-silver')).toBeNull();
      expect(queryByTestId('entry-medal-bronze')).toBeNull();
    });

    it('shows games played badge when provided', () => {
      const entry = createMockEntry({ gamesPlayed: 5 });
      const { getByText } = render(
        <LeaderboardEntry entry={entry} showGamesPlayed />
      );

      expect(getByText('5/5')).toBeTruthy();
    });

    it('highlights current user row', () => {
      const entry = createMockEntry({ userId: 'current-user' });
      const { getByTestId } = render(
        <LeaderboardEntry
          entry={entry}
          isCurrentUser
          testID="entry"
        />
      );

      const container = getByTestId('entry-container');
      // Current user should have accent styling (borderColor is set)
      expect(container.props.style).toEqual(
        expect.objectContaining({ borderColor: expect.any(String), borderWidth: expect.any(Number) })
      );
    });

    it('renders avatar placeholder when no avatarUrl', () => {
      const entry = createMockEntry({ avatarUrl: null });
      const { getByTestId } = render(
        <LeaderboardEntry entry={entry} testID="entry" />
      );

      expect(getByTestId('entry-avatar-placeholder')).toBeTruthy();
    });
  });

  describe('LeaderboardList', () => {
    it('shows loading spinner when isLoading is true', () => {
      const { getByTestId } = render(
        <LeaderboardList
          entries={[]}
          isLoading
          isRefreshing={false}
          onRefresh={() => {}}
          testID="list"
        />
      );

      expect(getByTestId('list-loading')).toBeTruthy();
    });

    it('shows empty state when no entries and not loading', () => {
      const { getAllByText } = render(
        <LeaderboardList
          entries={[]}
          isLoading={false}
          isRefreshing={false}
          onRefresh={() => {}}
          testID="list"
        />
      );

      expect(getAllByText(/No rankings yet/i).length).toBeGreaterThan(0);
    });

    it('renders entries when provided', () => {
      const entries = [
        createMockEntry({ rank: 1, displayName: 'Alice', userId: 'a' }),
        createMockEntry({ rank: 2, displayName: 'Bob', userId: 'b' }),
        createMockEntry({ rank: 3, displayName: 'Charlie', userId: 'c' }),
      ];

      const { getByText } = render(
        <LeaderboardList
          entries={entries}
          isLoading={false}
          isRefreshing={false}
          onRefresh={() => {}}
          testID="list"
        />
      );

      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('Charlie')).toBeTruthy();
    });

    it('shows refresh indicator when refreshing', async () => {
      const { getByTestId } = render(
        <LeaderboardList
          entries={[createMockEntry()]}
          isLoading={false}
          isRefreshing
          onRefresh={() => {}}
          testID="list"
        />
      );

      // RefreshControl should be active
      const flatList = getByTestId('list-flatlist');
      expect(flatList.props.refreshing).toBe(true);
    });

    it('calls onRefresh when pulled', async () => {
      const onRefresh = jest.fn();
      const { getByTestId } = render(
        <LeaderboardList
          entries={[createMockEntry()]}
          isLoading={false}
          isRefreshing={false}
          onRefresh={onRefresh}
          testID="list"
        />
      );

      const flatList = getByTestId('list-flatlist');
      flatList.props.onRefresh();

      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe('StickyMeBar', () => {
    it('renders when shouldShow is true', () => {
      const userRank: UserRank = { rank: 150, score: 100, totalUsers: 500 };

      const { getByTestId } = render(
        <StickyMeBar
          userRank={userRank}
          displayName="Test User"
          shouldShow
          testID="sticky"
        />
      );

      expect(getByTestId('sticky-container')).toBeTruthy();
    });

    it('does not render when shouldShow is false', () => {
      const userRank: UserRank = { rank: 5, score: 400, totalUsers: 100 };

      const { queryByTestId } = render(
        <StickyMeBar
          userRank={userRank}
          displayName="Test User"
          shouldShow={false}
          testID="sticky"
        />
      );

      expect(queryByTestId('sticky-container')).toBeNull();
    });

    it('displays correct rank and score', () => {
      const userRank: UserRank = { rank: 42, score: 250, totalUsers: 100 };

      const { getByText } = render(
        <StickyMeBar
          userRank={userRank}
          displayName="Me"
          shouldShow
          testID="sticky"
        />
      );

      expect(getByText('#42')).toBeTruthy();
      expect(getByText('250')).toBeTruthy();
    });

    it('shows "You" label', () => {
      const userRank: UserRank = { rank: 10, score: 300, totalUsers: 50 };

      const { getByText } = render(
        <StickyMeBar
          userRank={userRank}
          displayName="Charlie"
          shouldShow
          testID="sticky"
        />
      );

      expect(getByText('You')).toBeTruthy();
    });
  });

  describe('LeaderboardEmptyState', () => {
    it('shows loading message when loading', () => {
      const { getByText } = render(
        <LeaderboardEmptyState isLoading testID="empty" />
      );

      expect(getByText(/Loading/i)).toBeTruthy();
    });

    it('shows empty message for daily leaderboard', () => {
      const { getAllByText, getByTestId } = render(
        <LeaderboardEmptyState
          isLoading={false}
          type="daily"
          testID="empty"
        />
      );

      // Check that empty state is rendered
      expect(getByTestId('empty-empty')).toBeTruthy();
      expect(getAllByText(/today/i).length).toBeGreaterThan(0);
    });

    it('shows empty message for global leaderboard', () => {
      const { getByTestId } = render(
        <LeaderboardEmptyState
          isLoading={false}
          type="global"
          testID="empty"
        />
      );

      expect(getByTestId('empty-empty')).toBeTruthy();
    });

    it('shows error message when error provided', () => {
      const error = new Error('Network error');
      const { getByText } = render(
        <LeaderboardEmptyState
          isLoading={false}
          error={error}
          testID="empty"
        />
      );

      expect(getByText(/error/i)).toBeTruthy();
    });
  });
});
