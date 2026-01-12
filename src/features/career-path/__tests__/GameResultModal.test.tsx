/**
 * Career Path Game Result Modal Tests
 *
 * Tests for the result modal display behavior.
 * Career Path should NOT show a numeric score (like "4/5") - it should work
 * like Wordle where the distribution graph IS the score.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GameResultModal } from '../components/GameResultModal';
import type { GameScore } from '../types/careerPath.types';

// Mock dependencies
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('@/theme/colors', () => ({
  colors: {
    pitchGreen: '#58CC02',
    floodlightWhite: '#F8FAFC',
    stadiumNavy: '#0F172A',
    textSecondary: '#94A3B8',
    glassBackground: 'rgba(255,255,255,0.1)',
  },
}));

jest.mock('@/theme/typography', () => ({
  fonts: {
    headline: 'System',
    body: 'System',
  },
}));

jest.mock('@/theme/spacing', () => ({
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 4, md: 8 },
}));

// Mock the ScoreDistributionContainer to avoid API calls
jest.mock('@/features/stats/components/ScoreDistributionContainer', () => ({
  ScoreDistributionContainer: ({ testID }: { testID?: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID}>
        <Text>Distribution Graph</Text>
      </View>
    );
  },
}));

// Mock BaseResultModal and related components
jest.mock('@/components/GameResultModal', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    BaseResultModal: ({
      visible,
      title,
      message,
      children,
      onClose,
      testID,
    }: {
      visible: boolean;
      title: string;
      message: string;
      children: React.ReactNode;
      onClose: () => void;
      testID?: string;
    }) => {
      if (!visible) return null;
      return (
        <View testID={testID}>
          <Text testID="modal-title">{title}</Text>
          <Text testID="modal-message">{message}</Text>
          {children}
          <Pressable onPress={onClose} testID="close-button">
            <Text>Close</Text>
          </Pressable>
        </View>
      );
    },
    ScoreDisplay: ({ value }: { value: string }) => {
      const { Text } = require('react-native');
      return <Text testID="score-display">{value}</Text>;
    },
    AnswerReveal: ({ value }: { value: string }) => {
      const { Text } = require('react-native');
      return <Text testID="answer-reveal">{value}</Text>;
    },
  };
});

const mockScore: GameScore = {
  points: 4,
  maxPoints: 5,
  stepsRevealed: 2,
  won: true,
};

const mockLostScore: GameScore = {
  points: 0,
  maxPoints: 5,
  stepsRevealed: 5,
  won: false,
};

const defaultProps = {
  visible: true,
  won: true,
  score: mockScore,
  correctAnswer: 'Morgan Rogers',
  totalSteps: 5,
  puzzleId: 'test-puzzle-123',
  onShare: jest.fn().mockResolvedValue({ success: true, method: 'share' }),
  onClose: jest.fn(),
};

describe('GameResultModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('score display behavior', () => {
    it('does NOT show numeric score display when won', () => {
      // Career Path should not show "4/5" - only the distribution graph
      render(<GameResultModal {...defaultProps} />);

      // ScoreDisplay should not be rendered
      expect(screen.queryByTestId('score-display')).toBeNull();
    });

    it('does not show any X/Y format score text when won', () => {
      render(<GameResultModal {...defaultProps} />);

      // Should not find any "4/5" or similar score text
      expect(screen.queryByText(/^\d+\/\d+$/)).toBeNull();
    });
  });

  describe('message display', () => {
    it('shows "Solved with X clues revealed" message when won with 2 clues', () => {
      render(<GameResultModal {...defaultProps} />);

      expect(screen.getByText(/Solved with 2 clues revealed/)).toBeTruthy();
    });

    it('shows "Solved with X clue revealed" (singular) when won with 1 clue', () => {
      const singleClueScore: GameScore = {
        ...mockScore,
        stepsRevealed: 1,
      };
      render(<GameResultModal {...defaultProps} score={singleClueScore} />);

      expect(screen.getByText(/Solved with 1 clue revealed/)).toBeTruthy();
    });

    it('shows "CORRECT!" title when won', () => {
      render(<GameResultModal {...defaultProps} />);

      expect(screen.getByText('CORRECT!')).toBeTruthy();
    });

    it('shows "GAME OVER" title when lost', () => {
      render(<GameResultModal {...defaultProps} won={false} score={mockLostScore} />);

      expect(screen.getByText('GAME OVER')).toBeTruthy();
    });

    it('shows "Better luck tomorrow!" message when lost', () => {
      render(<GameResultModal {...defaultProps} won={false} score={mockLostScore} />);

      expect(screen.getByText('Better luck tomorrow!')).toBeTruthy();
    });
  });

  describe('answer reveal on loss', () => {
    it('shows correct answer when lost', () => {
      render(<GameResultModal {...defaultProps} won={false} score={mockLostScore} />);

      expect(screen.getByTestId('answer-reveal')).toBeTruthy();
      expect(screen.getByText('Morgan Rogers')).toBeTruthy();
    });

    it('does not show answer reveal when won', () => {
      render(<GameResultModal {...defaultProps} />);

      expect(screen.queryByTestId('answer-reveal')).toBeNull();
    });
  });

  describe('distribution graph', () => {
    it('renders distribution graph', () => {
      render(<GameResultModal {...defaultProps} testID="result-modal" />);

      expect(screen.getByTestId('result-modal-distribution')).toBeTruthy();
    });
  });

  describe('visibility', () => {
    it('renders nothing when not visible', () => {
      const { toJSON } = render(<GameResultModal {...defaultProps} visible={false} />);

      expect(toJSON()).toBeNull();
    });

    it('renders content when visible', () => {
      render(<GameResultModal {...defaultProps} testID="result-modal" />);

      expect(screen.getByTestId('result-modal')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is pressed', () => {
      const onClose = jest.fn();
      render(<GameResultModal {...defaultProps} onClose={onClose} />);

      fireEvent.press(screen.getByTestId('close-button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
