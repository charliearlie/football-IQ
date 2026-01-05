/**
 * Reusable countdown timer hook for Goalscorer Recall.
 *
 * Features:
 * - Starts/stops on demand
 * - Calls onTick every second with remaining time
 * - Calls onFinish when reaching 0
 * - Can be reset to initial value
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface CountdownTimerOptions {
  /** Initial countdown value in seconds */
  initialSeconds: number;
  /** Called every second with remaining time */
  onTick?: (remaining: number) => void;
  /** Called when timer reaches 0 */
  onFinish?: () => void;
}

interface CountdownTimerResult {
  /** Current time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Start the countdown */
  start: () => void;
  /** Stop the countdown (pause) */
  stop: () => void;
  /** Reset to initial value and stop */
  reset: () => void;
  /** Set timer to a specific value (for resume functionality) */
  setTo: (seconds: number) => void;
}

/**
 * Countdown timer hook with callbacks.
 *
 * @example
 * const timer = useCountdownTimer({
 *   initialSeconds: 60,
 *   onTick: (remaining) => console.log(`${remaining}s left`),
 *   onFinish: () => console.log('Time up!'),
 * });
 *
 * // Start the timer
 * timer.start();
 *
 * // Access current time
 * console.log(timer.timeRemaining); // 60, 59, 58...
 */
export function useCountdownTimer({
  initialSeconds,
  onTick,
  onFinish,
}: CountdownTimerOptions): CountdownTimerResult {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // Use refs for callbacks to avoid re-creating interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  const onFinishRef = useRef(onFinish);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const start = useCallback(() => {
    // Check ref instead of state to handle rapid double-calls
    if (intervalRef.current) return;

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        // Call onTick with new value
        onTickRef.current?.(next);

        // Check if timer has finished
        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          onFinishRef.current?.();
          return 0;
        }

        return next;
      });
    }, 1000);
  }, [isRunning]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeRemaining(initialSeconds);
  }, [stop, initialSeconds]);

  const setTo = useCallback((seconds: number) => {
    stop();
    setTimeRemaining(seconds);
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    reset,
    setTo,
  };
}
