/**
 * LockedArchiveCard Component
 *
 * Card for displaying a locked archive puzzle (premium content).
 * Shows content slightly dimmed with lock icon button.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Lock,
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
} from 'lucide-react-native';
import { GlassCard } from '@/components';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { ArchivePuzzle, GameMode } from '../types/archive.types';
import { formatPuzzleDate } from '../utils/dateGrouping';

interface LockedArchiveCardProps {
  /** Puzzle data */
  puzzle: ArchivePuzzle;
  /** Callback when locked card is pressed (opens upsell modal) */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get icon component for a game mode (same colors as unlocked cards).
 */
function getGameModeIcon(gameMode: GameMode, size: number = 28) {
  switch (gameMode) {
    case 'career_path':
      return <Briefcase color={colors.cardYellow} size={size} />;
    case 'guess_the_transfer':
      return <ArrowRightLeft color={colors.pitchGreen} size={size} />;
    case 'guess_the_goalscorers':
      return <Target color={colors.redCard} size={size} />;
    case 'tic_tac_toe':
      return <Grid3X3 color={colors.floodlightWhite} size={size} />;
    case 'topical_quiz':
      return <HelpCircle color={colors.textSecondary} size={size} />;
    default:
      return <HelpCircle color={colors.textSecondary} size={size} />;
  }
}

/**
 * Get display title for a game mode.
 */
function getGameModeTitle(gameMode: GameMode): string {
  switch (gameMode) {
    case 'career_path':
      return 'Career Path';
    case 'guess_the_transfer':
      return 'Transfer Guess';
    case 'guess_the_goalscorers':
      return 'Goalscorer Recall';
    case 'tic_tac_toe':
      return 'Tic Tac Toe';
    case 'topical_quiz':
      return 'Quiz';
    default:
      return 'Unknown';
  }
}

/**
 * Card component for a locked archive puzzle.
 *
 * Shows slightly dimmed content with lock button.
 * Pressing the card triggers the premium upsell modal.
 */
export function LockedArchiveCard({
  puzzle,
  onPress,
  testID,
}: LockedArchiveCardProps) {
  const formattedDate = formatPuzzleDate(puzzle.puzzleDate);
  const icon = getGameModeIcon(puzzle.gameMode);
  const title = getGameModeTitle(puzzle.gameMode);

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Pressable style={styles.content} onPress={onPress}>
        {/* Left: Icon + Text */}
        <View style={styles.left}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.textContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        {/* Right: Lock button */}
        <View style={styles.right}>
          <View style={styles.lockButton} testID={`${testID}-lock-overlay`}>
            <Lock
              color={colors.floodlightWhite}
              size={18}
              testID={`${testID}-lock`}
            />
          </View>
        </View>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  date: {
    ...textStyles.caption,
    color: colors.cardYellow,
    marginBottom: 2,
  },
  title: {
    ...textStyles.body,
    color: colors.floodlightWhite,
  },
  right: {
    marginLeft: spacing.md,
  },
  lockButton: {
    width: 56,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
