import { renderHook, act } from '@testing-library/react-native';
import { useCareerPathGame } from '../hooks/useCareerPathGame';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';

// Mock puzzle data with multiple steps
const mockPuzzle: ParsedLocalPuzzle = {
  id: 'test-puzzle-1',
  game_mode: 'career_path',
  puzzle_date: '2025-01-01',
  content: {
    answer: 'Test Player',
    career_steps: [
      { type: 'club', text: 'Club A', year: '2010-2012' },
      { type: 'club', text: 'Club B', year: '2012-2015' },
      { type: 'loan', text: 'Club C', year: '2015' },
      { type: 'club', text: 'Club D', year: '2015-2020' },
      { type: 'club', text: 'Club E', year: '2020-Present' },
    ],
  },
  difficulty: 'medium',
  synced_at: null,
  updated_at: null,
};

// Mock useHaptics
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

// Mock useGamePersistence to avoid database calls in tests
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
}));

jest.mock('@/features/auth', () => ({
  useAuth: jest.fn(() => ({
    refreshLocalIQ: jest.fn(),
    profile: null,
    totalIQ: 0,
  })),
}));

describe('Scroll behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides flatListRef for scrolling', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    expect(result.current.flatListRef).toBeDefined();
    expect(result.current.flatListRef.current).toBeNull(); // Not attached yet
  });

  it('does not auto-scroll on reveal (auto-scroll was intentionally removed)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Mock the ref with scroll methods
    const mockScrollToEnd = jest.fn();
    const mockScrollToOffset = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
      scrollToOffset: mockScrollToOffset,
      scrollToIndex: jest.fn(),
    };

    // Reveal next step
    act(() => {
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(2);

    // Advance timers well past any potential auto-scroll delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // No auto-scroll should have been triggered
    expect(mockScrollToEnd).not.toHaveBeenCalled();
    expect(mockScrollToOffset).not.toHaveBeenCalled();
  });

  it('does not auto-scroll on incorrect guess penalty reveal', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    const mockScrollToEnd = jest.fn();
    const mockScrollToOffset = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
      scrollToOffset: mockScrollToOffset,
      scrollToIndex: jest.fn(),
    };

    // Make an incorrect guess (triggers penalty reveal)
    act(() => {
      result.current.setCurrentGuess('Wrong Answer');
    });
    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.revealedCount).toBe(2);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockScrollToEnd).not.toHaveBeenCalled();
    expect(mockScrollToOffset).not.toHaveBeenCalled();
  });

  it('does not auto-scroll after multiple reveals', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    const mockScrollToEnd = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
      scrollToOffset: jest.fn(),
      scrollToIndex: jest.fn(),
    };

    // Reveal 3 more steps
    act(() => {
      result.current.revealNext();
      result.current.revealNext();
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(4);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockScrollToEnd).not.toHaveBeenCalled();
  });

  it('handles null ref gracefully on reveal', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Leave ref as null (not attached)
    expect(result.current.flatListRef.current).toBeNull();

    // Should not throw when revealing
    act(() => {
      result.current.revealNext();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.state.revealedCount).toBe(2);
  });
});
