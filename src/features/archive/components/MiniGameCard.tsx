/**
 * MiniGameCard Component
 *
 * Compact tappable card for the expanded accordion view.
 * Uses "Card-as-Button" pattern - entire card is the tap target.
 *
 * Height: 72px (fits 2-column grid)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Lock, Grid3X3, Check, Play, ChevronRight } from 'lucide-react-native';
import { ProBadge } from '@/components/ProBadge';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { triggerLight, triggerMedium } from '@/lib/haptics';
import { ArchivePuzzle } from '../types/archive.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

interface MiniGameCardProps {
  /** Puzzle data */
  puzzle: ArchivePuzzle;
  /** Callback when card is pressed */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Puzzle icon mapping.
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
 * Game mode display titles (full names for vertical layout).
 */
export const GAME_MODE_TITLES: Record<GameMode, string> = {
  career_path: 'Career Path',
  career_path_pro: 'Career Path Pro',
  guess_the_transfer: 'Transfer Guess',
  guess_the_goalscorers: 'Goalscorer Recall',
  the_grid: 'The Grid (beta)',
  the_chain: 'The Chain',
  the_thread: 'Threads',
  topical_quiz: 'Quiz',
  top_tens: 'Top Tens',
  starting_xi: 'Starting XI',
};

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

/**
 * MiniGameCard - Compact tappable card for expanded accordion grid.
 *
 * Card-as-Button pattern: Entire card is tappable with simple icon indicators.
 *
 * States:
 * - Play: Subtle chevron indicator
 * - Resume: Yellow play icon
 * - Locked: Yellow crown icon
 * - Completed: Green "+XX IQ" text
 */
function MiniGameCardComponent({ puzzle, onPress, testID }: MiniGameCardProps) {
  const scale = useSharedValue(1);

  const isComplete = puzzle.status === 'done';
  const isLocked = puzzle.isLocked;
  const isResume = puzzle.status === 'resume';
  const isPremiumOnly = puzzle.gameMode === 'career_path_pro' || puzzle.gameMode === 'top_tens';

  // Get title
  const title = GAME_MODE_TITLES[puzzle.gameMode];

  // Handle press with appropriate haptic
  const handlePress = () => {
    if (isLocked) {
      triggerMedium();
    } else {
      triggerLight();
    }
    onPress();
  };

  // Press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.95, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get icon element
  const customIcon = PUZZLE_ICONS[puzzle.gameMode];
  const iconElement = customIcon ? (
    <Image
      source={customIcon}
      style={[styles.iconImage, isLocked && styles.iconLocked]}
      resizeMode="contain"
    />
  ) : puzzle.gameMode === 'the_grid' ? (
    <Grid3X3
      size={20}
      color={isLocked ? colors.textSecondary : colors.pitchGreen}
      style={isLocked && styles.iconLocked}
    />
  ) : null;

  // Render status indicator (simple icons, not buttons)
  const renderStatus = () => {
    if (isComplete) {
      // Done state: green checkmark
      return (
        <View style={styles.statusIndicator}>
          <Check size={20} color={colors.pitchGreen} strokeWidth={3} />
        </View>
      );
    }

    if (isLocked) {
      // Locked state: yellow crown icon
      return (
        <View style={styles.statusIndicator}>
          <ProBadge size={18} color={colors.cardYellow} />
        </View>
      );
    }

    if (isResume) {
      // Resume state: yellow play icon
      return (
        <View style={styles.statusIndicator}>
          <Play size={18} color={colors.cardYellow} fill={colors.cardYellow} strokeWidth={0} />
        </View>
      );
    }

    // Play state: subtle chevron
    return (
      <View style={styles.statusIndicator}>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    );
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.card,
          isComplete && styles.cardCompleted,
          isLocked && styles.cardLocked,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
      >
        {/* Left side: Icon and title */}
        <View style={styles.leftContent}>
          <View style={styles.iconRow}>
            <View style={styles.iconContainer}>
              {iconElement}

              {/* Completion badge */}
              {isComplete && (
                <View style={styles.completeBadge}>
                  <Check size={8} color={colors.stadiumNavy} strokeWidth={3} />
                </View>
              )}

              {/* Lock badge */}
              {isLocked && (
                <View style={styles.lockBadge}>
                  <Lock size={8} color={colors.cardYellow} strokeWidth={2.5} />
                </View>
              )}

              {/* Premium badge */}
              {isPremiumOnly && !isLocked && (
                <View style={styles.premiumBadge}>
                  <ProBadge size={7} color={colors.stadiumNavy} />
                </View>
              )}
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        {/* Right side: Action button or score */}
        {renderStatus()}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Memoized MiniGameCard to prevent unnecessary re-renders.
 */
export const MiniGameCard = memo(MiniGameCardComponent, (prev, next) => {
  return (
    prev.puzzle.id === next.puzzle.id &&
    prev.puzzle.status === next.puzzle.status &&
    prev.puzzle.isLocked === next.puzzle.isLocked &&
    prev.puzzle.score === next.puzzle.score
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardCompleted: {
    borderColor: 'rgba(88, 204, 2, 0.3)',
  },
  cardLocked: {
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Slightly more gap for visual balance
    position: 'relative',
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  iconLocked: {
    opacity: 0.4,
  },
  completeBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.stadiumNavy,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardYellow,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.floodlightWhite,
    flex: 1,
  },
  // Simple indicator area - just enough for icons
  statusIndicator: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextDone: {
    fontWeight: '700',
    color: colors.pitchGreen,
    fontSize: 13,
  },
});
