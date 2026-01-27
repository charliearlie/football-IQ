import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useHaptics } from '@/hooks/useHaptics';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import { LocalAttempt } from '@/types/database';
import {
  TopicalQuizState,
  TopicalQuizAction,
  TopicalQuizContent,
  QuizAnswer,
  RestoreProgressPayload,
  TOTAL_QUESTIONS,
  AUTO_ADVANCE_DELAY_MS,
} from '../types/topicalQuiz.types';
import { calculateQuizScore, TopicalQuizScore } from '../utils/quizScoring';
import { generateQuizEmojiGrid } from '../utils/quizScoreDisplay';
import { shareQuizResult, ShareResult } from '../utils/quizShare';

/**
 * Create the initial state for the topical quiz game.
 */
function createInitialState(): TopicalQuizState {
  return {
    currentQuestionIndex: 0,
    answers: [],
    gameStatus: 'playing',
    score: null,
    attemptSaved: false,
    startedAt: new Date().toISOString(),
    showingFeedback: false,
    lastAnsweredIndex: null,
    attemptId: null,
  };
}

/**
 * Reducer for topical quiz game state.
 */
function quizReducer(
  state: TopicalQuizState,
  action: TopicalQuizAction
): TopicalQuizState {
  switch (action.type) {
    case 'ANSWER_QUESTION': {
      const { selectedIndex, isCorrect } = action.payload;
      const newAnswer: QuizAnswer = {
        questionIndex: state.currentQuestionIndex,
        selectedIndex,
        isCorrect,
      };

      return {
        ...state,
        answers: [...state.answers, newAnswer],
        showingFeedback: true,
        lastAnsweredIndex: state.currentQuestionIndex,
      };
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentQuestionIndex + 1;

      // If we've answered all questions, stay at last index but game will complete
      if (nextIndex >= TOTAL_QUESTIONS) {
        return {
          ...state,
          showingFeedback: false,
        };
      }

      return {
        ...state,
        currentQuestionIndex: nextIndex,
        showingFeedback: false,
      };
    }

    case 'GAME_COMPLETE':
      return {
        ...state,
        gameStatus: 'complete',
        score: action.payload,
        showingFeedback: false,
      };

    case 'ATTEMPT_SAVED':
      return {
        ...state,
        attemptSaved: true,
      };

    case 'RESET':
      return createInitialState();

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
      };

    case 'RESTORE_PROGRESS':
      return {
        ...state,
        currentQuestionIndex: action.payload.currentQuestionIndex,
        answers: action.payload.answers,
        attemptId: action.payload.attemptId,
        startedAt: action.payload.startedAt,
      };

    default:
      return state;
  }
}

/**
 * Hook to manage Topical Quiz game state.
 *
 * Handles:
 * - Question progression (5 questions)
 * - Answer validation
 * - Auto-advance after 1.5s delay
 * - Scoring (2 points per correct, max 10)
 * - Feedback display states
 * - Attempt persistence to local database
 * - Share functionality
 *
 * @param puzzle - The current puzzle data
 * @returns Game state, actions, and utilities
 *
 * @example
 * ```tsx
 * const { state, currentQuestion, answerQuestion, shareResult } = useTopicalQuizGame(puzzle);
 * ```
 */
export function useTopicalQuizGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(quizReducer, createInitialState());
  const { triggerSuccess, triggerError, triggerSelection } = useHaptics();
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track current state for AppState callback
  const stateRef = useRef(state);
  stateRef.current = state;

  // Parse puzzle content
  const quizContent = useMemo<TopicalQuizContent | null>(() => {
    if (!puzzle?.content) return null;
    return puzzle.content as TopicalQuizContent;
  }, [puzzle]);

  // Get current question
  const currentQuestion = useMemo(() => {
    if (!quizContent) return null;
    return quizContent.questions[state.currentQuestionIndex] ?? null;
  }, [quizContent, state.currentQuestionIndex]);

  // Get all questions for progress display
  const questions = useMemo(() => {
    return quizContent?.questions ?? [];
  }, [quizContent]);

  // Computed values
  const isGameOver = state.gameStatus === 'complete';
  const isLastQuestion = state.currentQuestionIndex >= TOTAL_QUESTIONS - 1;
  const progressText = `${state.currentQuestionIndex + 1}/${TOTAL_QUESTIONS}`;

  // Count correct answers
  const correctCount = useMemo(() => {
    return state.answers.filter((a) => a.isCorrect).length;
  }, [state.answers]);

  // Get answer for a specific question index (for progress display)
  const getAnswerForQuestion = useCallback(
    (questionIndex: number): QuizAnswer | undefined => {
      return state.answers.find((a) => a.questionIndex === questionIndex);
    },
    [state.answers]
  );

  // Answer the current question
  const answerQuestion = useCallback(
    (selectedIndex: number) => {
      // Prevent answering during feedback or if game is over
      if (state.showingFeedback || isGameOver || !currentQuestion) {
        return;
      }

      const isCorrect = selectedIndex === currentQuestion.correctIndex;

      dispatch({
        type: 'ANSWER_QUESTION',
        payload: { selectedIndex, isCorrect },
      });

      // Haptic feedback
      if (isCorrect) {
        triggerSuccess();
      } else {
        triggerError();
      }

      // Schedule auto-advance
      advanceTimerRef.current = setTimeout(() => {
        if (state.currentQuestionIndex >= TOTAL_QUESTIONS - 1) {
          // Last question - complete game
          const finalCorrectCount =
            state.answers.filter((a) => a.isCorrect).length + (isCorrect ? 1 : 0);
          const finalScore = calculateQuizScore(finalCorrectCount);
          dispatch({ type: 'GAME_COMPLETE', payload: finalScore });
        } else {
          // Move to next question
          dispatch({ type: 'NEXT_QUESTION' });
        }
        triggerSelection();
      }, AUTO_ADVANCE_DELAY_MS);
    },
    [
      state.showingFeedback,
      state.currentQuestionIndex,
      state.answers,
      isGameOver,
      currentQuestion,
      triggerSuccess,
      triggerError,
      triggerSelection,
    ]
  );

  // Reset the game
  const resetGame = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }, []);

  // Share game result
  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !puzzle) {
      return {
        success: false,
        method: 'share',
      };
    }
    return shareQuizResult(state.score, state.answers, {
      puzzleDate: puzzle.puzzle_date,
    });
  }, [state.score, state.answers, puzzle]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  // Generate attemptId on mount if not resuming
  useEffect(() => {
    if (!state.attemptId && state.gameStatus === 'playing') {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
    }
  }, [state.attemptId, state.gameStatus]);

  // Check for existing in-progress attempt on mount
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle) return;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);
        if (existingAttempt && !existingAttempt.completed && existingAttempt.metadata) {
          const savedState = existingAttempt.metadata as {
            currentQuestionIndex: number;
            answers: QuizAnswer[];
          };
          dispatch({
            type: 'RESTORE_PROGRESS',
            payload: {
              currentQuestionIndex: savedState.currentQuestionIndex,
              answers: savedState.answers,
              attemptId: existingAttempt.id,
              startedAt: existingAttempt.started_at,
            },
          });
        }
      } catch (error) {
        console.error('Failed to check for resume:', error);
      }
    }

    checkForResume();
  }, [puzzle?.id]);

  // Save progress when app goes to background
  useEffect(() => {
    const saveProgressToSQLite = async () => {
      const currentState = stateRef.current;
      if (!puzzle || currentState.gameStatus !== 'playing' || !currentState.attemptId) {
        return;
      }

      try {
        const attempt: LocalAttempt = {
          id: currentState.attemptId,
          puzzle_id: puzzle.id,
          completed: 0, // In-progress marker
          score: null,
          score_display: null,
          metadata: JSON.stringify({
            currentQuestionIndex: currentState.currentQuestionIndex,
            answers: currentState.answers,
          }),
          started_at: currentState.startedAt,
          completed_at: null,
          synced: 0,
        };
        await saveAttempt(attempt);
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        saveProgressToSQLite();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [puzzle]);

  // Save progress when screen unmounts (in-app navigation back)
  useEffect(() => {
    if (!puzzle) return;

    const currentPuzzle = puzzle;

    return () => {
      const currentState = stateRef.current;
      if (currentState.gameStatus !== 'playing' || !currentState.attemptId) {
        return;
      }

      // Fire and forget - can't await in cleanup
      const attempt: LocalAttempt = {
        id: currentState.attemptId,
        puzzle_id: currentPuzzle.id,
        completed: 0,
        score: null,
        score_display: null,
        metadata: JSON.stringify({
          currentQuestionIndex: currentState.currentQuestionIndex,
          answers: currentState.answers,
        }),
        started_at: currentState.startedAt,
        completed_at: null,
        synced: 0,
      };

      saveAttempt(attempt).catch((error) => {
        console.error('Failed to save progress on unmount:', error);
      });
    };
  }, [puzzle?.id]);

  // Persist attempt to local database when game ends
  useEffect(() => {
    if (
      state.gameStatus === 'complete' &&
      state.score &&
      !state.attemptSaved &&
      puzzle
    ) {
      const saveGameAttempt = async () => {
        try {
          const attemptId = state.attemptId || Crypto.randomUUID();
          const now = new Date().toISOString();

          const attempt: LocalAttempt = {
            id: attemptId,
            puzzle_id: puzzle.id,
            completed: 1,
            score: state.score!.points,
            score_display: generateQuizEmojiGrid(state.answers),
            metadata: JSON.stringify({
              answers: state.answers,
              correctCount: state.score!.correctCount,
            }),
            started_at: state.startedAt,
            completed_at: now,
            synced: 0,
          };

          await saveAttempt(attempt);
          dispatch({ type: 'ATTEMPT_SAVED' });

          // Refresh local IQ for immediate UI update
          refreshLocalIQ().catch((err) => {
            console.error('[TopicalQuiz] Failed to refresh local IQ:', err);
          });

          // Fire-and-forget cloud sync
          syncAttempts().catch((err) => {
            console.error('[TopicalQuiz] Cloud sync failed:', err);
          });
        } catch (error) {
          console.error('Failed to save quiz attempt:', error);
          // Don't block the game, just log the error
        }
      };

      saveGameAttempt();
    }
  }, [
    state.gameStatus,
    state.score,
    state.attemptSaved,
    state.answers,
    state.startedAt,
    state.attemptId,
    puzzle,
  ]);

  return {
    // State
    state,
    dispatch,

    // Derived data
    quizContent,
    currentQuestion,
    questions,

    // Computed
    isGameOver,
    isLastQuestion,
    progressText,
    correctCount,

    // Helpers
    getAnswerForQuestion,

    // Actions
    answerQuestion,
    resetGame,
    shareResult,
  };
}
