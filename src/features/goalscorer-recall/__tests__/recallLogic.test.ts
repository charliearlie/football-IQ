/**
 * Tests for Goalscorer Recall game logic.
 *
 * Tests multi-goal handling, duplicate detection, own goals,
 * and fuzzy matching integration.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useGoalscorerRecallGame, getUniqueScorers } from '../hooks/useGoalscorerRecallGame';
import type { GoalscorerRecallContent, Goal } from '../types/goalscorerRecall.types';
import type { ParsedLocalPuzzle } from '@/types/database';

// Mock dependencies
jest.mock('@/lib/database', () => ({
  saveAttempt: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerNotification: jest.fn(),
    triggerHeavy: jest.fn(),
    triggerSelection: jest.fn(),
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-123',
}));


// Helper to create mock puzzle
function createMockPuzzle(goals: Goal[]): ParsedLocalPuzzle {
  const content: GoalscorerRecallContent = {
    home_team: 'Arsenal',
    away_team: 'Leicester',
    home_score: goals.filter((g) => g.team === 'home' && !g.isOwnGoal).length,
    away_score: goals.filter((g) => g.team === 'away' && !g.isOwnGoal).length,
    competition: 'Premier League',
    match_date: '15 May 2023',
    goals,
  };

  return {
    id: 'puzzle-123',
    game_mode: 'guess_the_goalscorers',
    puzzle_date: '2023-05-15',
    content,
    difficulty: null,
    synced_at: null,
  };
}

describe('getUniqueScorers', () => {
  it('returns unique scorers excluding own goals', () => {
    const goals: Goal[] = [
      { scorer: 'Salah', minute: 10, team: 'home' },
      { scorer: 'Salah', minute: 25, team: 'home' },
      { scorer: 'Mane', minute: 45, team: 'home' },
      { scorer: 'Smith', minute: 60, team: 'away', isOwnGoal: true },
    ];

    const unique = getUniqueScorers(goals);
    expect(unique).toHaveLength(2);
    expect(unique).toContain('Salah');
    expect(unique).toContain('Mane');
    expect(unique).not.toContain('Smith');
  });

  it('returns empty array for no goals', () => {
    expect(getUniqueScorers([])).toEqual([]);
  });
});

describe('useGoalscorerRecallGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('initializes with idle status', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Salah', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      expect(result.current.state.gameStatus).toBe('idle');
      expect(result.current.timeRemaining).toBe(60);
    });

    it('auto-reveals own goals at initialization', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Salah', minute: 10, team: 'home' },
        { scorer: 'Smith', minute: 30, team: 'away', isOwnGoal: true },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Own goal should be found
      const ownGoal = result.current.state.goals.find(
        (g) => g.scorer === 'Smith'
      );
      expect(ownGoal?.found).toBe(true);

      // Regular goal should not be found
      const regularGoal = result.current.state.goals.find(
        (g) => g.scorer === 'Salah'
      );
      expect(regularGoal?.found).toBe(false);
    });

    it('does not count own goals in totalScorers', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Salah', minute: 10, team: 'home' },
        { scorer: 'Mane', minute: 20, team: 'home' },
        { scorer: 'Smith', minute: 30, team: 'away', isOwnGoal: true },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      expect(result.current.totalScorers).toBe(2);
    });
  });

  describe('multi-goal handling', () => {
    it('fills all slots when player scored multiple goals', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
        { scorer: 'Mo Salah', minute: 25, team: 'home' },
        { scorer: 'Mo Salah', minute: 80, team: 'home' },
        { scorer: 'Sadio Mane', minute: 45, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      // Start game
      act(() => {
        result.current.startGame();
      });

      // Guess Salah
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      // All 3 of Salah's goals should be found
      const salahGoals = result.current.state.goals.filter(
        (g) => g.scorer === 'Mo Salah'
      );
      expect(salahGoals).toHaveLength(3);
      salahGoals.forEach((goal) => {
        expect(goal.found).toBe(true);
      });

      // Mane's goal should still be unfound
      const maneGoal = result.current.state.goals.find(
        (g) => g.scorer === 'Sadio Mane'
      );
      expect(maneGoal?.found).toBe(false);
    });

    it('increments found count correctly for hat-tricks', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
        { scorer: 'Mo Salah', minute: 25, team: 'home' },
        { scorer: 'Mo Salah', minute: 80, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Only 1 unique scorer
      expect(result.current.totalScorers).toBe(1);
      expect(result.current.foundScorersCount).toBe(0);

      // Guess Salah
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Found count should be 1 (unique scorers)
      expect(result.current.foundScorersCount).toBe(1);
    });
  });

  describe('duplicate detection', () => {
    it('ignores guess for already-found scorer', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
        { scorer: 'Sadio Mane', minute: 45, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // First guess - Salah
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.foundScorersCount).toBe(1);
      expect(result.current.state.lastGuessCorrect).toBe(true);

      // Clear feedback first
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      // Second guess - Salah again
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Count should not change
      expect(result.current.foundScorersCount).toBe(1);

      // Should not trigger correct or incorrect feedback
      expect(result.current.state.lastGuessCorrect).toBe(false);
      expect(result.current.state.lastGuessIncorrect).toBe(false);
    });
  });

  describe('fuzzy matching', () => {
    it('matches surname only', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Lionel Messi', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      act(() => {
        result.current.setCurrentGuess('Messi');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.foundScorersCount).toBe(1);
      expect(result.current.state.lastGuessCorrect).toBe(true);
    });

    it('handles accented names', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mesut Özil', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Guess without accent
      act(() => {
        result.current.setCurrentGuess('Ozil');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.foundScorersCount).toBe(1);
    });

    it('matches with minor typos', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Slight typo (Mo Sallah vs Mo Salah)
      act(() => {
        result.current.setCurrentGuess('Mo Sallah');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.foundScorersCount).toBe(1);
    });

    it('rejects completely wrong guesses', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      act(() => {
        result.current.setCurrentGuess('Cristiano Ronaldo');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.foundScorersCount).toBe(0);
      expect(result.current.state.lastGuessIncorrect).toBe(true);
    });
  });

  describe('game end conditions', () => {
    it('wins when all scorers found before time', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Advance some time
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.state.gameStatus).toBe('won');
      expect(result.current.state.score?.won).toBe(true);
      expect(result.current.state.score?.timeRemaining).toBe(50);
    });

    it('loses when time runs out', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
        { scorer: 'Sadio Mane', minute: 45, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Find one scorer
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Let timer run out
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(result.current.state.gameStatus).toBe('lost');
      expect(result.current.state.score?.won).toBe(false);
      expect(result.current.state.score?.percentage).toBe(50);
    });

    it('loses when player gives up', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
        { scorer: 'Sadio Mane', minute: 45, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Advance some time
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // Give up
      act(() => {
        result.current.giveUp();
      });

      expect(result.current.state.gameStatus).toBe('lost');
      expect(result.current.state.score?.won).toBe(false);
      expect(result.current.state.score?.timeRemaining).toBe(40);
    });

    it('handles race condition: ALL_FOUND takes precedence over TIME_UP', () => {
      // This test verifies the fix for the race condition where the timer
      // callback could fire after ALL_FOUND was dispatched, causing the
      // wrong modal to briefly appear.
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      // Advance to just before time runs out (59 seconds)
      act(() => {
        jest.advanceTimersByTime(59000);
      });

      expect(result.current.timeRemaining).toBe(1);
      expect(result.current.state.gameStatus).toBe('playing');

      // Find the last scorer with only 1 second remaining
      // This creates a potential race between ALL_FOUND and TIME_UP
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Should be won, not lost
      expect(result.current.state.gameStatus).toBe('won');
      expect(result.current.state.score?.won).toBe(true);

      // Even if timer fires after this, status should remain 'won'
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Verify status hasn't changed to 'lost'
      expect(result.current.state.gameStatus).toBe('won');
    });
  });

  describe('score calculation', () => {
    it('calculates 100% when all unique scorers found', () => {
      // Use shorter names so surname matching works (40% threshold)
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
        { scorer: 'Mo Salah', minute: 25, team: 'home' }, // Brace
        { scorer: 'Sadio Mane', minute: 45, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      expect(result.current.state.gameStatus).toBe('playing');
      expect(result.current.totalScorers).toBe(2);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.timeRemaining).toBe(50);

      // Find first scorer (Salah is 5 chars, Mo Salah is 8 chars = 62.5% > 40%)
      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.foundScorersCount).toBe(1);
      expect(result.current.state.gameStatus).toBe('playing');

      // Find second scorer
      act(() => {
        result.current.setCurrentGuess('Mane');
      });
      act(() => {
        result.current.submitGuess();
      });

      // Verify game ended with win
      expect(result.current.state.gameStatus).toBe('won');
      expect(result.current.state.score?.percentage).toBe(100);
      expect(result.current.state.score?.scorersFound).toBe(2);
      expect(result.current.state.score?.totalScorers).toBe(2);
    });

    it('awards time bonus when all found with time remaining', () => {
      // Use shorter name so surname matching works
      const puzzle = createMockPuzzle([
        { scorer: 'Mo Salah', minute: 10, team: 'home' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      act(() => {
        result.current.startGame();
      });

      act(() => {
        jest.advanceTimersByTime(15000); // 15 seconds
      });

      act(() => {
        result.current.setCurrentGuess('Salah');
      });
      act(() => {
        result.current.submitGuess();
      });

      expect(result.current.state.score?.timeRemaining).toBe(45);
      expect(result.current.state.score?.timeBonus).toBe(90); // 45 * 2
    });
  });

  describe('goal separation by team', () => {
    it('correctly splits goals into home and away', () => {
      const puzzle = createMockPuzzle([
        { scorer: 'Salah', minute: 10, team: 'home' },
        { scorer: 'Mane', minute: 25, team: 'home' },
        { scorer: 'Vardy', minute: 45, team: 'away' },
        { scorer: 'Maddison', minute: 80, team: 'away' },
      ]);

      const { result } = renderHook(() => useGoalscorerRecallGame(puzzle));

      expect(result.current.homeGoals).toHaveLength(2);
      expect(result.current.awayGoals).toHaveLength(2);
    });
  });
});
