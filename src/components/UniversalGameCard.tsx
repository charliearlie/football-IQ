/**
 * UniversalGameCard Component
 *
 * Unified game card component used for both Home screen (daily stack)
 * and Archive screen. Provides consistent layout and interaction patterns.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import {
  Grid3X3,
  HelpCircle,
  Check,
  Play,
} from 'lucide-react-native';
import { ProBadge } from '@/components/ProBadge';
import { GlassCard } from './GlassCard';
import { ElevatedButton, ButtonVariant } from './ElevatedButton';
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
function getGameModeConfig(gameMode: GameMode, isArchive = false): GameModeConfig {
  // Check if we have a custom icon for this game mode
  const customIcon = PUZZLE_ICONS[gameMode];
  const imgStyle = isArchive ? archiveIconImageStyle : iconImageStyle;
  const iconElement = customIcon ? (
    <Image source={customIcon} style={imgStyle} resizeMode="contain" />
  ) : null;

  switch (gameMode) {
    case 'career_path':
      return {
        title: 'Career Path',
        subtitle: 'Follow the journey',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'career_path_pro':
      return {
        title: 'Career Path Pro',
        subtitle: 'For true experts',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'guess_the_transfer':
      return {
        title: 'Transfer Guess',
        subtitle: 'Who made the move?',
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
    case 'the_grid':
      return {
        title: 'The Grid (beta)',
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
const archiveIconImageStyle = { width: 24, height: 24 };

/**
 * Button props returned by getButtonProps.
 */
interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  topColor?: string;
  shadowColor?: string;
  borderColor?: string;
}

/**
 * Get button properties based on status.
 */
function getButtonProps(status: CardStatus): ButtonProps {
  switch (status) {
    case 'done':
      // Muted navy background, border matches background (invisible)
      // Secondary variant provides white text
      return {
        title: 'Result',
        variant: 'secondary',
        topColor: '#1E293B',      // Slightly lighter than stadiumNavy
        shadowColor: '#0A1628',   // Dark navy depth
        borderColor: '#1E293B',   // Match background to hide border
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
 * Get haptic feedback type based on button state.
 * - Play: light (selection feedback)
 * - Unlock: medium (impact feedback)
 * - Result: none (quiet, just viewing)
 */
function getHapticType(status: CardStatus, isLocked: boolean, isPremiumLocked: boolean): 'light' | 'medium' | 'none' {
  if (isLocked || isPremiumLocked) return 'medium'; // Unlock
  if (status === 'done') return 'none'; // Result - quiet
  return 'light'; // Play/Resume - light selection
}

/**
 * Get icon for small phone icon-only buttons.
 */
function getSmallPhoneButtonIcon(status: CardStatus, isLocked: boolean): React.ReactNode {
  if (isLocked) return <ProBadge size={14} color={colors.stadiumNavy} />;
  if (status === 'done') return <Check size={14} color={colors.floodlightWhite} strokeWidth={3} />;
  return <Play size={14} color={colors.stadiumNavy} fill={colors.stadiumNavy} />;
}

/**
 * UniversalGameCard - Unified game card for Home and Archive screens.
 *
 * Shows different states:
 * - play: "Play" button (green)
 * - resume: "Resume" button (yellow)
 * - done: "Result" button (yellow) with completion badge
 * - locked: Lock button with dimmed appearance (archive only)
 * - premiumLocked: ProBadge with "Unlock" button (premium-only modes)
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
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 385; // iPhone 13 Mini/SE breakpoint
  const isArchive = variant === 'archive';
  const config = getGameModeConfig(gameMode, isArchive);
  const buttonProps = getButtonProps(status);
  const scale = useSharedValue(1);

  // Determine if this card is premium-locked (premium-only mode + non-premium user + not ad-unlocked)
  const isPremiumLocked = isPremiumOnly && !isPremium && !isAdUnlocked;

  // Get haptic type based on button state
  const hapticType = getHapticType(status, isLocked, isPremiumLocked);

  // Pulse animation for Play button (unplayed games only)
  const playPulse = useSharedValue(1);
  const shouldPulse = status === 'play' && !isLocked && !isPremiumLocked;

  useEffect(() => {
    if (shouldPulse) {
      playPulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        true // reverse
      );
    } else {
      cancelAnimation(playPulse);
      playPulse.value = withTiming(1, { duration: 200 });
    }
  }, [shouldPulse, playPulse]);

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playPulse.value }],
  }));

  // Glint animation for Unlock button (sweeping white line)
  const glintX = useSharedValue(-50);
  const shouldGlint = isLocked || isPremiumLocked;

  useEffect(() => {
    if (shouldGlint) {
      glintX.value = withRepeat(
        withSequence(
          withDelay(3000, withTiming(120, { duration: 600, easing: Easing.out(Easing.quad) })),
          withTiming(-50, { duration: 0 }) // reset instantly
        ),
        -1
      );
    } else {
      cancelAnimation(glintX);
      glintX.value = -50;
    }
  }, [shouldGlint, glintX]);

  const glintAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glintX.value }, { rotate: '25deg' }],
  }));

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
  const baseCardStyle = isArchive ? { ...styles.card, ...archiveStyles.card } : styles.card;
  const cardStyle = isLocked || isPremiumLocked
    ? { ...baseCardStyle, ...styles.lockedCard }
    : baseCardStyle;

  // Check if this is a premium-only mode (Career Path Pro, Top Tens)
  const isProMode = isPremiumOnly;

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard style={cardStyle} testID={testID}>
        {/* Pro Sash - diagonal ribbon for pro-only modes */}
        {isProMode && (
          <View style={styles.proSashContainer} pointerEvents="none">
            <View style={styles.proSash}>
              <Text style={[styles.proSashText, isSmallPhone && { fontSize: 8 }]}>PRO</Text>
            </View>
          </View>
        )}
        <Pressable
          style={[styles.content, isArchive && archiveStyles.content]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Left: Icon + Title */}
          <View style={styles.left}>
            <View style={[styles.iconContainer, isArchive && archiveStyles.iconContainer]}>
              {config.icon}
              {/* Completion badge - small checkmark in corner */}
              {status === 'done' && !isLocked && !isPremiumLocked && (
                <View style={styles.completionBadge}>
                  <Check size={12} color={colors.stadiumNavy} strokeWidth={3} />
                </View>
              )}
              {/* Premium badge - crown for premium-only modes (except Pro which has sash) */}
              {isPremiumOnly && !isProMode && (
                <View style={[styles.premiumBadge, isArchive && archiveStyles.premiumBadge]} testID={`${testID}-premium-badge`}>
                  <ProBadge size={10} color={colors.stadiumNavy} />
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={[
                styles.title,
                isArchive && archiveStyles.title,
                isSmallPhone && { fontSize: isArchive ? 13 : 17 }
              ]} numberOfLines={1}>
                {config.title}
              </Text>
              <Text style={[
                styles.subtitle,
                isArchive && archiveStyles.subtitle,
                isSmallPhone && { fontSize: isArchive ? 10 : 11 }
              ]} numberOfLines={1}>
                {config.subtitle}
              </Text>
            </View>
          </View>

          {/* Right: Action Button or Unlock CTA */}
          <View style={styles.right}>
            {isLocked || isPremiumLocked ? (
              // "Velvet Rope" design: Premium unlock button with glint effect
              <View style={styles.unlockButtonContainer}>
                <ElevatedButton
                  title={isSmallPhone ? "" : "Unlock"}
                  onPress={onPress}
                  size="small"
                  topColor={colors.cardYellow}
                  shadowColor="#D4A500"
                  hapticType={hapticType}
                  icon={<ProBadge size={14} color={colors.stadiumNavy} />}
                  testID={`${testID}-unlock`}
                />
                {/* Glint overlay */}
                <Animated.View
                  style={[styles.glint, glintAnimatedStyle]}
                  pointerEvents="none"
                />
              </View>
            ) : shouldPulse ? (
              // Play button with pulse animation
              <Animated.View style={playButtonAnimatedStyle}>
                <ElevatedButton
                  title={isSmallPhone ? "" : buttonProps.title}
                  variant={buttonProps.variant}
                  onPress={onPress}
                  size="small"
                  topColor={buttonProps.topColor}
                  shadowColor={buttonProps.shadowColor}
                  borderColorOverride={buttonProps.borderColor}
                  hapticType={hapticType}
                  icon={isSmallPhone ? getSmallPhoneButtonIcon(status, false) : undefined}
                  testID={`${testID}-button`}
                />
              </Animated.View>
            ) : (
              // Resume/Result button (no pulse)
              <ElevatedButton
                title={isSmallPhone ? "" : buttonProps.title}
                variant={buttonProps.variant}
                onPress={onPress}
                size="small"
                topColor={buttonProps.topColor}
                shadowColor={buttonProps.shadowColor}
                borderColorOverride={buttonProps.borderColor}
                hapticType={hapticType}
                icon={isSmallPhone ? getSmallPhoneButtonIcon(status, false) : undefined}
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
  unlockButtonContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  glint: {
    position: 'absolute',
    top: -20,
    width: 3,
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

/**
 * Condensed overrides for archive variant (high-density layout).
 */
const archiveStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  content: {
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  premiumBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 11,
  },
});
