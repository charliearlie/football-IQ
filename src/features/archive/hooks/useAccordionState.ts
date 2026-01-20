/**
 * useAccordionState Hook
 *
 * Manages single-expand accordion behavior for the Match Calendar.
 * Only one date can be expanded at a time.
 */

import { useState, useCallback } from 'react';

export interface UseAccordionStateResult {
  /** Currently expanded date key (YYYY-MM-DD) or null if all collapsed */
  expandedDateKey: string | null;
  /** Toggle expansion for a date (expands if collapsed, collapses if expanded) */
  toggleExpanded: (dateKey: string) => void;
  /** Collapse all dates */
  collapseAll: () => void;
  /** Check if a specific date is expanded */
  isExpanded: (dateKey: string) => boolean;
}

/**
 * Hook for managing accordion expansion state.
 *
 * Implements single-expand behavior where only one date row
 * can be expanded at a time. Toggling the same date collapses it.
 *
 * @example
 * ```tsx
 * const { expandedDateKey, toggleExpanded, isExpanded } = useAccordionState();
 *
 * // In DateAccordionRow:
 * <Pressable onPress={() => toggleExpanded(dateKey)}>
 *   {isExpanded(dateKey) && <ExpandedContent />}
 * </Pressable>
 * ```
 */
export function useAccordionState(): UseAccordionStateResult {
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

  /**
   * Toggle expansion for a date.
   * If the date is already expanded, collapse it.
   * If a different date is expanded, switch to the new date.
   */
  const toggleExpanded = useCallback((dateKey: string) => {
    setExpandedDateKey((prev) => (prev === dateKey ? null : dateKey));
  }, []);

  /**
   * Collapse all dates.
   */
  const collapseAll = useCallback(() => {
    setExpandedDateKey(null);
  }, []);

  /**
   * Check if a specific date is expanded.
   */
  const isExpanded = useCallback(
    (dateKey: string) => expandedDateKey === dateKey,
    [expandedDateKey]
  );

  return {
    expandedDateKey,
    toggleExpanded,
    collapseAll,
    isExpanded,
  };
}
