/**
 * UniversalGameCard Component
 *
 * Unified game card component used for both Home screen (daily stack)
 * and Archive screen. Provides consistent layout and interaction patterns.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Grid3X3,
  HelpCircle,
  Check,
  Crown,
} from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { ElevatedButton } from './ElevatedButton';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Custom puzzle icons mapping.
 * Maps game modes to their custom PNG icons.
 */
const PUZZLE_ICONS: Partial<Record<GameMode, ImageSourcePropType>> = {
  career_path: require('../../assets/images/puzzles/career-path.png'),
  career_path_pro: require('../../assets/images/puzzles/career-path.png'),
  guess_the_transfer: require('../../assets/images/puzzles/guess-the-transfer.png'),
  guess_the_goalscorers: require('../../assets/images/puzzles/goalscorer-recall.png'),
  topical_quiz: require('../../assets/images/puzzles/quiz.png'),
  starting_xi: require('../../assets/images/puzzles/starting-xi.png'),
  top_tens: require('../../assets/images/puzzles/top-tens.png'),
};

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
   * Whether this is a premium-only game mode.
   * Shows crown badge and unlock button for non-premium users.
   */
  isPremiumOnly?: boolean;

  /**
   * Whether the user has premium access.
   * Used with isPremiumOnly to determine locked state.
   */
  isPremium?: boolean;

  /**
   * Whether this puzzle has been permanently unlocked via ad.
   * If true, premium-only mode shows as unlocked.
   */
  isAdUnlocked?: boolean;

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

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * Get configuration for each game mode.
 */
function getGameModeConfig(gameMode: GameMode): GameModeConfig {
  // Check if we have a custom icon for this game mode
  const customIcon = PUZZLE_ICONS[gameMode];
  const iconElement = customIcon ? (
    <Image source={customIcon} style={iconImageStyle} resizeMode="contain" />
  ) : null;

  switch (gameMode) {
    case 'career_path':
      return {
        title: 'Career Path',
        subtitle: 'Guess the player',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'career_path_pro':
      return {
        title: 'Career Path Pro',
        subtitle: 'Pro challenge',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'guess_the_transfer':
      return {
        title: 'Transfer Guess',
        subtitle: 'Name the player',
        icon: iconElement!,
        iconColor: colors.pitchGreen,
      };
    case 'guess_the_goalscorers':
      return {
        title: 'Goalscorer Recall',
        subtitle: 'Remember the match',
        icon: iconElement!,
        iconColor: colors.redCard,
      };
    case 'tic_tac_toe':
      return {
        title: 'Tic Tac Toe',
        subtitle: 'Beat the AI',
        icon: <Grid3X3 color={colors.floodlightWhite} size={28} />,
        iconColor: colors.floodlightWhite,
      };
    case 'the_grid':
      return {
        title: 'The Grid',
        subtitle: 'Fill the matrix',
        icon: <Grid3X3 color={colors.pitchGreen} size={28} />,
        iconColor: colors.pitchGreen,
      };
    case 'topical_quiz':
      return {
        title: 'Quiz',
        subtitle: '5 questions',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'top_tens':
      return {
        title: 'Top Tens',
        subtitle: 'Name all 10',
        icon: iconElement!,
        iconColor: colors.pitchGreen,
      };
    case 'starting_xi':
      return {
        title: 'Starting XI',
        subtitle: 'Name the lineup',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    default:
      return {
        title: 'Unknown',
        subtitle: '',
        icon: <HelpCircle color={colors.textSecondary} size={28} />,
        iconColor: colors.textSecondary,
      };
  }
}

/**
 * Style for custom puzzle icon images.
 */
const iconImageStyle = { width: 32, height: 32 };

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
 * - premiumLocked: Crown badge with "Unlock" button (premium-only modes)
 */
export function UniversalGameCard({
  gameMode,
  status,
  onPress,
  variant = 'daily',
  isLocked = false,
  isPremiumOnly = false,
  isPremium = false,
  isAdUnlocked = false,
  testID,
}: UniversalGameCardProps) {
  const config = getGameModeConfig(gameMode);
  const buttonProps = getButtonProps(status);
  const scale = useSharedValue(1);

  // Determine if this card is premium-locked (premium-only mode + non-premium user + not ad-unlocked)
  const isPremiumLocked = isPremiumOnly && !isPremium && !isAdUnlocked;

  // Subtle scale animation on press
  const handlePressIn = () => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Merge card styles (GlassCard expects ViewStyle, not array)
  const cardStyle = isLocked || isPremiumLocked
    ? { ...styles.card, ...styles.lockedCard }
    : styles.card;

  // Check if this is a premium-only mode (Career Path Pro, Top Tens)
  const isProMode = isPremiumOnly;

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard style={cardStyle} testID={testID}>
        {/* Pro Sash - diagonal ribbon for pro-only modes */}
        {isProMode && (
          <View style={styles.proSashContainer} pointerEvents="none">
            <View style={styles.proSash}>
              <Text style={styles.proSashText}>PRO</Text>
            </View>
          </View>
        )}
        <Pressable
          style={styles.content}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Left: Icon + Title */}
          <View style={styles.left}>
            <View style={styles.iconContainer}>
              {config.icon}
              {/* Completion badge - small checkmark in corner */}
              {status === 'done' && !isLocked && !isPremiumLocked && (
                <View style={styles.completionBadge}>
                  <Check size={12} color={colors.stadiumNavy} strokeWidth={3} />
                </View>
              )}
              {/* Premium badge - crown for premium-only modes (except Pro which has sash) */}
              {isPremiumOnly && !isProMode && (
                <View style={styles.premiumBadge} testID={`${testID}-premium-badge`}>
                  <Crown size={10} color={colors.stadiumNavy} strokeWidth={2.5} />
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {config.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {isPremiumLocked ? 'Pro' : config.subtitle}
              </Text>
            </View>
          </View>

          {/* Right: Action Button or Unlock CTA */}
          <View style={styles.right}>
            {isLocked || isPremiumLocked ? (
              // "Velvet Rope" design: Premium unlock button instead of static lock
              <ElevatedButton
                title="Unlock"
                onPress={onPress}
                size="small"
                topColor={colors.cardYellow}
                shadowColor="#D4A500"
                icon={<Crown size={14} color={colors.stadiumNavy} />}
                testID={`${testID}-unlock`}
              />
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden', // Clip the PRO sash
  },
  lockedCard: {
    // "Velvet Rope" design: content stays vibrant, subtle gold border signals premium
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  proSashContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    overflow: 'hidden',
    zIndex: 10,
  },
  proSash: {
    position: 'absolute',
    top: 12,
    right: -24,
    backgroundColor: colors.cardYellow,
    paddingHorizontal: 28,
    paddingVertical: 3,
    transform: [{ rotate: '45deg' }],
  },
  proSashText: {
    color: colors.stadiumNavy,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
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
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    // Green accent borders (left + bottom) for 3D elevated effect
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderLeftColor: colors.pitchGreen,
    borderBottomColor: colors.pitchGreen,
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
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.cardYellow,
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
});
