"use client";

import { useReducer, useCallback, useMemo, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Modifier } from "@dnd-kit/core";

// Simple vertical axis restriction (avoids @dnd-kit/modifiers dependency)
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});
import type { TimelineContent } from "@/lib/schemas/puzzle-schemas";
import { generateTimelineShareText } from "@/lib/shareText";
import { cn } from "@/lib/utils";
import { useGameComplete } from "./GamePageShell";

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineEvent {
  text: string;
  year: number;
  month?: number;
}

export interface TimelineState {
  eventOrder: TimelineEvent[];
  correctOrder: TimelineEvent[];
  lockedIndices: Set<number>;
  attemptCount: number;
  firstAttemptResults: boolean[];
  lastAttemptResults: boolean[];
  revealPhase: "idle" | "revealing";
  gameStatus: "playing" | "won" | "lost";
}

export type TimelineAction =
  | { type: "REORDER_EVENTS"; payload: { from: number; to: number } }
  | { type: "SUBMIT" }
  | { type: "REVEAL_COMPLETE" }
  | { type: "GIVE_UP" };

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTEMPTS = 5;

const ATTEMPT_LABELS: Record<number, string> = {
  5: "Perfect Timeline",
  4: "World Class",
  3: "Expert",
  2: "Promising",
  1: "Rookie",
  0: "",
};

// Static class maps for card states (Tailwind JIT can't handle dynamic classes)
const CARD_STYLES = {
  default: "bg-white/10 border-2 border-transparent hover:bg-white/15",
  locked: "bg-pitch-green/10 border-2 border-pitch-green/50",
  revealCorrect: "bg-pitch-green/15 border-2 border-pitch-green animate-timeline-pulse",
  revealIncorrect: "bg-red-card/15 border-2 border-red-card/50 animate-timeline-shake",
  dragging: "bg-white/15 border-2 border-floodlight/30 shadow-lg scale-[1.02]",
  disabled: "bg-white/5 border-2 border-transparent opacity-60",
};

// ============================================================================
// HELPERS (exported for testing)
// ============================================================================

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check which positions in the current order are correct.
 */
export function checkOrder(
  currentOrder: TimelineEvent[],
  correctOrder: TimelineEvent[]
): boolean[] {
  return currentOrder.map(
    (event, i) =>
      event.text === correctOrder[i].text && event.year === correctOrder[i].year
  );
}

/**
 * Reorder an array by moving an item from one index to another.
 * Respects locked indices.
 */
export function reorderWithLocks(
  events: TimelineEvent[],
  from: number,
  to: number,
  lockedIndices: Set<number>
): TimelineEvent[] {
  if (lockedIndices.has(from)) return events;
  if (lockedIndices.has(to)) return events;

  const result = [...events];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

/**
 * Calculate score for a Timeline game.
 */
export function calculateTimelineScore(
  totalAttempts: number,
  won: boolean
): { points: number; label: string } {
  const points = won ? Math.max(1, 6 - totalAttempts) : 0;
  return { points, label: ATTEMPT_LABELS[points] ?? "" };
}

// ============================================================================
// REDUCER
// ============================================================================

export function timelineReducer(
  state: TimelineState,
  action: TimelineAction
): TimelineState {
  switch (action.type) {
    case "REORDER_EVENTS": {
      if (state.gameStatus !== "playing" || state.revealPhase !== "idle") {
        return state;
      }

      const { from, to } = action.payload;
      const newOrder = reorderWithLocks(
        state.eventOrder,
        from,
        to,
        state.lockedIndices
      );

      // reorderWithLocks returns the same array reference if locked
      if (newOrder === state.eventOrder) return state;

      return { ...state, eventOrder: newOrder };
    }

    case "SUBMIT": {
      if (state.gameStatus !== "playing" || state.revealPhase !== "idle") {
        return state;
      }

      const results = checkOrder(state.eventOrder, state.correctOrder);
      const isFirstAttempt = state.attemptCount === 0;
      const newAttemptCount = state.attemptCount + 1;
      const firstAttemptResults = isFirstAttempt
        ? results
        : state.firstAttemptResults;
      const allCorrect = results.every(Boolean);

      if (allCorrect) {
        return {
          ...state,
          attemptCount: newAttemptCount,
          firstAttemptResults,
          lastAttemptResults: results,
          lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
          revealPhase: "revealing",
          gameStatus: "won",
        };
      }

      return {
        ...state,
        attemptCount: newAttemptCount,
        firstAttemptResults,
        lastAttemptResults: results,
        revealPhase: "revealing",
      };
    }

    case "REVEAL_COMPLETE": {
      if (
        state.attemptCount >= MAX_ATTEMPTS &&
        state.gameStatus === "playing"
      ) {
        return {
          ...state,
          revealPhase: "idle",
          eventOrder: state.correctOrder,
          lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
          gameStatus: "lost",
        };
      }
      return { ...state, revealPhase: "idle" };
    }

    case "GIVE_UP": {
      if (state.gameStatus !== "playing") return state;

      return {
        ...state,
        eventOrder: state.correctOrder,
        lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
        gameStatus: "lost",
        revealPhase: "idle",
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// SORTABLE CARD COMPONENT
// ============================================================================

interface SortableTimelineCardProps {
  event: TimelineEvent;
  index: number;
  isLocked: boolean;
  isRevealing: boolean;
  isCorrect: boolean | null;
  showYear: boolean;
  disabled: boolean;
}

function SortableTimelineCard({
  event,
  index,
  isLocked,
  isRevealing,
  isCorrect,
  showYear,
  disabled,
}: SortableTimelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: event.text,
    disabled: disabled || isLocked || isRevealing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let cardStyle = CARD_STYLES.default;
  if (isDragging) {
    cardStyle = CARD_STYLES.dragging;
  } else if (isRevealing && isCorrect === true) {
    cardStyle = CARD_STYLES.revealCorrect;
  } else if (isRevealing && isCorrect === false) {
    cardStyle = CARD_STYLES.revealIncorrect;
  } else if (isLocked) {
    cardStyle = CARD_STYLES.locked;
  } else if (disabled) {
    cardStyle = CARD_STYLES.disabled;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl p-3.5 mb-2 transition-colors select-none",
        cardStyle
      )}
    >
      {/* Grip handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex-shrink-0 cursor-grab active:cursor-grabbing touch-none",
          (isLocked || disabled || isRevealing) && "opacity-20 cursor-default"
        )}
      >
        <GripVertical className="w-5 h-5 text-slate-400" />
      </div>

      {/* Position number */}
      <span
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          isLocked
            ? "bg-pitch-green/20 text-pitch-green"
            : "bg-white/10 text-slate-400"
        )}
      >
        {index + 1}
      </span>

      {/* Event text */}
      <span className="flex-1 text-sm text-floodlight">{event.text}</span>

      {/* Year (hidden during play, shown when locked or game ended) */}
      {showYear && (
        <span
          className={cn(
            "flex-shrink-0 text-sm font-mono font-bold",
            isLocked || isCorrect === true
              ? "text-pitch-green"
              : "text-red-card"
          )}
        >
          {event.year}
          {event.month ? `.${String(event.month).padStart(2, "0")}` : ""}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function triggerConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
  const fire = (ratio: number, opts: confetti.Options) =>
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * ratio),
    });

  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2, y: 0.7 } });
  fire(0.2, { spread: 60, origin: { x: 0.5, y: 0.7 } });
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8, y: 0.7 } });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

interface TimelineGameProps {
  content: TimelineContent;
  puzzleDate: string;
}

export function TimelineGame({ content, puzzleDate }: TimelineGameProps) {
  const onGameComplete = useGameComplete();
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);

  const correctOrder = useMemo(() => {
    return [...content.events].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.month ?? 0) - (b.month ?? 0);
    });
  }, [content.events]);

  const initialOrder = useMemo(
    () => shuffleArray(correctOrder),
    [correctOrder]
  );

  const [state, dispatch] = useReducer(timelineReducer, {
    eventOrder: initialOrder,
    correctOrder,
    lockedIndices: new Set(),
    attemptCount: 0,
    firstAttemptResults: [],
    lastAttemptResults: [],
    revealPhase: "idle",
    gameStatus: "playing",
  } satisfies TimelineState);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 800ms reveal timer
  useEffect(() => {
    if (state.revealPhase !== "revealing") return;
    const timer = setTimeout(
      () => dispatch({ type: "REVEAL_COMPLETE" }),
      800
    );
    return () => clearTimeout(timer);
  }, [state.revealPhase]);

  // Game end side effects
  useEffect(() => {
    if (state.gameStatus !== "won" && state.gameStatus !== "lost") return;

    const score = calculateTimelineScore(
      state.attemptCount,
      state.gameStatus === "won"
    );
    const shareText = generateTimelineShareText(
      state.firstAttemptResults,
      state.attemptCount,
      score.points,
      puzzleDate,
      content.title,
      content.subject
    );

    if (state.gameStatus === "won") {
      triggerConfetti();
      onGameComplete({
        won: true,
        answer: content.title || content.subject || "Timeline",
        shareText,
      });
    } else {
      onGameComplete({
        won: false,
        answer: content.title || content.subject || "Timeline",
        shareText,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = state.eventOrder.findIndex(
        (e) => e.text === active.id
      );
      const newIndex = state.eventOrder.findIndex(
        (e) => e.text === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch({
          type: "REORDER_EVENTS",
          payload: { from: oldIndex, to: newIndex },
        });
      }
    },
    [state.eventOrder]
  );

  const handleGiveUp = useCallback(() => {
    if (showGiveUpConfirm) {
      dispatch({ type: "GIVE_UP" });
      setShowGiveUpConfirm(false);
    } else {
      setShowGiveUpConfirm(true);
    }
  }, [showGiveUpConfirm]);

  const isGameOver = state.gameStatus === "won" || state.gameStatus === "lost";
  const label = content.title || content.subject;
  const score = isGameOver
    ? calculateTimelineScore(state.attemptCount, state.gameStatus === "won")
    : null;

  return (
    <div>
      {/* CSS keyframe animations */}
      <style>{`
        @keyframes timeline-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes timeline-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-timeline-pulse {
          animation: timeline-pulse 0.4s ease-in-out 2;
        }
        .animate-timeline-shake {
          animation: timeline-shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Subject bar */}
      {label && (
        <div className="text-center mb-4">
          <span className="text-slate-400 text-sm">
            ⏱️ {label}
          </span>
        </div>
      )}

      {/* Sortable event list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={state.eventOrder.map((e) => e.text)}
          strategy={verticalListSortingStrategy}
        >
          {state.eventOrder.map((event, index) => {
            const isLocked = state.lockedIndices.has(index);
            const isRevealing = state.revealPhase === "revealing";
            const isCorrectOnLastAttempt =
              state.lastAttemptResults.length > 0
                ? state.lastAttemptResults[index]
                : null;
            const showYear = isLocked || isGameOver;

            return (
              <SortableTimelineCard
                key={event.text}
                event={event}
                index={index}
                isLocked={isLocked}
                isRevealing={isRevealing}
                isCorrect={isRevealing ? isCorrectOnLastAttempt : null}
                showYear={showYear}
                disabled={isGameOver}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Action bar (during play) */}
      {state.gameStatus === "playing" && state.revealPhase === "idle" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Attempt {state.attemptCount + 1} of {MAX_ATTEMPTS}
            </span>
            <button
              onClick={handleGiveUp}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showGiveUpConfirm ? "Tap again to confirm" : "Give up"}
            </button>
          </div>
          <button
            onClick={() => dispatch({ type: "SUBMIT" })}
            className="w-full py-3 rounded-xl bg-pitch-green text-stadium-navy font-bold text-sm hover:bg-pitch-green/90 transition-colors"
          >
            Submit Order
          </button>
        </div>
      )}

      {/* Revealing indicator */}
      {state.revealPhase === "revealing" && (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm animate-pulse">Checking...</p>
        </div>
      )}

      {/* Win display */}
      {state.gameStatus === "won" && state.revealPhase === "idle" && score && (
        <div className="text-center py-4">
          <p className="text-pitch-green font-bebas text-2xl tracking-wide">
            {score.label || "WELL PLAYED!"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {state.attemptCount === 1
              ? "Perfect — first try!"
              : `Solved in ${state.attemptCount} attempts`}{" "}
            — {score.points} IQ
          </p>
        </div>
      )}

      {/* Loss display */}
      {state.gameStatus === "lost" && state.revealPhase === "idle" && (
        <div className="text-center py-4">
          <p className="text-red-card font-semibold mb-1">
            Better luck tomorrow!
          </p>
          <p className="text-slate-400 text-sm">
            The correct order is shown above
          </p>
        </div>
      )}
    </div>
  );
}
