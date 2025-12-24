import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';
import { useCareerPathGame } from '../hooks/useCareerPathGame';
import { CareerPathScreen } from '../screens/CareerPathScreen';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';

// Mock puzzle data
const mockPuzzle: ParsedLocalPuzzle = {
  id: 'test-puzzle-1',
  game_mode: 'career_path',
  puzzle_date: '2025-01-01',
  content: {
    answer: 'Morgan Rogers',
    career_steps: [
      { type: 'club', text: 'West Bromwich Albion (Youth)', year: '2010-2019' },
      { type: 'club', text: 'Manchester City', year: '2019-2023' },
      { type: 'loan', text: 'Lincoln City', year: '2021' },
      { type: 'club', text: 'Middlesbrough', year: '2023-2024' },
      { type: 'club', text: 'Aston Villa', year: '2024-Present' },
    ],
  },
  difficulty: 'medium',
  synced_at: null,
};

// Mock usePuzzle hook
jest.mock('@/features/puzzles', () => ({
  usePuzzle: jest.fn(() => ({
    puzzle: mockPuzzle,
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

// Mock useHaptics
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerLight: jest.fn(),
    triggerMedium: jest.fn(),
    triggerHeavy: jest.fn(),
    triggerSelection: jest.fn(),
    triggerNotification: jest.fn(),
  }),
}));

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('useCareerPathGame Hook', () => {
  it('initializes with 1 step revealed', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    expect(result.current.state.revealedCount).toBe(1);
    expect(result.current.state.gameStatus).toBe('playing');
    expect(result.current.careerSteps).toHaveLength(5);
  });

  it('reveals next step when revealNext is called', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(2);
  });

  it('increments revealedCount on incorrect guess (penalty reveal)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Set an incorrect guess
    act(() => {
      result.current.setCurrentGuess('Lionel Messi');
    });

    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.revealedCount).toBe(2);
    expect(result.current.state.guesses).toContain('Lionel Messi');
    expect(result.current.state.lastGuessIncorrect).toBe(true);
  });

  it('sets gameStatus to won on correct guess', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.setCurrentGuess('Morgan Rogers');
    });

    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.gameStatus).toBe('won');
    expect(result.current.state.revealedCount).toBe(1); // Should not increment on correct
  });

  it('handles case-insensitive matching', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.setCurrentGuess('MORGAN ROGERS');
    });

    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.gameStatus).toBe('won');
  });

  it('does not reveal beyond total steps', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Reveal all 5 steps
    act(() => {
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(5);

    // Try to reveal more
    act(() => {
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(5); // Still 5
  });

  it('clears currentGuess after submission', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.setCurrentGuess('Wrong Player');
    });

    expect(result.current.state.currentGuess).toBe('Wrong Player');

    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.currentGuess).toBe('');
  });
});

describe('CareerPathScreen', () => {
  it('renders first step revealed on load', () => {
    const { getByText, getByTestId } = render(<CareerPathScreen />);

    expect(getByText('Career Path')).toBeTruthy();
    expect(getByText('West Bromwich Albion (Youth)')).toBeTruthy();
    expect(getByTestId('step-1')).toBeTruthy();
  });

  it('shows progress indicator', () => {
    const { getByText } = render(<CareerPathScreen />);

    // Progress text is rendered with nested Text components: "Step 1 of 5"
    // Use regex to match the combined text
    expect(getByText(/Step.*1.*of.*5/)).toBeTruthy();
  });

  it('reveals next step when Reveal Next pressed', async () => {
    const { getByTestId, getByText } = render(<CareerPathScreen />);

    fireEvent.press(getByTestId('action-zone-reveal'));

    await waitFor(() => {
      expect(getByText('Manchester City')).toBeTruthy();
    });
  });

  it('disables Reveal Next button when all steps shown', async () => {
    const { getByTestId, queryByTestId } = render(<CareerPathScreen />);

    // Reveal all steps
    for (let i = 0; i < 4; i++) {
      fireEvent.press(getByTestId('action-zone-reveal'));
    }

    await waitFor(() => {
      // Reveal button should be hidden when all steps are revealed
      expect(queryByTestId('action-zone-reveal')).toBeNull();
    });
  });

  it('triggers shake animation on incorrect guess', async () => {
    const { getByTestId } = render(<CareerPathScreen />);

    const input = getByTestId('action-zone-input');
    fireEvent.changeText(input, 'Wrong Player');
    fireEvent.press(getByTestId('action-zone-submit'));

    // The shake animation is triggered via lastGuessIncorrect state
    // We verify the guess was processed by checking for new revealed step
    await waitFor(() => {
      expect(getByTestId('step-2')).toBeTruthy();
    });
  });

  it('shows game result modal on win', async () => {
    const { getByTestId } = render(<CareerPathScreen />);

    const input = getByTestId('action-zone-input');
    fireEvent.changeText(input, 'Morgan Rogers');
    fireEvent.press(getByTestId('action-zone-submit'));

    await waitFor(() => {
      expect(getByTestId('game-result-modal')).toBeTruthy();
    });
  });
});
