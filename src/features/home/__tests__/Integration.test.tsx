/**
 * Home Screen Integration Tests
 *
 * Tests for the Home Screen daily challenge dashboard.
 * Verifies that puzzle cards show correct states based on attempt data.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { DailyStackCard } from '../components/DailyStackCard';

// Mock the navigation
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('DailyStackCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Play state', () => {
    it('shows Play button when status is play', () => {
      const { getAllByText } = render(
        <DailyStackCard
          puzzleId="puzzle-1"
          gameMode="career_path"
          status="play"
          onPress={mockOnPress}
          testID="daily-card-career_path"
        />
      );

      // ElevatedButton may render text in multiple places for the 3D effect
      expect(getAllByText('Play').length).toBeGreaterThan(0);
    });

    it('shows correct title for career_path', () => {
      const { getByText } = render(
        <DailyStackCard
          puzzleId="puzzle-1"
          gameMode="career_path"
          status="play"
          onPress={mockOnPress}
        />
      );

      expect(getByText('Career Path')).toBeTruthy();
      expect(getByText('Guess the player')).toBeTruthy();
    });

    it('shows correct title for guess_the_transfer', () => {
      const { getByText } = render(
        <DailyStackCard
          puzzleId="puzzle-2"
          gameMode="guess_the_transfer"
          status="play"
          onPress={mockOnPress}
        />
      );

      expect(getByText('Transfer Guess')).toBeTruthy();
      expect(getByText('Name the player')).toBeTruthy();
    });

    it('shows correct title for guess_the_goalscorers', () => {
      const { getByText } = render(
        <DailyStackCard
          puzzleId="puzzle-3"
          gameMode="guess_the_goalscorers"
          status="play"
          onPress={mockOnPress}
        />
      );

      expect(getByText('Goalscorer Recall')).toBeTruthy();
      expect(getByText('Remember the match')).toBeTruthy();
    });

    it('shows correct title for tic_tac_toe', () => {
      const { getByText } = render(
        <DailyStackCard
          puzzleId="puzzle-4"
          gameMode="tic_tac_toe"
          status="play"
          onPress={mockOnPress}
        />
      );

      expect(getByText('Tic Tac Toe')).toBeTruthy();
      expect(getByText('Beat the AI')).toBeTruthy();
    });
  });

  describe('Resume state', () => {
    it('shows Resume button when status is resume', () => {
      const { getAllByText } = render(
        <DailyStackCard
          puzzleId="puzzle-1"
          gameMode="career_path"
          status="resume"
          onPress={mockOnPress}
        />
      );

      // ElevatedButton may render text in multiple places for the 3D effect
      expect(getAllByText('Resume').length).toBeGreaterThan(0);
    });
  });

  describe('Done state', () => {
    it('shows checkmark when status is done', () => {
      const { getAllByTestId } = render(
        <DailyStackCard
          puzzleId="puzzle-1"
          gameMode="career_path"
          status="done"
          scoreDisplay="5/5"
          onPress={mockOnPress}
          testID="daily-card-career_path"
        />
      );

      // The checkmark should be rendered (may have multiple due to icon structure)
      expect(getAllByTestId('daily-card-career_path-checkmark').length).toBeGreaterThan(0);
    });

    it('shows score display when provided', () => {
      const { getByText } = render(
        <DailyStackCard
          puzzleId="puzzle-1"
          gameMode="career_path"
          status="done"
          scoreDisplay="8/10"
          onPress={mockOnPress}
        />
      );

      expect(getByText('8/10')).toBeTruthy();
    });

    it('does not show Play or Resume button when done', () => {
      const { queryByText } = render(
        <DailyStackCard
          puzzleId="puzzle-1"
          gameMode="career_path"
          status="done"
          scoreDisplay="5/5"
          onPress={mockOnPress}
        />
      );

      expect(queryByText('Play')).toBeNull();
      expect(queryByText('Resume')).toBeNull();
    });
  });

  describe('Topical Quiz state', () => {
    it('shows correct title for topical_quiz', () => {
      const { getByText } = render(
        <DailyStackCard
          puzzleId="puzzle-quiz"
          gameMode="topical_quiz"
          status="play"
          onPress={mockOnPress}
        />
      );

      expect(getByText('Quiz')).toBeTruthy();
      expect(getByText('5 questions')).toBeTruthy();
    });

    it('shows Play button for topical_quiz', () => {
      const { getAllByText } = render(
        <DailyStackCard
          puzzleId="puzzle-quiz"
          gameMode="topical_quiz"
          status="play"
          onPress={mockOnPress}
        />
      );

      // ElevatedButton may render text in multiple places for the 3D effect
      expect(getAllByText('Play').length).toBeGreaterThan(0);
    });
  });
});

describe('StreakHeader', () => {
  // Import StreakHeader for testing
  const { StreakHeader } = require('../components/StreakHeader');

  it('displays current streak count', () => {
    const { getByText } = render(
      <StreakHeader currentStreak={5} completedCount={3} totalCount={5} />
    );

    expect(getByText('5')).toBeTruthy();
    expect(getByText('day streak')).toBeTruthy();
  });

  it('displays zero streak', () => {
    const { getByText } = render(
      <StreakHeader currentStreak={0} completedCount={0} totalCount={5} />
    );

    expect(getByText('0')).toBeTruthy();
  });

  it('displays completed count correctly', () => {
    const { getByText } = render(
      <StreakHeader currentStreak={3} completedCount={2} totalCount={5} />
    );

    expect(getByText('2/5')).toBeTruthy();
    expect(getByText('Puzzles Today')).toBeTruthy();
  });

  it('displays full completion', () => {
    const { getByText } = render(
      <StreakHeader currentStreak={10} completedCount={5} totalCount={5} />
    );

    expect(getByText('5/5')).toBeTruthy();
  });
});
