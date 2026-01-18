import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fonts, borderRadius, glows } from '@/theme';
import { CareerStep } from '../types/careerPath.types';
import { getTimelineConfig, TIMELINE_ANIMATIONS } from '../constants/timeline';

const config = getTimelineConfig();

export interface TimelineStepRowProps {
  /** The career step data */
  step: CareerStep;
  /** The step number (1-indexed) - for logic only, not displayed */
  stepNumber: number;
  /** Whether this step is revealed */
  isRevealed: boolean;
  /** Whether this is the most recently revealed step (pulsing node) */
  isLatest: boolean;
  /** Whether this is the first step (no line above) */
  isFirstStep: boolean;
  /** Whether this is the last step in the list */
  isLastStep: boolean;
  /** Highlight as the winning step in review mode */
  isWinningStep?: boolean;
  /** Mark as the missed step when lost in review mode */
  isMissedStep?: boolean;
  /** Force reveal this card during victory sequence */
  forceReveal?: boolean;
  /** Delay in ms for staggered reveal animation */
  revealDelay?: number;
  /** Style as victory-revealed card */
  isVictoryReveal?: boolean;
  /** Whether shake animation should trigger (for error feedback) */
  shouldShake?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TimelineStepRow - A compact timeline row displaying a career step.
 *
 * Layout: [Timeline Axis 40px] [Year 80px] [Club Info flex:1]
 * Height: 60px (responsive)
 *
 * The timeline axis shows a vertical line with a circular node.
 * Node states: revealed (green), current (pulsing green), locked (hollow navy)
 */
export function TimelineStepRow({
  step,
  stepNumber,
  isRevealed,
  isLatest,
  isFirstStep,
  isLastStep,
  isWinningStep = false,
  isMissedStep = false,
  forceReveal = false,
  revealDelay = 0,
  isVictoryReveal = false,
  shouldShake = false,
  testID,
}: TimelineStepRowProps) {
  // Track if this was previously revealed (for animation triggering)
  const wasRevealed = useRef(isRevealed);

  // Animation shared values (line removed - handled by TimelineAxis)
  const nodeScale = useSharedValue(isRevealed ? 1 : 0);
  const nodeOpacity = useSharedValue(isRevealed ? 1 : 0);
  const pulseScale = useSharedValue(1);
  const clubSlideX = useSharedValue(isRevealed ? 0 : 20);
  const clubOpacity = useSharedValue(isRevealed ? 1 : 0);
  const victoryProgress = useSharedValue(0);
  const errorFlashOpacity = useSharedValue(0);

  // Node and club info animation when newly revealed
  useEffect(() => {
    if ((isRevealed || forceReveal) && !wasRevealed.current) {
      const delay = forceReveal ? revealDelay : 0;

      // Node appears with scale pop
      nodeScale.value = withDelay(
        delay,
        withSpring(1, { damping: 12, stiffness: 150 })
      );
      nodeOpacity.value = withDelay(
        delay,
        withTiming(1, { duration: 200 })
      );

      // Club info slides in from right
      clubSlideX.value = withDelay(
        delay + TIMELINE_ANIMATIONS.slideInDelay,
        withSpring(0, TIMELINE_ANIMATIONS.slideInSpring)
      );
      clubOpacity.value = withDelay(
        delay + TIMELINE_ANIMATIONS.slideInDelay,
        withTiming(1, { duration: 250 })
      );

      wasRevealed.current = true;
    }
  }, [isRevealed, forceReveal, revealDelay, nodeScale, nodeOpacity, clubSlideX, clubOpacity]);

  // Victory reveal animation
  useEffect(() => {
    if (forceReveal && !isRevealed) {
      const timer = setTimeout(() => {
        victoryProgress.value = withSpring(1, {
          damping: 10,
          stiffness: 120,
          mass: 0.8,
        });
      }, revealDelay);
      return () => clearTimeout(timer);
    }
  }, [forceReveal, revealDelay, isRevealed, victoryProgress]);

  // Pulsing animation for current active step
  useEffect(() => {
    if (isLatest && !forceReveal) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(TIMELINE_ANIMATIONS.pulseScale, {
            duration: TIMELINE_ANIMATIONS.pulseDuration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: TIMELINE_ANIMATIONS.pulseDuration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isLatest, forceReveal, pulseScale]);

  // Error flash animation on node
  useEffect(() => {
    if (shouldShake && isLatest) {
      errorFlashOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0.8, { duration: 80 }),
        withTiming(0, { duration: 120 })
      );
    }
  }, [shouldShake, isLatest, errorFlashOpacity]);

  // Animated styles
  const nodeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: nodeScale.value * pulseScale.value },
    ],
    opacity: nodeOpacity.value,
  }));

  const clubInfoStyle = useAnimatedStyle(() => ({
    opacity: clubOpacity.value,
    transform: [{ translateX: clubSlideX.value }],
  }));

  const victoryStyle = useAnimatedStyle(() => {
    if (!forceReveal || isRevealed) return {};
    return {
      opacity: victoryProgress.value,
      transform: [
        {
          scale: interpolate(
            victoryProgress.value,
            [0, 0.5, 1],
            [0.9, 1.05, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const errorFlashStyle = useAnimatedStyle(() => ({
    opacity: errorFlashOpacity.value,
  }));

  // Determine visual states
  const showAsRevealed = isRevealed || forceReveal;
  const isLoan = step.type === 'loan';

  // Get node color based on state
  const getNodeColor = () => {
    if (isMissedStep) return colors.redCard;
    if (isWinningStep || isVictoryReveal || isLatest) return colors.pitchGreen;
    if (showAsRevealed) return colors.pitchGreen;
    return 'transparent'; // Locked: hollow
  };

  // Get glow style for winning/missed states
  const getGlowStyle = () => {
    if (isWinningStep || isVictoryReveal) return glows.green;
    if (isMissedStep) return glows.red;
    return undefined;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getGlowStyle(),
        forceReveal && !isRevealed ? victoryStyle : undefined,
      ]}
      testID={testID}
    >
      {/* Timeline Axis - Node only (line handled by TimelineAxis) */}
      <View style={styles.axisContainer}>
        {/* Node */}
        <Animated.View
          style={[
            styles.node,
            {
              backgroundColor: getNodeColor(),
              borderColor: showAsRevealed ? getNodeColor() : colors.stadiumNavy,
            },
            nodeStyle,
          ]}
        >
          {/* Error flash glow */}
          <Animated.View
            style={[
              styles.nodeErrorGlow,
              errorFlashStyle,
            ]}
          />
        </Animated.View>
      </View>

      {/* Year Column */}
      <View style={styles.yearContainer}>
        {showAsRevealed ? (
          <Text style={styles.yearText}>{step.year}</Text>
        ) : (
          <Text style={[styles.yearText, styles.yearLocked]}>----</Text>
        )}
      </View>

      {/* Club Info Column */}
      <Animated.View style={[styles.clubContainer, clubInfoStyle]}>
        {showAsRevealed ? (
          <>
            <View style={styles.clubRow}>
              <Text style={styles.clubName} numberOfLines={1}>
                {step.text}
              </Text>
              {isLoan && (
                <View style={styles.loanBadge}>
                  <Text style={styles.loanText}>LOAN</Text>
                </View>
              )}
            </View>
            {/* Stats row (apps/goals) */}
            {(step.apps !== undefined || step.goals !== undefined) && (
              <View style={styles.statsRow}>
                {step.apps !== undefined && (
                  <Text style={styles.statText}>{step.apps} Apps</Text>
                )}
                {step.apps !== undefined && step.goals !== undefined && (
                  <Text style={styles.statSeparator}>·</Text>
                )}
                {step.goals !== undefined && (
                  <Text style={styles.statText}>{step.goals} Gls</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderBar} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: config.stepHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Timeline Axis - node only (continuous line handled by TimelineAxis component)
  axisContainer: {
    width: config.axisWidth,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  node: {
    width: config.nodeSize,
    height: config.nodeSize,
    borderRadius: config.nodeSize / 2,
    borderWidth: 2,
    zIndex: 1,
  },
  nodeErrorGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: config.nodeSize / 2,
    backgroundColor: colors.redCard,
    transform: [{ scale: 2 }],
  },
  // Year Column
  yearContainer: {
    width: config.yearWidth,
    justifyContent: 'center',
  },
  yearText: {
    fontFamily: fonts.headline,
    fontSize: config.yearFontSize,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },
  yearLocked: {
    opacity: 0.4,
  },
  // Club Info Column
  clubContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.sm,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clubName: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: config.clubFontSize,
    color: colors.floodlightWhite,
    flex: 1,
  },
  loanBadge: {
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  loanText: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  statSeparator: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.5,
  },
  // Locked state placeholder
  placeholderBar: {
    width: 80,
    height: 12,
    backgroundColor: colors.glassBorder,
    borderRadius: borderRadius.sm,
  },
});
