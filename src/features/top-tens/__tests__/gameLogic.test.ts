/**
 * Top Tens Game Logic Tests (TDD - Written First)
 *
 * Tests for the game reducer and state transitions.
 * These tests are written BEFORE implementation code.
 */

import {
  topTensReducer,
  createInitialState,
} from '../hooks/useTopTensGame';
import {
  TopTensState,
  TopTensAction,
  TopTensContent,
  TopTensScore,
  RankIndex,
  createInitialClimbingState,
} from '../types/topTens.types';

// Mock puzzle content for testing
const mockPuzzleContent: TopTensContent = {
  title: 'Top 10 Premier League All-Time Goalscorers',
  category: 'Premier League',
  answers: [
    { name: 'Alan Shearer', aliases: ['Shearer'], info: '260 goals' },
    { name: 'Wayne Rooney', aliases: ['Rooney'], info: '208 goals' },
    { name: 'Andrew Cole', aliases: ['Andy Cole', 'Cole'], info: '187 goals' },
    { name: 'Sergio Aguero', aliases: ['Aguero'], info: '184 goals' },
    { name: 'Frank Lampard', aliases: ['Lampard'], info: '177 goals' },
    { name: 'Thierry Henry', aliases: ['Henry'], info: '175 goals' },
    { name: 'Harry Kane', aliases: ['Kane'], info: '166 goals' },
    { name: 'Robbie Fowler', aliases: ['Fowler'], info: '163 goals' },
    { name: 'Jermain Defoe', aliases: ['Defoe'], info: '162 goals' },
    { name: 'Michael Owen', aliases: ['Owen'], info: '150 goals' },
  ],
};

describe('createInitialState', () => {
  it('returns correct initial state', () => {
    const state = createInitialState();

    expect(state.gameStatus).toBe('playing');
    expect(state.rankSlots).toHaveLength(10);
    expect(state.foundCount).toBe(0);
    expect(state.wrongGuessCount).toBe(0);
    expect(state.currentGuess).toBe('');
    expect(state.lastGuessCorrect).toBe(false);
    expect(state.lastGuessIncorrect).toBe(false);
    expect(state.lastGuessDuplicate).toBe(false);
    expect(state.score).toBeNull();
    expect(state.attemptId).toBeNull();
    expect(state.attemptSaved).toBe(false);
  });

  it('creates 10 rank slots with correct rank numbers', () => {
    const state = createInitialState();

    state.rankSlots.forEach((slot, index) => {
      expect(slot.rank).toBe(index + 1); // Ranks 1-10
      expect(slot.found).toBe(false);
      expect(slot.answer).toBeNull();
    });
  });
});

describe('topTensReducer', () => {
  describe('SET_CURRENT_GUESS', () => {
    it('updates current guess text', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'SET_CURRENT_GUESS', payload: 'Shearer' };

      const newState = topTensReducer(state, action);

      expect(newState.currentGuess).toBe('Shearer');
    });

    it('clears feedback flags when setting guess', () => {
      const state: TopTensState = {
        ...createInitialState(),
        lastGuessIncorrect: true,
        lastGuessDuplicate: true,
      };
      const action: TopTensAction = { type: 'SET_CURRENT_GUESS', payload: 'test' };

      const newState = topTensReducer(state, action);

      expect(newState.lastGuessIncorrect).toBe(false);
      expect(newState.lastGuessDuplicate).toBe(false);
    });
  });

  describe('CORRECT_GUESS', () => {
    it('reveals answer at correct rank position', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: 0 as RankIndex,
          answer: mockPuzzleContent.answers[0],
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.rankSlots[0].found).toBe(true);
      expect(newState.rankSlots[0].answer).toEqual(mockPuzzleContent.answers[0]);
    });

    it('increments found count', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: 5 as RankIndex,
          answer: mockPuzzleContent.answers[5],
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.foundCount).toBe(1);
    });

    it('clears current guess input', () => {
      const state: TopTensState = {
        ...createInitialState(),
        currentGuess: 'Shearer',
      };
      const action: TopTensAction = {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: 0 as RankIndex,
          answer: mockPuzzleContent.answers[0],
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.currentGuess).toBe('');
    });

    it('sets lastGuessCorrect flag', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: 0 as RankIndex,
          answer: mockPuzzleContent.answers[0],
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.lastGuessCorrect).toBe(true);
      expect(newState.lastGuessIncorrect).toBe(false);
    });

    it('does not affect other rank slots', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: 3 as RankIndex,
          answer: mockPuzzleContent.answers[3],
        },
      };

      const newState = topTensReducer(state, action);

      // Only rank 4 (index 3) should be revealed
      expect(newState.rankSlots[0].found).toBe(false);
      expect(newState.rankSlots[1].found).toBe(false);
      expect(newState.rankSlots[2].found).toBe(false);
      expect(newState.rankSlots[3].found).toBe(true);
      expect(newState.rankSlots[4].found).toBe(false);
    });
  });

  describe('INCORRECT_GUESS', () => {
    it('triggers shake animation flag', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'INCORRECT_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.lastGuessIncorrect).toBe(true);
      expect(newState.lastGuessCorrect).toBe(false);
    });

    it('clears current guess input', () => {
      const state: TopTensState = {
        ...createInitialState(),
        currentGuess: 'wrong answer',
      };
      const action: TopTensAction = { type: 'INCORRECT_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.currentGuess).toBe('');
    });

    it('increments wrong guess count', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'INCORRECT_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.wrongGuessCount).toBe(1);
    });

    it('does not change found count', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'INCORRECT_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.foundCount).toBe(0);
    });
  });

  describe('DUPLICATE_GUESS', () => {
    it('shows already found feedback', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'DUPLICATE_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.lastGuessDuplicate).toBe(true);
    });

    it('does not count as wrong guess', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'DUPLICATE_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.wrongGuessCount).toBe(0);
    });

    it('clears current guess input', () => {
      const state: TopTensState = {
        ...createInitialState(),
        currentGuess: 'Shearer',
      };
      const action: TopTensAction = { type: 'DUPLICATE_GUESS' };

      const newState = topTensReducer(state, action);

      expect(newState.currentGuess).toBe('');
    });
  });

  describe('CLEAR_FEEDBACK', () => {
    it('clears all feedback flags', () => {
      const state: TopTensState = {
        ...createInitialState(),
        lastGuessCorrect: true,
        lastGuessIncorrect: true,
        lastGuessDuplicate: true,
      };
      const action: TopTensAction = { type: 'CLEAR_FEEDBACK' };

      const newState = topTensReducer(state, action);

      expect(newState.lastGuessCorrect).toBe(false);
      expect(newState.lastGuessIncorrect).toBe(false);
      expect(newState.lastGuessDuplicate).toBe(false);
    });
  });

  describe('ALL_FOUND (win condition)', () => {
    it('sets gameStatus to won', () => {
      const state = createInitialState();
      const score: TopTensScore = {
        points: 10,
        maxPoints: 10,
        foundCount: 10,
        wrongGuessCount: 3,
        won: true,
      };
      const action: TopTensAction = { type: 'ALL_FOUND', payload: score };

      const newState = topTensReducer(state, action);

      expect(newState.gameStatus).toBe('won');
    });

    it('sets the score', () => {
      const state = createInitialState();
      const score: TopTensScore = {
        points: 10,
        maxPoints: 10,
        foundCount: 10,
        wrongGuessCount: 5,
        won: true,
      };
      const action: TopTensAction = { type: 'ALL_FOUND', payload: score };

      const newState = topTensReducer(state, action);

      expect(newState.score).toEqual(score);
    });
  });

  describe('GIVE_UP', () => {
    it('reveals all remaining answers', () => {
      // Start with 3 found
      const state: TopTensState = {
        ...createInitialState(),
        foundCount: 3,
        rankSlots: createInitialState().rankSlots.map((slot, i) => ({
          ...slot,
          found: i < 3,
          answer: i < 3 ? mockPuzzleContent.answers[i] : null,
        })),
      };

      const score: TopTensScore = {
        points: 3,
        maxPoints: 10,
        foundCount: 3,
        wrongGuessCount: 5,
        won: false,
      };

      const action: TopTensAction = {
        type: 'GIVE_UP',
        payload: { score, content: mockPuzzleContent },
      };

      const newState = topTensReducer(state, action);

      // All slots should now be revealed
      newState.rankSlots.forEach((slot, i) => {
        expect(slot.found).toBe(true);
        expect(slot.answer).toEqual(mockPuzzleContent.answers[i]);
      });
    });

    it('sets gameStatus to lost', () => {
      const state = createInitialState();
      const score: TopTensScore = {
        points: 5,
        maxPoints: 10,
        foundCount: 5,
        wrongGuessCount: 10,
        won: false,
      };
      const action: TopTensAction = {
        type: 'GIVE_UP',
        payload: { score, content: mockPuzzleContent },
      };

      const newState = topTensReducer(state, action);

      expect(newState.gameStatus).toBe('lost');
    });

    it('sets the partial score', () => {
      const state = createInitialState();
      const score: TopTensScore = {
        points: 7,
        maxPoints: 10,
        foundCount: 7,
        wrongGuessCount: 4,
        won: false,
      };
      const action: TopTensAction = {
        type: 'GIVE_UP',
        payload: { score, content: mockPuzzleContent },
      };

      const newState = topTensReducer(state, action);

      expect(newState.score).toEqual(score);
    });
  });

  describe('SET_ATTEMPT_ID', () => {
    it('sets the attempt ID', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'SET_ATTEMPT_ID', payload: 'attempt-123' };

      const newState = topTensReducer(state, action);

      expect(newState.attemptId).toBe('attempt-123');
    });

    it('sets startedAt if not already set', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'SET_ATTEMPT_ID', payload: 'attempt-123' };

      const newState = topTensReducer(state, action);

      expect(newState.startedAt).not.toBeNull();
    });
  });

  describe('RESTORE_PROGRESS', () => {
    it('restores found indices', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-attempt',
          startedAt: '2024-01-01T00:00:00Z',
          foundIndices: [0, 2, 5],
          wrongGuessCount: 3,
          answers: mockPuzzleContent.answers,
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.rankSlots[0].found).toBe(true);
      expect(newState.rankSlots[1].found).toBe(false);
      expect(newState.rankSlots[2].found).toBe(true);
      expect(newState.rankSlots[5].found).toBe(true);
      expect(newState.foundCount).toBe(3);
    });

    it('restores attempt ID and startedAt', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-attempt',
          startedAt: '2024-01-01T00:00:00Z',
          foundIndices: [1],
          wrongGuessCount: 2,
          answers: mockPuzzleContent.answers,
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.attemptId).toBe('restored-attempt');
      expect(newState.startedAt).toBe('2024-01-01T00:00:00Z');
    });

    it('restores wrong guess count', () => {
      const state = createInitialState();
      const action: TopTensAction = {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-attempt',
          startedAt: '2024-01-01T00:00:00Z',
          foundIndices: [],
          wrongGuessCount: 7,
          answers: mockPuzzleContent.answers,
        },
      };

      const newState = topTensReducer(state, action);

      expect(newState.wrongGuessCount).toBe(7);
    });
  });

  describe('ATTEMPT_SAVED', () => {
    it('sets attemptSaved flag to true', () => {
      const state = createInitialState();
      const action: TopTensAction = { type: 'ATTEMPT_SAVED' };

      const newState = topTensReducer(state, action);

      expect(newState.attemptSaved).toBe(true);
    });
  });

  describe('RESET_GAME', () => {
    it('resets to initial state', () => {
      const modifiedState: TopTensState = {
        gameStatus: 'won',
        rankSlots: createInitialState().rankSlots.map((s) => ({ ...s, found: true })),
        foundCount: 10,
        wrongGuessCount: 5,
        currentGuess: 'test',
        lastGuessCorrect: true,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
        score: { points: 10, maxPoints: 10, foundCount: 10, wrongGuessCount: 5, won: true },
        attemptId: 'old-attempt',
        attemptSaved: true,
        startedAt: '2024-01-01T00:00:00Z',
        climbing: createInitialClimbingState(),
      };
      const action: TopTensAction = { type: 'RESET_GAME' };

      const newState = topTensReducer(modifiedState, action);

      expect(newState).toEqual(createInitialState());
    });
  });
});

describe('win state detection', () => {
  it('reaches win state when foundCount is 10', () => {
    let state = createInitialState();

    // Simulate finding all 10 answers
    for (let i = 0; i < 10; i++) {
      state = topTensReducer(state, {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: i as RankIndex,
          answer: mockPuzzleContent.answers[i],
        },
      });
    }

    expect(state.foundCount).toBe(10);
    // Note: The ALL_FOUND action would be dispatched by the hook, not the reducer
    // The reducer just tracks foundCount; the hook detects and dispatches ALL_FOUND
  });

  it('does not reach win state at 9 found', () => {
    let state = createInitialState();

    // Find 9 answers
    for (let i = 0; i < 9; i++) {
      state = topTensReducer(state, {
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: i as RankIndex,
          answer: mockPuzzleContent.answers[i],
        },
      });
    }

    expect(state.foundCount).toBe(9);
    expect(state.gameStatus).toBe('playing');
  });
});
