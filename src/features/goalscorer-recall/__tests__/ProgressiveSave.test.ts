/**
 * TDD Tests for Progressive Save feature.
 *
 * Tests the ability to save game progress mid-game and restore it
 * when the user returns to the game.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGoalscorerRecallGame } from '../hooks/useGoalscorerRecallGame';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import type { ParsedLocalPuzzle, ParsedLocalAttempt } from '@/types/database';

// Mock database functions
jest.mock('@/lib/database', () => ({
  saveAttempt: jest.fn(),
  getAttemptByPuzzleId: jest.fn(),
}));

// Mock PuzzleContext
jest.mock('@/features/puzzles/context/PuzzleContext', () => ({
  usePuzzleContext: jest.fn(() => ({
    syncAttempts: jest.fn(),
  })),
}));

// Mock AuthContext
jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id' },
    profile: null,
  })),
}));

// Mock haptics
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerNotification: jest.fn(),
    triggerHeavy: jest.fn(),
    triggerSelection: jest.fn(),
  }),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-123',
}));

const mockSaveAttempt = saveAttempt as jest.MockedFunction<typeof saveAttempt>;
const mockGetAttemptByPuzzleId = getAttemptByPuzzleId as jest.MockedFunction<
  typeof getAttemptByPuzzleId
>;

const createMockPuzzle = (): ParsedLocalPuzzle => ({
  id: 'puzzle-123',
  game_mode: 'guess_the_goalscorers',
  puzzle_date: '2024-01-15',
  difficulty: 'medium',
  synced_at: new Date().toISOString(),
  updated_at: null,
  content: {
    home_team: 'Arsenal',
    away_team: 'Liverpool',
    home_score: 2,
    away_score: 1,
    competition: 'Premier League',
    match_date: '15 Jan 2024',
    goals: [
      { scorer: 'Bukayo Saka', minute: 25, team: 'home', isOwnGoal: false },
      { scorer: 'Mohamed Salah', minute: 45, team: 'away', isOwnGoal: false },
      { scorer: 'Martin Odegaard', minute: 78, team: 'home', isOwnGoal: false },
    ],
  },
});

describe('Progressive Save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAttemptByPuzzleId.mockResolvedValue(null);
    mockSaveAttempt.mockResolvedValue();
  });

  describe('saving progress', () => {
    it('saves progress with completed=0 when goal found', async () => {
      const puzzle = createMockPuzzle();

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Start game
      act(() => {
        result.current.startGame();
      });

      // Submit correct guess
      act(() => {
        result.current.setCurrentGuess('Saka');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Wait for save to be called
      await waitFor(() => {
        expect(mockSaveAttempt).toHaveBeenCalled();
      });

      // Verify save was called with completed=0 (in-progress)
      const savedAttempt = mockSaveAttempt.mock.calls[0][0];
      expect(savedAttempt.completed).toBe(0);
      expect(savedAttempt.puzzle_id).toBe('puzzle-123');

      // Verify metadata contains foundScorers
      const metadata = JSON.parse(savedAttempt.metadata as string);
      expect(metadata.foundScorers).toContain('bukayo saka');
    });

    it('updates same attemptId on subsequent saves', async () => {
      const puzzle = createMockPuzzle();

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Start game
      act(() => {
        result.current.startGame();
      });

      // Submit first correct guess
      act(() => {
        result.current.setCurrentGuess('Saka');
      });
      act(() => {
        result.current.submitGuess();
      });

      await waitFor(() => {
        expect(mockSaveAttempt).toHaveBeenCalledTimes(1);
      });

      const firstAttemptId = mockSaveAttempt.mock.calls[0][0].id;

      // Submit second correct guess
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      await waitFor(() => {
        expect(mockSaveAttempt).toHaveBeenCalledTimes(2);
      });

      const secondAttemptId = mockSaveAttempt.mock.calls[1][0].id;

      // Both saves should use the same attempt ID
      expect(firstAttemptId).toBe(secondAttemptId);
    });

    it('sets completed=1 when game ends', async () => {
      const puzzle = createMockPuzzle();

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Start game
      act(() => {
        result.current.startGame();
      });

      // Find all scorers to win
      act(() => {
        result.current.setCurrentGuess('Saka');
      });
      act(() => {
        result.current.submitGuess();
      });

      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      act(() => {
        result.current.setCurrentGuess('Odegaard');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Wait for final save (game won)
      await waitFor(() => {
        const lastCall = mockSaveAttempt.mock.calls[mockSaveAttempt.mock.calls.length - 1];
        expect(lastCall[0].completed).toBe(1);
      });

      // Verify final save has score
      const lastSavedAttempt = mockSaveAttempt.mock.calls[mockSaveAttempt.mock.calls.length - 1][0];
      expect(lastSavedAttempt.score).toBeGreaterThan(0);
    });
  });

  describe('restoring progress', () => {
    it('restores foundScorers from existing attempt', async () => {
      const existingAttempt: ParsedLocalAttempt = {
        id: 'existing-attempt-id',
        puzzle_id: 'puzzle-123',
        completed: 0,
        score: null,
        score_display: null,
        metadata: {
          foundScorers: ['bukayo saka'],
          timeRemaining: 45,
          startedAt: '2024-01-15T10:00:00Z',
        },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: 0,
      };

      mockGetAttemptByPuzzleId.mockResolvedValue(existingAttempt);

      const puzzle = createMockPuzzle();
      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Wait for restore to complete
      await waitFor(() => {
        // Saka should already be found
        expect(result.current.foundScorersCount).toBe(1);
      });

      // Game should be in playing state
      expect(result.current.state.gameStatus).toBe('playing');

      // The goal for Saka should be marked as found
      const sakaGoal = result.current.state.goals.find(
        (g) => g.scorer === 'Bukayo Saka'
      );
      expect(sakaGoal?.found).toBe(true);
    });

    it('restores timer from saved timeRemaining', async () => {
      const existingAttempt: ParsedLocalAttempt = {
        id: 'existing-attempt-id',
        puzzle_id: 'puzzle-123',
        completed: 0,
        score: null,
        score_display: null,
        metadata: {
          foundScorers: ['bukayo saka'],
          timeRemaining: 35,
          startedAt: '2024-01-15T10:00:00Z',
        },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: 0,
      };

      mockGetAttemptByPuzzleId.mockResolvedValue(existingAttempt);

      const puzzle = createMockPuzzle();
      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Wait for restore to complete
      await waitFor(() => {
        expect(result.current.state.gameStatus).toBe('playing');
      });

      // Timer should be restored to saved value
      expect(result.current.timeRemaining).toBe(35);
    });

    it('uses existing attemptId for subsequent saves after restore', async () => {
      const existingAttempt: ParsedLocalAttempt = {
        id: 'existing-attempt-id',
        puzzle_id: 'puzzle-123',
        completed: 0,
        score: null,
        score_display: null,
        metadata: {
          foundScorers: ['bukayo saka'],
          timeRemaining: 45,
          startedAt: '2024-01-15T10:00:00Z',
        },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        synced: 0,
      };

      mockGetAttemptByPuzzleId.mockResolvedValue(existingAttempt);

      const puzzle = createMockPuzzle();
      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Wait for restore to complete
      await waitFor(() => {
        expect(result.current.foundScorersCount).toBe(1);
      });

      // Submit another correct guess
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Wait for save
      await waitFor(() => {
        expect(mockSaveAttempt).toHaveBeenCalled();
      });

      // Should use the existing attempt ID
      const savedAttempt = mockSaveAttempt.mock.calls[0][0];
      expect(savedAttempt.id).toBe('existing-attempt-id');
    });

    it('does not restore completed attempts', async () => {
      const completedAttempt: ParsedLocalAttempt = {
        id: 'completed-attempt-id',
        puzzle_id: 'puzzle-123',
        completed: 1,
        score: 100,
        score_display: '100%',
        metadata: {
          foundScorers: ['bukayo saka', 'mohamed salah', 'martin odegaard'],
          timeRemaining: 30,
          startedAt: '2024-01-15T10:00:00Z',
          won: true,
        },
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:00:30Z',
        synced: 1,
      };

      mockGetAttemptByPuzzleId.mockResolvedValue(completedAttempt);

      const puzzle = createMockPuzzle();
      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Wait a bit to ensure no restore happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Game should be idle (not restored)
      expect(result.current.state.gameStatus).toBe('idle');
      expect(result.current.foundScorersCount).toBe(0);
    });
  });
});
