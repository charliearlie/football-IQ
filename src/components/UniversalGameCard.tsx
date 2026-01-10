/**
 * UniversalGameCard Component
 *
 * Unified game card component used for both Home screen (daily stack)
 * and Archive screen. Provides consistent layout and interaction patterns.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
  Check,
  Lock,
} from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { ElevatedButton } from './ElevatedButton';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Card variants for different contexts.
 * - 'daily': For Home screen daily stack
 * - 'archive': For Archive screen (supports locked state)
 */
type CardVariant = 'daily' | 'archive';

/**
 * Card status for display state.
 */
type CardStatus = 'play' | 'resume' | 'done';

export interface UniversalGameCardProps {
  /**
   * Game mode type determines icon and title.
   */
  gameMode: GameMode;

  /**
   * Current status of the puzzle attempt.
   */
  status: CardStatus;

  /**
   * Callback when card/button is pressed.
   */
  onPress: () => void;

  /**
   * Card variant determines layout behavior.
   * @default 'daily'
   */
  variant?: CardVariant;

  /**
   * Whether the card is locked (archive variant only).
   * Shows dimmed state with lock button.
   */
  isLocked?: boolean;

  /**
   * Test ID for testing.
   */
  testID?: string;
}

/**
 * Game mode configuration for display.
 */
interface GameModeConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
}

/**
 * Get configuration for each game mode.
 */
function getGameModeConfig(gameMode: GameMode): GameModeConfig {
  switch (gameMode) {
    case 'career_path':
      return {
        title: 'Career Path',
        subtitle: 'Guess the player',
        icon: <Briefcase color={colors.cardYellow} size={32} />,
        iconColor: colors.cardYellow,
      };
    case 'guess_the_transfer':
      return {
        title: 'Transfer Guess',
        subtitle: 'Name the player',
        icon: <ArrowRightLeft color={colors.pitchGreen} size={32} />,
        iconColor: colors.pitchGreen,
      };
    case 'guess_the_goalscorers':
      return {
        title: 'Goalscorer Recall',
        subtitle: 'Remember the match',
        icon: <Target color={colors.redCard} size={32} />,
        iconColor: colors.redCard,
      };
    case 'tic_tac_toe':
      return {
        title: 'Tic Tac Toe',
        subtitle: 'Beat the AI',
        icon: <Grid3X3 color={colors.floodlightWhite} size={32} />,
        iconColor: colors.floodlightWhite,
      };
    case 'topical_quiz':
      return {
        title: 'Quiz',
        subtitle: '5 questions',
        icon: <HelpCircle color={colors.cardYellow} size={32} />,
        iconColor: colors.cardYellow,
      };
    default:
      return {
        title: 'Unknown',
        subtitle: '',
        icon: <HelpCircle color={colors.textSecondary} size={32} />,
        iconColor: colors.textSecondary,
      };
  }
}

/**
 * Get button properties based on status.
 */
function getButtonProps(status: CardStatus) {
  switch (status) {
    case 'done':
      return {
        title: 'Result',
        topColor: colors.cardYellow,
        shadowColor: '#D4A500',
      };
    case 'resume':
      return {
        title: 'Resume',
        topColor: colors.cardYellow,
        shadowColor: '#D4A500',
      };
    default:
      return {
        title: 'Play',
        topColor: colors.pitchGreen,
        shadowColor: colors.grassShadow,
      };
  }
}

/**
 * UniversalGameCard - Unified game card for Home and Archive screens.
 *
 * Shows different states:
 * - play: "Play" button (green)
 * - resume: "Resume" button (yellow)
 * - done: "Result" button (yellow) with completion badge
 * - locked: Lock button with dimmed appearance (archive only)
 */
export function UniversalGameCard({
  gameMode,
  status,
  onPress,
  variant = 'daily',
  isLocked = false,
  testID,
}: UniversalGameCardProps) {
  const config = getGameModeConfig(gameMode);
  const buttonProps = getButtonProps(status);

  // Merge card styles (GlassCard expects ViewStyle, not array)
  const cardStyle = isLocked
    ? { ...styles.card, ...styles.lockedCard }
    : styles.card;

  return (
    <GlassCard style={cardStyle} testID={testID}>
      <Pressable style={styles.content} onPress={onPress}>
        {/* Left: Icon + Title */}
        <View style={styles.left}>
          <View style={styles.iconContainer}>
            {config.icon}
            {/* Completion badge - small checkmark in corner */}
            {status === 'done' && !isLocked && (
              <View style={styles.completionBadge}>
                <Check size={12} color={colors.stadiumNavy} strokeWidth={3} />
              </View>
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {config.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {config.subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Action Button or Lock */}
        <View style={styles.right}>
          {isLocked ? (
            <View style={styles.lockButton} testID={`${testID}-lock`}>
              <Lock color={colors.floodlightWhite} size={18} />
            </View>
          ) : (
            <ElevatedButton
              title={buttonProps.title}
              onPress={onPress}
              size="small"
              topColor={buttonProps.topColor}
              shadowColor={buttonProps.shadowColor}
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
    marginBottom: spacing.md,
  },
  lockedCard: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  completionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.stadiumNavy,
  },
  textContainer: {
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  title: {
    ...textStyles.subtitle,
    marginBottom: 2,
  },
  subtitle: {
    ...textStyles.caption,
  },
  right: {
    marginLeft: spacing.md,
    flexShrink: 0, // Don't shrink the button area
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
