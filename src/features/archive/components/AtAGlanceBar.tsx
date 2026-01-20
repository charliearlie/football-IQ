/**
 * AtAGlanceBar Component
 *
 * Horizontal row of game mode icons showing completion status at a glance.
 * Used in the collapsed DateAccordionRow to show which games are done/pending/locked.
 */

import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Check, Lock, Grid3X3 } from 'lucide-react-native';
import { colors, spacing } from '@/theme';
import { ArchivePuzzle } from '../types/archive.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

interface AtAGlanceBarProps {
  /** Puzzles to display icons for */
  puzzles: ArchivePuzzle[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * Puzzle icon mapping for mini display.
 * Using the same icons as UniversalGameCard but at smaller size.
 */
const PUZZLE_ICONS: Partial<Record<GameMode, ImageSourcePropType>> = {
  career_path: require('../../../../assets/images/puzzles/career-path.png'),
  career_path_pro: require('../../../../assets/images/puzzles/career-path.png'),
  guess_the_transfer: require('../../../../assets/images/puzzles/guess-the-transfer.png'),
  guess_the_goalscorers: require('../../../../assets/images/puzzles/goalscorer-recall.png'),
  topical_quiz: require('../../../../assets/images/puzzles/quiz.png'),
  starting_xi: require('../../../../assets/images/puzzles/starting-xi.png'),
  top_tens: require('../../../../assets/images/puzzles/top-tens.png'),
};

/**
 * Check if a game mode has a recognized icon.
 */
function isRecognizedGameMode(gameMode: GameMode): boolean {
  return PUZZLE_ICONS[gameMode] !== undefined || gameMode === 'the_grid';
}

/**
 * Get the icon element for a game mode.
 */
function getIconElement(gameMode: GameMode, isComplete: boolean, isLocked: boolean): React.ReactNode {
  const customIcon = PUZZLE_ICONS[gameMode];

  // Determine opacity based on state (increased for better visibility)
  const opacity = isComplete ? 1 : isLocked ? 0.35 : 0.5;

  if (customIcon) {
    return (
      <Image
        source={customIcon}
        style={[
          styles.iconImage,
          { opacity },
        ]}
        resizeMode="contain"
      />
    );
  }

  // Fallback for the_grid which uses lucide icon
  if (gameMode === 'the_grid') {
    return (
      <Grid3X3
        size={20}
        color={isComplete ? colors.pitchGreen : colors.floodlightWhite}
        style={{ opacity }}
      />
    );
  }

  return null;
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
  // Filter out unrecognized game modes
  const recognizedPuzzles = puzzles.filter(p => isRecognizedGameMode(p.gameMode));

  return (
    <View style={styles.container} testID={testID}>
      {recognizedPuzzles.map((puzzle) => {
        const isComplete = puzzle.status === 'done';
        const isLocked = puzzle.isLocked;

        return (
          <View key={puzzle.id} style={styles.iconWrapper}>
            {/* Icon with state-based styling */}
            <View
              style={[
                styles.iconContainer,
                isComplete && styles.iconContainerComplete,
              ]}
            >
              {getIconElement(puzzle.gameMode, isComplete, isLocked)}
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
  iconImage: {
    width: 20,
    height: 20,
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
