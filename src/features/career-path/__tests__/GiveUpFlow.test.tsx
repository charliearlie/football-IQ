/**
 * Give Up Flow - Regression Tests
 *
 * These tests verify the give-up flow works correctly and prevent
 * a regression where giving up caused:
 * 1. "See how you scored" button to be non-functional
 * 2. FlatList scroll to be locked
 *
 * Root cause: A dual React Native <Modal> animation conflict between
 * the ConfirmationModal dismissing and the GameResultModal auto-showing.
 * Fix: Removed the auto-show useEffect for losses.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCareerPathGame } from '../hooks/useCareerPathGame';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';

const mockPuzzle: ParsedLocalPuzzle = {
  id: 'test-puzzle-giveup',
  game_mode: 'career_path',
  puzzle_date: '2026-02-10',
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
  updated_at: null,
};

jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerLight: jest.fn(),
    triggerMedium: jest.fn(),
    triggerHeavy: jest.fn(),
    triggerSelection: jest.fn(),
    triggerNotification: jest.fn(),
    triggerSuccess: jest.fn(),
    triggerError: jest.fn(),
    triggerCompletion: jest.fn(),
  }),
}));

jest.mock('@/hooks/useGamePersistence', () => ({
  useGamePersistence: jest.fn(),
}));

jest.mock('@/features/puzzles', () => ({
  usePuzzle: jest.fn(() => ({
    puzzle: null,
    isLoading: false,
    refetch: jest.fn(),
  })),
  usePuzzleContext: jest.fn(() => ({
    syncAttempts: jest.fn(),
  })),
  useStablePuzzle: jest.fn(() => ({
    puzzle: null,
    isLoading: false,
  })),
  useOnboarding: jest.fn(() => ({
    shouldShowIntro: false,
    isReady: true,
    completeIntro: jest.fn(),
  })),
  GameIntroScreen: jest.fn(() => null),
  GameIntroModal: jest.fn(() => null),
}));

jest.mock('@/features/auth', () => ({
  useAuth: jest.fn(() => ({
    refreshLocalIQ: jest.fn(),
    profile: null,
    totalIQ: 0,
  })),
}));

describe('Give up flow regression', () => {
  it('give-up transitions to lost state with valid score', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Reveal all 5 steps (starts at 1, need 4 more)
    act(() => {
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
    });

    expect(result.current.state.gameStatus).toBe('playing');
    expect(result.current.allCluesRevealed).toBe(true);

    act(() => {
      result.current.giveUp();
    });

    expect(result.current.state.gameStatus).toBe('lost');
    expect(result.current.state.score).not.toBeNull();
    expect(result.current.state.score?.points).toBe(0);
    expect(result.current.state.score?.won).toBe(false);
  });

  it('does not set isVictoryRevealing on give-up (no animation conflict)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
    });

    act(() => {
      result.current.giveUp();
    });

    // Give-up should NOT trigger victory reveal animation
    expect(result.current.isVictoryRevealing).toBe(false);
  });

  it('game state is consistent after give-up (all fields populated)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
    });

    act(() => {
      result.current.giveUp();
    });

    const { state } = result.current;
    expect(state.gameStatus).toBe('lost');
    expect(state.score).toBeDefined();
    expect(state.isVictoryRevealing).toBe(false);
    // revealedCount should remain unchanged (give-up doesn't reveal more)
    expect(state.revealedCount).toBe(5);
  });

  it('give-up can happen before all clues are revealed (early give-up)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Only reveal 2 steps
    act(() => {
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(2);
    expect(result.current.allCluesRevealed).toBe(false);

    // Give up should still work (user can give up at any time)
    act(() => {
      result.current.giveUp();
    });

    expect(result.current.state.gameStatus).toBe('lost');
    expect(result.current.state.score?.points).toBe(0);
  });

  it('winning still triggers victory reveal (unaffected by give-up fix)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    act(() => {
      result.current.setCurrentGuess('Morgan Rogers');
    });
    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.gameStatus).toBe('won');
    expect(result.current.isVictoryRevealing).toBe(true);
    expect(result.current.state.score).not.toBeNull();
    expect(result.current.state.score?.won).toBe(true);
    expect(result.current.state.score?.points).toBeGreaterThan(0);
  });
});
