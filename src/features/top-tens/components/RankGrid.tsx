/**
 * RankGrid - Displays the vertical list of 10 rank cards.
 *
 * Shows all 10 ranks from #1 (top) to #10 (bottom).
 * Manages the Tenable-style climbing animation by highlighting
 * each card in sequence as the "indicator" climbs up.
 */

import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, layout } from '@/theme';
import { RankSlotState } from '../types/topTens.types';
import { RankCard, HighlightType } from './RankCard';
import { triggerLight, triggerNotification, triggerMedium, triggerHeavy } from '@/lib/haptics';

/** Time per rank during climb animation (ms) */
const CLIMB_STEP_DURATION = 100;

export interface RankGridProps {
  /** Array of 10 rank slot states */
  rankSlots: RankSlotState[];
  /** Index of the most recently found slot (for highlighting) */
  latestFoundIndex: number | null;
  /** Whether the climbing animation is active */
  isClimbing: boolean;
  /** Target rank for climbing (1-10 for correct, null for incorrect) */
  climbTargetRank: number | null;
  /** Called when climbing animation completes */
  onClimbComplete: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * RankGrid - Vertical list of 10 RankCards with full-card climbing animation.
 *
 * When isClimbing is true, each card is highlighted in sequence from
 * rank 10 (bottom) climbing up to the target rank. The highlighted card
 * receives a full-width glow effect.
 */
export function RankGrid({
  rankSlots,
  latestFoundIndex,
  isClimbing,
  climbTargetRank,
  onClimbComplete,
  testID,
}: RankGridProps) {
  // Track which card is currently highlighted during climb
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [highlightType, setHighlightType] = useState<HighlightType>(null);

  // Ref to track interval for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle climbing animation
  useEffect(() => {
    if (!isClimbing) {
      // Reset when not climbing
      setHighlightIndex(null);
      setHighlightType(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start climbing from bottom (rank 10 = index 9)
    setHighlightIndex(9);
    setHighlightType('climbing');
    triggerLight();

    // Target: for correct answer, stop at that rank's index
    // For incorrect (null), climb all the way to index 0
    const targetIndex = climbTargetRank !== null ? climbTargetRank - 1 : 0;

    // Climb animation - move up one rank every CLIMB_STEP_DURATION ms
    intervalRef.current = setInterval(() => {
      setHighlightIndex((prev) => {
        if (prev === null) return null;

        const next = prev - 1;

        // Haptic tick as we pass each rank
        triggerLight();

        // Check if we've reached or passed the target
        if (next <= targetIndex) {
          // Reached target - stop the interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          if (climbTargetRank !== null) {
            // Correct answer - success state
            setHighlightType('success');
            triggerNotification('success');
            triggerMedium();

            // Complete after success animation plays
            setTimeout(() => {
              setHighlightIndex(null);
              setHighlightType(null);
              onClimbComplete();
            }, 350);
          } else {
            // Incorrect - error state
            setHighlightType('error');
            triggerNotification('error');
            triggerHeavy();

            // Complete after error animation plays
            setTimeout(() => {
              setHighlightIndex(null);
              setHighlightType(null);
              onClimbComplete();
            }, 400);
          }

          return targetIndex;
        }

        return next;
      });
    }, CLIMB_STEP_DURATION);

    // Cleanup on effect change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isClimbing, climbTargetRank, onClimbComplete]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.grid}>
        {rankSlots.map((slot, index) => (
          <RankCard
            key={slot.rank}
            slot={slot}
            isLatest={index === latestFoundIndex && !isClimbing}
            isHighlighted={index === highlightIndex}
            highlightType={index === highlightIndex ? highlightType : null}
            testID={`${testID}-rank-${slot.rank}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  grid: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
