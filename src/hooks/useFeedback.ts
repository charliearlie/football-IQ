import { useState, useCallback, useRef } from 'react';
import {
  triggerSuccess as hapticSuccess,
  triggerError as hapticError,
  triggerCompletion as hapticCompletion,
  triggerSelection as hapticSelection,
  triggerIncomplete as hapticIncomplete,
} from '@/lib/haptics';

/**
 * Position for particle burst origin
 */
export interface ParticleBurstOrigin {
  x: number;
  y: number;
}

/**
 * Visual feedback state managed by the hook
 */
export interface FeedbackState {
  /** Whether to show shake animation */
  showShake: boolean;
  /** Whether to show error flash overlay */
  showErrorFlash: boolean;
  /** Whether to show particle burst */
  showParticleBurst: boolean;
  /** Origin point for particle burst animation */
  particleBurstOrigin: ParticleBurstOrigin | null;
}

/**
 * Return type for useFeedback hook
 */
export interface UseFeedbackResult {
  /** Current visual feedback state */
  feedbackState: FeedbackState;
  /** Trigger success feedback (haptic + optional particle burst) */
  onSuccess: (origin?: ParticleBurstOrigin) => void;
  /** Trigger error feedback (haptic + shake + flash) */
  onError: () => void;
  /** Trigger completion feedback (double haptic success) */
  onCompletion: (origin?: ParticleBurstOrigin) => void;
  /** Trigger selection feedback (haptic only) */
  onSelection: () => void;
  /** Trigger incomplete action feedback (light haptic) */
  onIncomplete: () => void;
  /** Clear shake animation state */
  clearShake: () => void;
  /** Clear particle burst state */
  clearParticleBurst: () => void;
}

/** Duration before auto-clearing shake state (ms) */
const SHAKE_AUTO_CLEAR_MS = 500;

/**
 * Unified feedback hook combining haptics with visual feedback state.
 *
 * Provides a consistent API for triggering feedback across the app:
 * - Success: Haptic success + optional particle burst
 * - Error: Haptic error (double-tap) + shake + red flash
 * - Completion: Double haptic success + optional particle burst
 * - Selection: Light haptic for UI selections
 * - Incomplete: Light haptic for blocked actions
 *
 * @example
 * ```tsx
 * const { feedbackState, onSuccess, onError } = useFeedback();
 *
 * // On correct guess
 * onSuccess({ x: 100, y: 200 }); // With particle burst
 *
 * // On wrong guess
 * onError(); // Triggers shake + flash + haptic
 *
 * // In render
 * <ErrorFlashOverlay active={feedbackState.showErrorFlash} />
 * <SuccessParticleBurst
 *   active={feedbackState.showParticleBurst}
 *   originX={feedbackState.particleBurstOrigin?.x}
 *   originY={feedbackState.particleBurstOrigin?.y}
 * />
 * ```
 */
export function useFeedback(): UseFeedbackResult {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    showShake: false,
    showErrorFlash: false,
    showParticleBurst: false,
    particleBurstOrigin: null,
  });

  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear shake animation state
   */
  const clearShake = useCallback(() => {
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    setFeedbackState((prev) => ({
      ...prev,
      showShake: false,
      showErrorFlash: false,
    }));
  }, []);

  /**
   * Clear particle burst state
   */
  const clearParticleBurst = useCallback(() => {
    setFeedbackState((prev) => ({
      ...prev,
      showParticleBurst: false,
      particleBurstOrigin: null,
    }));
  }, []);

  /**
   * Trigger success feedback
   */
  const onSuccess = useCallback((origin?: ParticleBurstOrigin) => {
    hapticSuccess();

    if (origin) {
      setFeedbackState((prev) => ({
        ...prev,
        showParticleBurst: true,
        particleBurstOrigin: origin,
      }));
    }
  }, []);

  /**
   * Trigger error feedback with shake + flash
   */
  const onError = useCallback(() => {
    hapticError();

    // Clear any existing timer
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
    }

    setFeedbackState((prev) => ({
      ...prev,
      showShake: true,
      showErrorFlash: true,
    }));

    // Auto-clear shake after animation completes
    shakeTimerRef.current = setTimeout(() => {
      setFeedbackState((prev) => ({
        ...prev,
        showShake: false,
        showErrorFlash: false,
      }));
      shakeTimerRef.current = null;
    }, SHAKE_AUTO_CLEAR_MS);
  }, []);

  /**
   * Trigger completion feedback (puzzle finished)
   */
  const onCompletion = useCallback((origin?: ParticleBurstOrigin) => {
    hapticCompletion();

    if (origin) {
      setFeedbackState((prev) => ({
        ...prev,
        showParticleBurst: true,
        particleBurstOrigin: origin,
      }));
    }
  }, []);

  /**
   * Trigger selection feedback
   */
  const onSelection = useCallback(() => {
    hapticSelection();
  }, []);

  /**
   * Trigger incomplete action feedback
   */
  const onIncomplete = useCallback(() => {
    hapticIncomplete();
  }, []);

  return {
    feedbackState,
    onSuccess,
    onError,
    onCompletion,
    onSelection,
    onIncomplete,
    clearShake,
    clearParticleBurst,
  };
}
