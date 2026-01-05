import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecallResultModal } from '../components/RecallResultModal';
import type { GoalscorerRecallScore, GoalWithState } from '../types/goalscorerRecall.types';

// Mock dependencies
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    floodlightWhite: '#F8FAFC',
    cardYellow: '#FACC15',
    redCard: '#EF4444',
    stadiumNavy: '#0F172A',
  },
  textStyles: {
    title: {},
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
  },
}));

jest.mock('@/components', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ElevatedButton: ({ title, onPress, testID }: { title: string; onPress: () => void; testID?: string }) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </Pressable>
    ),
    GlassCard: ({ children, style }: { children: React.ReactNode; style?: object }) => {
      const { View } = require('react-native');
      return <View style={style}>{children}</View>;
    },
  };
});

const mockMatchInfo = {
  homeTeam: 'Arsenal',
  awayTeam: 'Leicester',
  homeScore: 3,
  awayScore: 2,
  competition: 'Premier League',
  matchDate: '15 May 2023',
};

const createMockGoals = (found: boolean[]): GoalWithState[] =>
  found.map((f, i) => ({
    id: `goal-${i}`,
    scorer: `Player ${i + 1}`,
    minute: 10 + i * 20,
    team: i % 2 === 0 ? 'home' : 'away',
    found: f,
    isOwnGoal: false,
    displayOrder: i,
  }));

describe('RecallResultModal', () => {
  describe('rendering with valid score', () => {
    it('renders correctly when passed a valid score object', () => {
      const score: GoalscorerRecallScore = {
        scorersFound: 3,
        totalScorers: 5,
        percentage: 60,
        timeRemaining: 30,
        timeBonus: 0,
        allFound: false,
        won: false,
      };

      const goals = createMockGoals([true, true, true, false, false]);

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={goals}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      // Check score display
      expect(screen.getByText('3 / 5')).toBeTruthy();
      expect(screen.getByText('60%')).toBeTruthy();
    });

    it('displays "All Scorers Found!" message when won', () => {
      const score: GoalscorerRecallScore = {
        scorersFound: 5,
        totalScorers: 5,
        percentage: 100,
        timeRemaining: 25,
        timeBonus: 50,
        allFound: true,
        won: true,
      };

      const goals = createMockGoals([true, true, true, true, true]);

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={goals}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      expect(screen.getByText('All Scorers Found!')).toBeTruthy();
      expect(screen.getByText('🏆')).toBeTruthy();
    });

    it('displays "Time Up!" message when lost', () => {
      const score: GoalscorerRecallScore = {
        scorersFound: 2,
        totalScorers: 5,
        percentage: 40,
        timeRemaining: 0,
        timeBonus: 0,
        allFound: false,
        won: false,
      };

      const goals = createMockGoals([true, true, false, false, false]);

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={goals}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      expect(screen.getByText('Time Up!')).toBeTruthy();
      expect(screen.getByText('⏱️')).toBeTruthy();
    });

    it('displays time bonus when earned', () => {
      const score: GoalscorerRecallScore = {
        scorersFound: 5,
        totalScorers: 5,
        percentage: 100,
        timeRemaining: 30,
        timeBonus: 60,
        allFound: true,
        won: true,
      };

      const goals = createMockGoals([true, true, true, true, true]);

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={goals}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      expect(screen.getByText('+60')).toBeTruthy();
      expect(screen.getByText('Time Bonus')).toBeTruthy();
    });
  });

  describe('null score handling', () => {
    it('shows loading state when visible but score is null', () => {
      render(
        <RecallResultModal
          visible={true}
          score={null}
          goals={[]}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      // Should show loading state instead of nothing
      expect(screen.getByText('Calculating score...')).toBeTruthy();
    });

    it('returns null when not visible', () => {
      const { toJSON } = render(
        <RecallResultModal
          visible={false}
          score={null}
          goals={[]}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      expect(toJSON()).toBeNull();
    });
  });

  describe('missed scorers display', () => {
    it('displays missed scorers when not all found', () => {
      const score: GoalscorerRecallScore = {
        scorersFound: 2,
        totalScorers: 4,
        percentage: 50,
        timeRemaining: 0,
        timeBonus: 0,
        allFound: false,
        won: false,
      };

      const goals: GoalWithState[] = [
        { id: '1', scorer: 'Saka', minute: 15, team: 'home', found: true, isOwnGoal: false, displayOrder: 0 },
        { id: '2', scorer: 'Rice', minute: 30, team: 'home', found: true, isOwnGoal: false, displayOrder: 1 },
        { id: '3', scorer: 'Vardy', minute: 45, team: 'away', found: false, isOwnGoal: false, displayOrder: 2 },
        { id: '4', scorer: 'Maddison', minute: 60, team: 'away', found: false, isOwnGoal: false, displayOrder: 3 },
      ];

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={goals}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      expect(screen.getByText('Missed scorers:')).toBeTruthy();
      expect(screen.getByText("Vardy (45')")).toBeTruthy();
      expect(screen.getByText("Maddison (60')")).toBeTruthy();
    });

    it('excludes own goals from missed scorers list', () => {
      const score: GoalscorerRecallScore = {
        scorersFound: 1,
        totalScorers: 2,
        percentage: 50,
        timeRemaining: 0,
        timeBonus: 0,
        allFound: false,
        won: false,
      };

      const goals: GoalWithState[] = [
        { id: '1', scorer: 'Saka', minute: 15, team: 'home', found: true, isOwnGoal: false, displayOrder: 0 },
        { id: '2', scorer: 'Vardy', minute: 45, team: 'away', found: false, isOwnGoal: false, displayOrder: 1 },
        { id: '3', scorer: 'Own Goal', minute: 60, team: 'away', found: true, isOwnGoal: true, displayOrder: 2 },
      ];

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={goals}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={jest.fn()}
        />
      );

      // Should show Vardy as missed but not "Own Goal"
      expect(screen.getByText("Vardy (45')")).toBeTruthy();
      expect(screen.queryByText("Own Goal (60')")).toBeNull();
    });
  });

  describe('interaction', () => {
    it('calls onContinue when Continue button is pressed', () => {
      const onContinue = jest.fn();
      const score: GoalscorerRecallScore = {
        scorersFound: 5,
        totalScorers: 5,
        percentage: 100,
        timeRemaining: 30,
        timeBonus: 60,
        allFound: true,
        won: true,
      };

      render(
        <RecallResultModal
          visible={true}
          score={score}
          goals={createMockGoals([true, true, true, true, true])}
          matchInfo={mockMatchInfo}
          puzzleDate="2024-01-15"
          onContinue={onContinue}
        />
      );

      fireEvent.press(screen.getByText('Continue'));
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });
});
