/**
 * Main game hook for Goalscorer Recall.
 *
 * Manages game state using useReducer pattern, integrates with:
 * - Timer countdown via useCountdownTimer
 * - Fuzzy validation via validateGuess from career-path
 * - Local persistence via saveAttempt from database
 */

import { useReducer, useCallback, useEffect, useMemo, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import {
  GoalscorerRecallState,
  GoalscorerRecallAction,
  GoalscorerRecallContent,
  GoalWithState,
  Goal,
  TIMER_DURATION,
  RestoreProgressPayload,
} from '../types/goalscorerRecall.types';
import { useCountdownTimer } from './useCountdownTimer';
import { calculateGoalscorerScore } from '../utils/scoring';
import { generateGoalscorerShareText } from '../utils/share';
import {
  validateGuess,
  normalizeString,
} from '@/features/career-path/utils/validation';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import { useHaptics } from '@/hooks/useHaptics';
import type { ParsedLocalPuzzle, LocalAttempt } from '@/types/database';

/**
 * Create initial game state.
 */
function createInitialState(): GoalscorerRecallState {
  return {
    gameStatus: 'idle',
    timeRemaining: TIMER_DURATION,
    foundScorers: new Set<string>(),
    goals: [],
    currentGuess: '',
    lastGuessCorrect: false,
    lastGuessIncorrect: false,
    score: null,
    attemptSaved: false,
    startedAt: null,
    attemptId: null,
    restoredTimeRemaining: null,
  };
}

/**
 * Reducer for goalscorer recall game state.
 */
function reducer(
  state: GoalscorerRecallState,
  action: GoalscorerRecallAction
): GoalscorerRecallState {
  switch (action.type) {
    case 'INIT_GOALS':
      return {
        ...state,
        goals: action.payload,
      };

    case 'START_GAME':
      return {
        ...state,
        gameStatus: 'playing',
        startedAt: new Date().toISOString(),
      };

    case 'TICK':
      return {
        ...state,
        timeRemaining: Math.max(0, state.timeRemaining - 1),
      };

    case 'CORRECT_GUESS': {
      const { scorer } = action.payload;
      const normalizedScorer = normalizeString(scorer);
      const newFoundScorers = new Set(state.foundScorers);
      newFoundScorers.add(normalizedScorer);

      // Mark all goals by this scorer as found
      const updatedGoals = state.goals.map((goal) =>
        normalizeString(goal.scorer) === normalizedScorer
          ? { ...goal, found: true }
          : goal
      );

      return {
        ...state,
        foundScorers: newFoundScorers,
        goals: updatedGoals,
        currentGuess: '',
        lastGuessCorrect: true,
        lastGuessIncorrect: false,
      };
    }

    case 'INCORRECT_GUESS':
      return {
        ...state,
        currentGuess: '',
        lastGuessCorrect: false,
        lastGuessIncorrect: true,
      };

    case 'DUPLICATE_GUESS':
      // Silently clear input, no feedback
      return {
        ...state,
        currentGuess: '',
        lastGuessCorrect: false,
        lastGuessIncorrect: false,
      };

    case 'SET_CURRENT_GUESS':
      return {
        ...state,
        currentGuess: action.payload,
      };

    case 'CLEAR_FEEDBACK':
      return {
        ...state,
        lastGuessCorrect: false,
        lastGuessIncorrect: false,
      };

    case 'TIME_UP':
    case 'GIVE_UP':
      return {
        ...state,
        gameStatus: 'lost',
        score: action.payload,
      };

    case 'ALL_FOUND':
      return {
        ...state,
        gameStatus: 'won',
        score: action.payload,
      };

    case 'ATTEMPT_SAVED':
      return {
        ...state,
        attemptSaved: true,
      };

    case 'RESET':
      return createInitialState();

    case 'RESTORE_PROGRESS': {
      const { attemptId, foundScorers, timeRemaining, startedAt } =
        action.payload;

      // Update goals with found status based on restored foundScorers
      const updatedGoals = state.goals.map((goal) => ({
        ...goal,
        found:
          foundScorers.has(normalizeString(goal.scorer)) ||
          (goal.isOwnGoal ?? false),
      }));

      return {
        ...state,
        attemptId,
        foundScorers,
        goals: updatedGoals,
        gameStatus: 'playing',
        startedAt,
        restoredTimeRemaining: timeRemaining,
      };
    }

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
      };

    default:
      return state;
  }
}

/**
 * Get unique scorers from goals, excluding own goals.
 */
export function getUniqueScorers(goals: Goal[]): string[] {
  const scorers = new Set<string>();
  for (const goal of goals) {
    if (!goal.isOwnGoal) {
      scorers.add(goal.scorer);
    }
  }
  return Array.from(scorers);
}

/**
 * Initialize goals with state from puzzle content.
 * Own goals are marked as found (auto-revealed).
 */
function initializeGoals(goals: Goal[]): GoalWithState[] {
  return goals
    .map((goal, index) => ({
      ...goal,
      id: `goal-${index}`,
      found: goal.isOwnGoal ?? false, // Own goals start revealed
      displayOrder: index,
    }))
    .sort((a, b) => a.minute - b.minute);
}

/**
 * Main hook for Goalscorer Recall game.
 */
export function useGoalscorerRecallGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(reducer, createInitialState());
  const { triggerNotification, triggerHeavy, triggerSelection } = useHaptics();
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse puzzle content
  const puzzleContent = useMemo<GoalscorerRecallContent | null>(() => {
    if (!puzzle?.content) return null;
    return puzzle.content as GoalscorerRecallContent;
  }, [puzzle]);

  // Get unique scorers (excluding own goals)
  const uniqueScorers = useMemo(() => {
    if (!puzzleContent) return [];
    return getUniqueScorers(puzzleContent.goals);
  }, [puzzleContent]);

  // Total unique scorers count
  const totalScorers = uniqueScorers.length;

  // Number of found scorers
  const foundScorersCount = state.foundScorers.size;

  // Check if all scorers are found
  const allFound = foundScorersCount === totalScorers && totalScorers > 0;

  // Use refs for values that callbacks need to access current values
  const foundScorersCountRef = useRef(foundScorersCount);
  const totalScorersRef = useRef(totalScorers);
  const timerRef = useRef<{ timeRemaining: number; stop: () => void } | null>(null);

  useEffect(() => {
    foundScorersCountRef.current = foundScorersCount;
  }, [foundScorersCount]);

  useEffect(() => {
    totalScorersRef.current = totalScorers;
  }, [totalScorers]);

  // Initialize goals when puzzle loads
  useEffect(() => {
    if (puzzleContent?.goals) {
      const initialized = initializeGoals(puzzleContent.goals);
      dispatch({ type: 'INIT_GOALS', payload: initialized });
    }
  }, [puzzleContent]);

  // Check for existing in-progress attempt on mount (restore progress)
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle) return;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);

        // Only restore in-progress attempts (completed=0)
        if (existingAttempt && !existingAttempt.completed) {
          const meta = existingAttempt.metadata as {
            foundScorers?: string[];
            timeRemaining?: number;
            startedAt?: string;
          };

          dispatch({
            type: 'RESTORE_PROGRESS',
            payload: {
              attemptId: existingAttempt.id,
              foundScorers: new Set(meta.foundScorers ?? []),
              timeRemaining: meta.timeRemaining ?? TIMER_DURATION,
              startedAt: meta.startedAt ?? existingAttempt.started_at ?? new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error('Failed to check for resume:', error);
      }
    }

    checkForResume();
  }, [puzzle?.id]);

  // Timer callbacks - use refs to always get current values
  const handleTimeUp = useCallback(() => {
    const score = calculateGoalscorerScore(
      foundScorersCountRef.current,
      totalScorersRef.current,
      0,
      false
    );
    dispatch({ type: 'TIME_UP', payload: score });
    triggerNotification('error');
  }, [triggerNotification]);

  const handleTick = useCallback(() => {
    dispatch({ type: 'TICK' });
  }, []);

  // Timer hook - use restored time if available
  const timer = useCountdownTimer({
    initialSeconds: state.restoredTimeRemaining ?? TIMER_DURATION,
    onTick: handleTick,
    onFinish: handleTimeUp,
  });

  // Update timer ref synchronously (not in effect) so callbacks have current values
  timerRef.current = {
    timeRemaining: timer.timeRemaining,
    stop: timer.stop,
  };

  // Set timer and auto-start when restored from saved progress
  useEffect(() => {
    if (state.restoredTimeRemaining !== null && state.gameStatus === 'playing') {
      timer.setTo(state.restoredTimeRemaining);
      timer.start();
    }
  }, [state.restoredTimeRemaining, state.gameStatus, timer]);

  // Generate attemptId on game start if not already set
  useEffect(() => {
    if (state.gameStatus === 'playing' && !state.attemptId) {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
    }
  }, [state.gameStatus, state.attemptId]);

  // Save progress when foundScorers changes (progressive save)
  useEffect(() => {
    if (
      state.gameStatus === 'playing' &&
      state.foundScorers.size > 0 &&
      puzzle &&
      state.attemptId &&
      state.startedAt
    ) {
      const saveProgress = async () => {
        const attempt: LocalAttempt = {
          id: state.attemptId!,
          puzzle_id: puzzle.id,
          completed: 0, // In-progress
          score: null,
          score_display: null,
          metadata: JSON.stringify({
            foundScorers: Array.from(state.foundScorers),
            timeRemaining: timer.timeRemaining,
            startedAt: state.startedAt,
          }),
          started_at: state.startedAt,
          completed_at: null,
          synced: 0,
        };

        try {
          await saveAttempt(attempt);
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      };

      saveProgress();
    }
  }, [state.foundScorers.size, state.gameStatus, puzzle, state.attemptId, state.startedAt, timer.timeRemaining]);

  // Start game
  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
    timer.start();
    triggerSelection();
  }, [timer, triggerSelection]);

  // Submit guess
  const submitGuess = useCallback(() => {
    const guess = state.currentGuess.trim();
    if (!guess || state.gameStatus !== 'playing') return;

    // Check each unique scorer for a match
    for (const scorer of uniqueScorers) {
      const { isMatch } = validateGuess(guess, scorer);

      if (isMatch) {
        const normalizedScorer = normalizeString(scorer);

        // Check if already found (duplicate)
        if (state.foundScorers.has(normalizedScorer)) {
          dispatch({ type: 'DUPLICATE_GUESS' });
          return;
        }

        // Count how many goals this scorer has
        const goalsScored = puzzleContent?.goals.filter(
          (g) =>
            normalizeString(g.scorer) === normalizedScorer && !g.isOwnGoal
        ).length ?? 0;

        dispatch({
          type: 'CORRECT_GUESS',
          payload: { scorer, goalsFound: goalsScored },
        });

        // Check if this completes the game (found all scorers)
        const newFoundCount = state.foundScorers.size + 1;
        const currentTime = timerRef.current?.timeRemaining ?? 0;
        if (newFoundCount === totalScorers && currentTime > 0) {
          // All found! Stop timer and calculate score
          timerRef.current?.stop();
          const winScore = calculateGoalscorerScore(
            newFoundCount,
            totalScorers,
            currentTime,
            true
          );
          dispatch({ type: 'ALL_FOUND', payload: winScore });
          triggerNotification('success');
        } else {
          // Haptic feedback for correct guess
          triggerHeavy();
        }

        // Clear feedback after delay
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'CLEAR_FEEDBACK' });
        }, 1000);

        return;
      }
    }

    // No match found - incorrect guess
    dispatch({ type: 'INCORRECT_GUESS' });
    triggerNotification('warning');

    // Clear shake feedback
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'CLEAR_FEEDBACK' });
    }, 500);
  }, [
    state.currentGuess,
    state.gameStatus,
    state.foundScorers,
    uniqueScorers,
    puzzleContent,
    totalScorers,
    triggerHeavy,
    triggerNotification,
  ]);

  // Give up
  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing') return;

    timer.stop();
    const score = calculateGoalscorerScore(
      foundScorersCount,
      totalScorers,
      timer.timeRemaining,
      false
    );
    dispatch({ type: 'GIVE_UP', payload: score });
    triggerNotification('error');
  }, [
    state.gameStatus,
    timer,
    foundScorersCount,
    totalScorers,
    triggerNotification,
  ]);

  // Set current guess
  const setCurrentGuess = useCallback((text: string) => {
    dispatch({ type: 'SET_CURRENT_GUESS', payload: text });
  }, []);

  // Save attempt when game ends (use existing attemptId if available)
  useEffect(() => {
    if (
      state.gameStatus !== 'idle' &&
      state.gameStatus !== 'playing' &&
      state.score &&
      !state.attemptSaved &&
      puzzle
    ) {
      const saveGameAttempt = async () => {
        const now = new Date().toISOString();

        const attempt: LocalAttempt = {
          id: state.attemptId ?? Crypto.randomUUID(),
          puzzle_id: puzzle.id,
          completed: 1,
          score: state.score!.percentage,
          score_display: `${state.score!.percentage}%`,
          metadata: JSON.stringify({
            scorersFound: state.score!.scorersFound,
            totalScorers: state.score!.totalScorers,
            timeRemaining: state.score!.timeRemaining,
            timeBonus: state.score!.timeBonus,
            won: state.gameStatus === 'won',
          }),
          started_at: state.startedAt,
          completed_at: now,
          synced: 0,
        };

        try {
          await saveAttempt(attempt);
          dispatch({ type: 'ATTEMPT_SAVED' });
        } catch (error) {
          console.error('Failed to save attempt:', error);
        }
      };

      saveGameAttempt();
    }
  }, [state.gameStatus, state.score, state.attemptSaved, puzzle, state.startedAt]);

  // Share result
  const shareResult = useCallback(async () => {
    if (!state.score || !puzzleContent) return { success: false };

    const shareText = generateGoalscorerShareText(
      state.score,
      state.goals,
      {
        homeTeam: puzzleContent.home_team,
        awayTeam: puzzleContent.away_team,
        homeScore: puzzleContent.home_score,
        awayScore: puzzleContent.away_score,
      },
      puzzle?.puzzle_date
    );

    try {
      // Use clipboard as primary method
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(shareText);
      triggerSelection();
      return { success: true, method: 'clipboard' as const };
    } catch (error) {
      console.error('Failed to share:', error);
      return { success: false };
    }
  }, [state.score, state.goals, puzzleContent, puzzle, triggerSelection]);

  // Reset game
  const resetGame = useCallback(() => {
    timer.reset();
    dispatch({ type: 'RESET' });
    if (puzzleContent?.goals) {
      const initialized = initializeGoals(puzzleContent.goals);
      dispatch({ type: 'INIT_GOALS', payload: initialized });
    }
  }, [timer, puzzleContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Split goals by team for scoreboard
  const homeGoals = useMemo(
    () => state.goals.filter((g) => g.team === 'home'),
    [state.goals]
  );

  const awayGoals = useMemo(
    () => state.goals.filter((g) => g.team === 'away'),
    [state.goals]
  );

  return {
    // State
    state,

    // Parsed content
    puzzleContent,

    // Derived data
    homeGoals,
    awayGoals,
    totalScorers,
    foundScorersCount,
    allFound,

    // Timer state
    timeRemaining: timer.timeRemaining,
    isTimerRunning: timer.isRunning,

    // Actions
    startGame,
    submitGuess,
    giveUp,
    setCurrentGuess,
    shareResult,
    resetGame,
  };
}
