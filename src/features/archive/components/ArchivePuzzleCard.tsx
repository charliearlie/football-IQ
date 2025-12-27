/**
 * ArchivePuzzleCard Component
 *
 * Card for displaying an unlocked archive puzzle.
 * Shows game mode icon, formatted date, and play status.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
  CheckCircle,
} from 'lucide-react-native';
import { GlassCard, ElevatedButton } from '@/components';
import { colors, textStyles, spacing } from '@/theme';
import { ArchivePuzzle, GameMode } from '../types/archive.types';
import { formatPuzzleDate } from '../utils/dateGrouping';

interface ArchivePuzzleCardProps {
  /** Puzzle data */
  puzzle: ArchivePuzzle;
  /** Callback when card is pressed */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get icon component for a game mode.
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
 * Card component for an unlocked archive puzzle.
 *
 * Shows game mode icon, date, title, and play/resume/done status.
 */
export function ArchivePuzzleCard({
  puzzle,
  onPress,
  testID,
}: ArchivePuzzleCardProps) {
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

        {/* Right: Status */}
        <View style={styles.right}>
          {puzzle.status === 'done' ? (
            <View style={styles.doneContainer}>
              {puzzle.scoreDisplay && (
                <Text style={styles.scoreDisplay}>{puzzle.scoreDisplay}</Text>
              )}
              <CheckCircle
                color={colors.pitchGreen}
                size={24}
                fill={colors.pitchGreen}
                testID={`${testID}-checkmark`}
              />
            </View>
          ) : (
            <ElevatedButton
              title={puzzle.status === 'resume' ? 'Resume' : 'Play'}
              onPress={onPress}
              size="small"
              topColor={
                puzzle.status === 'resume' ? colors.cardYellow : colors.pitchGreen
              }
              shadowColor={
                puzzle.status === 'resume' ? '#D4A500' : colors.grassShadow
              }
              testID={`${testID}-button`}
            />
          )}
        </View>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
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
  doneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreDisplay: {
    ...textStyles.bodySmall,
    color: colors.floodlightWhite,
  },
});
