"use client";

import { useReducer, useCallback } from "react";
import confetti from "canvas-confetti";
import type { TopicalQuizContent } from "@/lib/schemas/puzzle-schemas";
import { generateTopicalQuizShareText } from "@/lib/shareText";
import { cn } from "@/lib/utils";
import { useGameComplete } from "./GamePageShell";

// ============================================================================
// TYPES & REDUCER
// ============================================================================

export interface QuizAnswer {
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
}

export interface TopicalQuizState {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  gameStatus: "playing" | "revealing" | "complete";
  selectedOptionIndex: number | null;
}

export type TopicalQuizAction =
  | { type: "SELECT_OPTION"; payload: number; correctIndex: number }
  | { type: "ADVANCE_QUESTION"; totalQuestions: number }
  | { type: "FINISH_GAME" };

export function topicalQuizReducer(
  state: TopicalQuizState,
  action: TopicalQuizAction
): TopicalQuizState {
  switch (action.type) {
    case "SELECT_OPTION": {
      if (state.gameStatus !== "playing" || state.selectedOptionIndex !== null) {
        return state;
      }
      const isCorrect = action.payload === action.correctIndex;
      return {
        ...state,
        answers: [
          ...state.answers,
          {
            questionIndex: state.currentQuestionIndex,
            selectedIndex: action.payload,
            isCorrect,
          },
        ],
        selectedOptionIndex: action.payload,
        gameStatus: "revealing",
      };
    }

    case "ADVANCE_QUESTION": {
      if (state.currentQuestionIndex + 1 >= action.totalQuestions) {
        return { ...state, gameStatus: "complete" };
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedOptionIndex: null,
        gameStatus: "playing",
      };
    }

    case "FINISH_GAME": {
      return { ...state, gameStatus: "complete" };
    }

    default:
      return state;
  }
}

// ============================================================================
// CONFETTI
// ============================================================================

function triggerConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

  const fire = (ratio: number, opts: confetti.Options) =>
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });

  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2, y: 0.7 } });
  fire(0.2, { spread: 60, origin: { x: 0.5, y: 0.7 } });
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8, y: 0.7 } });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// ============================================================================
// COMPONENT
// ============================================================================

interface TopicalQuizGameProps {
  content: TopicalQuizContent;
  puzzleDate: string;
}

export function TopicalQuizGame({ content, puzzleDate }: TopicalQuizGameProps) {
  const onGameComplete = useGameComplete();
  const [state, dispatch] = useReducer(topicalQuizReducer, {
    currentQuestionIndex: 0,
    answers: [],
    gameStatus: "playing",
    selectedOptionIndex: null,
  });

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (state.selectedOptionIndex !== null || state.gameStatus !== "playing") return;

      const question = content.questions[state.currentQuestionIndex];
      dispatch({
        type: "SELECT_OPTION",
        payload: optionIndex,
        correctIndex: question.correctIndex,
      });

      setTimeout(() => {
        const isLastQuestion =
          state.currentQuestionIndex >= content.questions.length - 1;
        if (isLastQuestion) {
          dispatch({ type: "FINISH_GAME" });
          const allAnswers = [
            ...state.answers,
            {
              questionIndex: state.currentQuestionIndex,
              selectedIndex: optionIndex,
              isCorrect: optionIndex === question.correctIndex,
            },
          ];
          const quizResults = allAnswers.map((a) => ({ isCorrect: a.isCorrect }));
          const correctCount = quizResults.filter((a) => a.isCorrect).length;
          const shareText = generateTopicalQuizShareText(quizResults, puzzleDate);
          if (correctCount === 5) triggerConfetti();
          onGameComplete({
            won: correctCount >= 3,
            answer: `${correctCount * 2}/10`,
            shareText,
          });
        } else {
          dispatch({
            type: "ADVANCE_QUESTION",
            totalQuestions: content.questions.length,
          });
        }
      }, 800);
    },
    [
      state.currentQuestionIndex,
      state.selectedOptionIndex,
      state.gameStatus,
      state.answers,
      content,
      puzzleDate,
      onGameComplete,
    ]
  );

  return (
    <div>
      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-pitch-green transition-all duration-500 ease-out"
          style={{
            width: `${
              ((state.currentQuestionIndex +
                (state.gameStatus !== "playing" ? 1 : 0)) /
                content.questions.length) *
              100
            }%`,
          }}
        />
      </div>

      {/* Only show question UI if not complete */}
      {state.gameStatus !== "complete" ? (
        <>
          {/* Question counter */}
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Question {state.currentQuestionIndex + 1} of{" "}
            {content.questions.length}
          </p>

          {/* Question card */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-5">
            <p className="text-floodlight font-medium text-lg leading-relaxed">
              {content.questions[state.currentQuestionIndex].question}
            </p>
          </div>

          {/* 4 option buttons */}
          <div className="space-y-2.5">
            {content.questions[state.currentQuestionIndex].options.map(
              (option, i) => {
                const isSelected = state.selectedOptionIndex === i;
                const isCorrect =
                  i ===
                  content.questions[state.currentQuestionIndex].correctIndex;
                const isRevealing = state.selectedOptionIndex !== null;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={isRevealing}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                      !isRevealing &&
                        "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
                      isRevealing && isCorrect && "border-pitch-green bg-pitch-green/20",
                      isRevealing &&
                        isSelected &&
                        !isCorrect &&
                        "border-red-card bg-red-card/20",
                      isRevealing &&
                        !isCorrect &&
                        !isSelected &&
                        "opacity-40 border-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isRevealing && isCorrect && "text-pitch-green",
                        isRevealing && isSelected && !isCorrect && "text-red-card",
                        !isRevealing && "text-floodlight"
                      )}
                    >
                      {option}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </>
      ) : (
        /* Score display */
        <div className="text-center py-8">
          <p className="font-bebas text-5xl text-floodlight tracking-wide">
            {state.answers.filter((a) => a.isCorrect).length * 2}/10
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {state.answers.filter((a) => a.isCorrect).length}/
            {content.questions.length} correct
          </p>

          {/* Answer review */}
          <div className="mt-6 space-y-2 text-left">
            {content.questions.map((q, i) => {
              const answer = state.answers[i];
              return (
                <div
                  key={q.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    answer?.isCorrect
                      ? "bg-pitch-green/10 text-pitch-green"
                      : "bg-red-card/10 text-red-card"
                  )}
                >
                  <span>{answer?.isCorrect ? "✅" : "❌"}</span>
                  <span className="flex-1 truncate">{q.question}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
