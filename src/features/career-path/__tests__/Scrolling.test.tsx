import { renderHook, act, waitFor } from '@testing-library/react-native';
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
};

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

describe('Auto-scroll behavior', () => {
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

  it('triggers scrollToEnd when revealedCount changes via revealNext', async () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Mock the ref
    const mockScrollToEnd = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
    };

    // Initial state
    expect(result.current.state.revealedCount).toBe(1);

    // Reveal next step
    act(() => {
      result.current.revealNext();
    });

    expect(result.current.state.revealedCount).toBe(2);

    // Fast-forward the 100ms delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: true });
    });
  });

  it('triggers scrollToEnd when revealedCount changes via incorrect guess', async () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Mock the ref
    const mockScrollToEnd = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
    };

    // Make an incorrect guess
    act(() => {
      result.current.setCurrentGuess('Wrong Answer');
    });

    act(() => {
      result.current.submitGuess();
    });

    expect(result.current.state.revealedCount).toBe(2);

    // Fast-forward the 100ms delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: true });
    });
  });

  it('does not trigger scrollToEnd on initial render (revealedCount = 1)', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Mock the ref
    const mockScrollToEnd = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
    };

    // Fast-forward any potential timers
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should not scroll on initial render
    expect(mockScrollToEnd).not.toHaveBeenCalled();
  });

  it('triggers scrollToEnd multiple times for multiple reveals', async () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Mock the ref
    const mockScrollToEnd = jest.fn();
    (result.current.flatListRef as any).current = {
      scrollToEnd: mockScrollToEnd,
    };

    // Reveal step 2
    act(() => {
      result.current.revealNext();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledTimes(1);
    });

    // Reveal step 3
    act(() => {
      result.current.revealNext();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledTimes(2);
    });

    // Reveal step 4
    act(() => {
      result.current.revealNext();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockScrollToEnd).toHaveBeenCalledTimes(3);
    });
  });

  it('handles null ref gracefully', () => {
    const { result } = renderHook(() => useCareerPathGame(mockPuzzle));

    // Leave ref as null (not attached)
    expect(result.current.flatListRef.current).toBeNull();

    // Should not throw when revealing
    act(() => {
      result.current.revealNext();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // No error should occur
    expect(result.current.state.revealedCount).toBe(2);
  });
});
