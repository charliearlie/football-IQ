/**
 * AtAGlanceBar Component
 *
 * Horizontal row of game mode icons showing completion status at a glance.
 * Used in the collapsed DateAccordionRow to show which games are done/pending/locked.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { GameModeIcon } from '@/components';
import { colors, spacing } from '@/theme';
import { ArchivePuzzle } from '../types/archive.types';

interface AtAGlanceBarProps {
  /** Puzzles to display icons for */
  puzzles: ArchivePuzzle[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * AtAGlanceBar - Shows icons for each puzzle with status indicators.
 *
 * Icon States:
 * - Complete: Full opacity, green tint, checkmark badge
 * - Unplayed: 50% opacity
 * - Locked: 35% opacity, lock icon badge
 */
export function AtAGlanceBar({ puzzles, testID }: AtAGlanceBarProps) {
  return (
    <View style={styles.container} testID={testID}>
      {puzzles.map((puzzle) => {
        const isComplete = puzzle.status === 'done';
        const isLocked = puzzle.isLocked;
        const opacity = isComplete ? 1 : isLocked ? 0.35 : 0.5;

        return (
          <View key={puzzle.id} style={styles.iconWrapper}>
            {/* Icon with state-based styling */}
            <View
              style={[
                styles.iconContainer,
                isComplete && styles.iconContainerComplete,
              ]}
            >
              <View style={{ opacity }}>
                <GameModeIcon gameMode={puzzle.gameMode} size={20} />
              </View>
            </View>

            {/* Checkmark badge for completed games */}
            {isComplete && (
              <View style={styles.checkBadge}>
                <Check size={7} color={colors.stadiumNavy} strokeWidth={4} />
              </View>
            )}

            {/* Lock badge for locked games */}
            {isLocked && !isComplete && (
              <View style={styles.lockBadge}>
                <Lock size={7} color={colors.stadiumNavy} strokeWidth={2.5} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainerComplete: {
    backgroundColor: 'rgba(88, 204, 2, 0.2)',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.stadiumNavy,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.stadiumNavy,
  },
});
