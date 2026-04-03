/**
 * A/B Testing hook — typed wrapper around PostHog feature flags.
 *
 * Usage:
 *   const variant = useExperiment('paywall_timing_v1'); // 'control' | 'test' | undefined
 *   if (variant === 'test') { ... }
 *
 * Experiments are defined centrally in EXPERIMENTS to ensure consistent
 * naming and typed variant values across the codebase.
 */

import { useFeatureFlag } from 'posthog-react-native';
import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

/**
 * All active experiments. Add new experiments here.
 * Key = PostHog feature flag key, Value = description for documentation.
 */
export const EXPERIMENTS = {
  /** Test showing paywall after first win vs archive gate */
  paywall_timing_v1: 'paywall_timing_v1',
  /** Test 3-day vs 5-day free archive window */
  free_window_duration: 'free_window_duration',
  /** Test annual vs monthly as default selection */
  default_plan_selection: 'default_plan_selection',
  /** Test different paywall copy variants */
  paywall_copy_variant: 'paywall_copy_variant',
  /** Test notification permission timing */
  notification_permission_timing: 'notification_permission_timing',
} as const;

export type ExperimentKey = keyof typeof EXPERIMENTS;

/**
 * Get the variant for an experiment.
 * Returns the flag value (string variant name, boolean, or undefined if not loaded).
 */
export function useExperiment(key: ExperimentKey): string | boolean | undefined {
  return useFeatureFlag(EXPERIMENTS[key]);
}

/**
 * Get experiment variant as a simple string ('control' | 'test' | variant name).
 * Normalises boolean flags to 'control'/'test'.
 */
export function useExperimentVariant(key: ExperimentKey): string | undefined {
  const value = useFeatureFlag(EXPERIMENTS[key]);

  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value ? 'test' : 'control';
  return String(value);
}

/**
 * Hook that tracks when a user is exposed to an experiment.
 * Call this when the experiment actually affects the user's experience.
 */
export function useTrackExperimentExposure() {
  const { capture } = useAnalytics();

  return useCallback(
    (key: ExperimentKey, variant: string) => {
      capture('$experiment_exposure', {
        experiment: EXPERIMENTS[key],
        variant,
      });
    },
    [capture],
  );
}
