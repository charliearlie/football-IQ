/**
 * LockedArchiveCard Component
 *
 * Card for displaying a locked archive puzzle (premium content).
 * Shows blurred content with lock icon overlay.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
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
 * Get icon component for a game mode (dimmed for locked state).
 */
function getGameModeIcon(gameMode: GameMode, size: number = 28) {
  const color = colors.textSecondary;
  switch (gameMode) {
    case 'career_path':
      return <Briefcase color={color} size={size} />;
    case 'guess_the_transfer':
      return <ArrowRightLeft color={color} size={size} />;
    case 'guess_the_goalscorers':
      return <Target color={color} size={size} />;
    case 'tic_tac_toe':
      return <Grid3X3 color={color} size={size} />;
    case 'topical_quiz':
      return <HelpCircle color={color} size={size} />;
    default:
      return <HelpCircle color={color} size={size} />;
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
 * Shows dimmed content with blur overlay and lock icon.
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
    <View style={styles.container} testID={testID}>
      <Pressable onPress={onPress}>
        <GlassCard style={styles.card}>
          <View style={styles.content}>
            {/* Left: Icon + Text */}
            <View style={styles.left}>
              <View style={styles.iconContainer}>{icon}</View>
              <View style={styles.textContainer}>
                <Text style={styles.date}>{formattedDate}</Text>
                <Text style={styles.title}>{title}</Text>
              </View>
            </View>

            {/* Right: Lock indicator */}
            <View style={styles.right}>
              <View style={styles.lockBadge}>
                <Lock
                  color={colors.textSecondary}
                  size={16}
                  testID={`${testID}-lock`}
                />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Blur overlay */}
        {Platform.OS !== 'web' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={15}
            tint="dark"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webOverlay]} />
        )}

        {/* Lock icon overlay */}
        <View style={styles.lockOverlay}>
          <View style={styles.lockCircle}>
            <Lock
              size={20}
              color={colors.textSecondary}
              strokeWidth={2}
              testID={`${testID}-lock-overlay`}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  card: {
    opacity: 0.6,
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
    color: colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  right: {
    marginLeft: spacing.md,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
