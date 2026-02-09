/**
 * DayDetailSheet Component Tests
 *
 * Tests for the bottom sheet that displays day details.
 * Covers:
 * - Rendering states (visible/hidden)
 * - Empty game modes handling
 * - CTA button behavior
 * - Accessibility
 *
 * @audit SDET Review - Critical UI component tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DayDetailSheet } from '../components/StreakCalendar/DayDetailSheet';
import { CalendarDay } from '../types/calendar.types';

// Mock haptics
jest.mock('@/lib/haptics', () => ({
  triggerMedium: jest.fn(),
}));

// Mock ElevatedButton
jest.mock('@/components', () => ({
  ElevatedButton: ({ title, onPress, testID }: { title: string; onPress: () => void; testID?: string }) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('DayDetailSheet', () => {
  const mockOnDismiss = jest.fn();
  const mockOnCompleteGames = jest.fn();

  const createMockDay = (overrides?: Partial<CalendarDay>): CalendarDay => ({
    date: '2026-01-15',
    count: 3,
    totalIQ: 250,
    gameModes: [
      { gameMode: 'career_path', completed: true, iqEarned: 100 },
      { gameMode: 'guess_the_transfer', completed: true, iqEarned: 100 },
      { gameMode: 'the_grid', completed: true, iqEarned: 50 },
      { gameMode: 'topical_quiz', completed: false, iqEarned: 0 },
      { gameMode: 'the_grid', completed: false, iqEarned: 0 },
      { gameMode: 'top_tens', completed: false, iqEarned: 0 },
    ],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('returns null when not visible', () => {
      const { toJSON } = render(
        <DayDetailSheet
          day={createMockDay()}
          visible={false}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(toJSON()).toBeNull();
    });

    it('returns null when day is null', () => {
      const { toJSON } = render(
        <DayDetailSheet
          day={null}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(toJSON()).toBeNull();
    });

    it('renders when visible with valid day', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay()}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('+250 IQ')).toBeTruthy();
    });
  });

  describe('Content Display', () => {
    it('displays correct completion count', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay({ count: 3 })}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('3 of 6 games completed')).toBeTruthy();
    });

    it('displays IQ earned with plus sign', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay({ totalIQ: 500 })}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('+500 IQ')).toBeTruthy();
    });

    it('displays 0 IQ without plus sign', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay({ totalIQ: 0 })}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('0 IQ')).toBeTruthy();
    });
  });

  describe('Incomplete Day CTA', () => {
    it('shows CTA button when games are incomplete', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay({ count: 3 })}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('Complete Missing Games')).toBeTruthy();
    });

    it('shows correct remaining games message (plural)', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay({ count: 3 })} // 3 of 6 = 3 remaining
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('3 more games to perfect day!')).toBeTruthy();
    });

    it('shows correct remaining games message (singular)', () => {
      const day = createMockDay();
      // 5 completed, 1 remaining
      day.count = 5;
      day.gameModes = [
        { gameMode: 'career_path', completed: true, iqEarned: 100 },
        { gameMode: 'guess_the_transfer', completed: true, iqEarned: 100 },
        { gameMode: 'the_grid', completed: true, iqEarned: 50 },
        { gameMode: 'topical_quiz', completed: true, iqEarned: 50 },
        { gameMode: 'the_grid', completed: true, iqEarned: 50 },
        { gameMode: 'top_tens', completed: false, iqEarned: 0 },
      ];

      const { getByText } = render(
        <DayDetailSheet
          day={day}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('1 more game to perfect day!')).toBeTruthy();
    });

    it('calls onCompleteGames with date when CTA pressed', () => {
      const { getByText } = render(
        <DayDetailSheet
          day={createMockDay({ date: '2026-01-20' })}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      fireEvent.press(getByText('Complete Missing Games'));

      expect(mockOnCompleteGames).toHaveBeenCalledWith('2026-01-20');
    });
  });

  describe('Perfect Day', () => {
    it('shows Perfect Day message when all games completed', () => {
      const perfectDay: CalendarDay = {
        date: '2026-01-15',
        count: 6,
        totalIQ: 600,
        gameModes: [
          { gameMode: 'career_path', completed: true, iqEarned: 100 },
          { gameMode: 'guess_the_transfer', completed: true, iqEarned: 100 },
          { gameMode: 'the_grid', completed: true, iqEarned: 100 },
          { gameMode: 'topical_quiz', completed: true, iqEarned: 100 },
          { gameMode: 'the_grid', completed: true, iqEarned: 100 },
          { gameMode: 'top_tens', completed: true, iqEarned: 100 },
        ],
      };

      const { getByText, queryByText } = render(
        <DayDetailSheet
          day={perfectDay}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('🎉 Perfect Day!')).toBeTruthy();
      expect(queryByText('Complete Missing Games')).toBeNull();
    });

    it('does not show Perfect Day for empty gameModes', () => {
      const emptyDay: CalendarDay = {
        date: '2026-01-15',
        count: 0,
        totalIQ: 0,
        gameModes: [],
      };

      const { queryByText } = render(
        <DayDetailSheet
          day={emptyDay}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      // Should NOT show Perfect Day when totalGames is 0
      expect(queryByText('🎉 Perfect Day!')).toBeNull();
    });

    it('shows "No games available" message for empty gameModes', () => {
      const emptyDay: CalendarDay = {
        date: '2026-01-15',
        count: 0,
        totalIQ: 0,
        gameModes: [],
      };

      const { getByText, queryByText } = render(
        <DayDetailSheet
          day={emptyDay}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      // Should show "No games available" message
      expect(getByText('No games available for this day')).toBeTruthy();
      // Should NOT show CTA button
      expect(queryByText('Complete Missing Games')).toBeNull();
    });
  });

  describe('Dismiss Behavior', () => {
    it('calls onDismiss when close button pressed', () => {
      const { getByLabelText } = render(
        <DayDetailSheet
          day={createMockDay()}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      fireEvent.press(getByLabelText('Close'));

      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  describe('Dynamic Game Count', () => {
    it('handles day with 4 games', () => {
      const day: CalendarDay = {
        date: '2026-01-15',
        count: 2,
        totalIQ: 200,
        gameModes: [
          { gameMode: 'career_path', completed: true, iqEarned: 100 },
          { gameMode: 'guess_the_transfer', completed: true, iqEarned: 100 },
          { gameMode: 'the_grid', completed: false, iqEarned: 0 },
          { gameMode: 'topical_quiz', completed: false, iqEarned: 0 },
        ],
      };

      const { getByText } = render(
        <DayDetailSheet
          day={day}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('2 of 4 games completed')).toBeTruthy();
    });

    it('handles day with 8 games (weekend)', () => {
      const day: CalendarDay = {
        date: '2026-01-17', // Saturday
        count: 5,
        totalIQ: 500,
        gameModes: [
          { gameMode: 'career_path', completed: true, iqEarned: 100 },
          { gameMode: 'guess_the_transfer', completed: true, iqEarned: 100 },
          { gameMode: 'the_grid', completed: true, iqEarned: 100 },
          { gameMode: 'topical_quiz', completed: true, iqEarned: 100 },
          { gameMode: 'the_grid', completed: true, iqEarned: 100 },
          { gameMode: 'top_tens', completed: false, iqEarned: 0 },
          { gameMode: 'guess_the_goalscorers', completed: false, iqEarned: 0 },
          { gameMode: 'career_path', completed: false, iqEarned: 0 }, // Second career path
        ],
      };

      const { getByText } = render(
        <DayDetailSheet
          day={day}
          visible={true}
          onDismiss={mockOnDismiss}
          onCompleteGames={mockOnCompleteGames}
        />
      );

      expect(getByText('5 of 8 games completed')).toBeTruthy();
    });
  });
});

describe('DayDetailSheet - Date Formatting', () => {
  const mockOnDismiss = jest.fn();
  const mockOnCompleteGames = jest.fn();

  it('formats date correctly with ordinal suffix (1st)', () => {
    const { getByText } = render(
      <DayDetailSheet
        day={{
          date: '2026-01-01',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    // Should show "Thursday 1st January 2026"
    expect(getByText(/1st/)).toBeTruthy();
  });

  it('formats date correctly with ordinal suffix (2nd)', () => {
    const { getByText } = render(
      <DayDetailSheet
        day={{
          date: '2026-01-02',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/2nd/)).toBeTruthy();
  });

  it('formats date correctly with ordinal suffix (3rd)', () => {
    const { getByText } = render(
      <DayDetailSheet
        day={{
          date: '2026-01-03',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/3rd/)).toBeTruthy();
  });

  it('formats date correctly with ordinal suffix (th)', () => {
    const { getByText } = render(
      <DayDetailSheet
        day={{
          date: '2026-01-15',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/15th/)).toBeTruthy();
  });

  it('handles 21st, 22nd, 23rd correctly', () => {
    const { rerender, getByText } = render(
      <DayDetailSheet
        day={{
          date: '2026-01-21',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/21st/)).toBeTruthy();

    rerender(
      <DayDetailSheet
        day={{
          date: '2026-01-22',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/22nd/)).toBeTruthy();

    rerender(
      <DayDetailSheet
        day={{
          date: '2026-01-23',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/23rd/)).toBeTruthy();
  });

  it('handles 31st correctly', () => {
    const { getByText } = render(
      <DayDetailSheet
        day={{
          date: '2026-01-31',
          count: 0,
          totalIQ: 0,
          gameModes: [{ gameMode: 'career_path', completed: false, iqEarned: 0 }],
        }}
        visible={true}
        onDismiss={mockOnDismiss}
        onCompleteGames={mockOnCompleteGames}
      />
    );

    expect(getByText(/31st/)).toBeTruthy();
  });
});
