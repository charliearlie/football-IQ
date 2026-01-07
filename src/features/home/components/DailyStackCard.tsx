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
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../hooks/useDailyPuzzles';

interface DailyStackCardProps {
  /**
   * Unique puzzle ID for navigation.
   */
  puzzleId: string;
  /**
   * Game mode type.
   */
  gameMode: GameMode;
  /**
   * Current status of the puzzle attempt.
   */
  status: CardStatus;
  /**
   * Score display string (emoji grid) for completed puzzles.
   */
  scoreDisplay?: string;
  /**
   * Puzzle difficulty level.
   */
  difficulty?: string | null;
  /**
   * Callback when card/button is pressed.
   */
  onPress: () => void;
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
 * Extract only the emoji grid from the full score_display string.
 * The score_display may contain headers, dates, and score labels for sharing,
 * but on the home screen we only want the compact emoji representation.
 *
 * @param scoreDisplay - The full score display string
 * @returns The extracted emoji grid, or empty string if invalid/empty input
 */
function extractEmojiGrid(scoreDisplay: string | null | undefined): string {
  // Guard against null/undefined/empty input
  if (!scoreDisplay || scoreDisplay.trim().length === 0) {
    return '';
  }

  const lines = scoreDisplay.trim().split('\n');

  // Find the last line that contains emoji characters (the emoji grid)
  // Emoji ranges: game pieces, symbols, etc.
  const emojiPattern =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u2B1B\u2B1C\u2705\u274C\u2B55]/u;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    // Skip empty lines and lines that look like headers/labels
    if (line && emojiPattern.test(line) && !line.includes(':') && !line.includes('Football IQ')) {
      return line;
    }
  }

  // Return empty string if no emoji grid found (safer than returning malformed data)
  return '';
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
 * Individual game card for the Home Screen daily stack.
 *
 * Shows different states:
 * - play: "Play" button (green)
 * - resume: "Resume" button (yellow)
 * - done: Score emoji grid + checkmark
 */
export function DailyStackCard({
  puzzleId,
  gameMode,
  status,
  scoreDisplay,
  difficulty,
  onPress,
  testID,
}: DailyStackCardProps) {
  const config = getGameModeConfig(gameMode);

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Pressable
        style={styles.content}
        onPress={onPress}
      >
        {/* Left: Icon + Title */}
        <View style={styles.left}>
          <View style={styles.iconContainer}>{config.icon}</View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>
        </View>

        {/* Right: Action or Result */}
        <View style={styles.right}>
          {status === 'done' ? (
            <View style={styles.doneContainer}>
              {scoreDisplay && (
                <Text style={styles.scoreDisplay}>
                  {extractEmojiGrid(scoreDisplay)}
                </Text>
              )}
              <CheckCircle
                color={colors.white}
                size={24}
                fill={colors.pitchGreen}
                testID={`${testID}-checkmark`}
              />
            </View>
          ) : (
            <ElevatedButton
              title={status === 'resume' ? 'Resume' : 'Play'}
              onPress={onPress}
              size="small"
              topColor={status === 'resume' ? colors.cardYellow : colors.pitchGreen}
              shadowColor={status === 'resume' ? '#D4A500' : colors.grassShadow}
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
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
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
