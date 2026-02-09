import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme';
import { CareerStep } from '../types/careerPath.types';
import { CareerStepCard } from './CareerStepCard';

export interface TimelineStepRowProps {
  /** The career step data */
  step: CareerStep;
  /** The step number (1-indexed) */
  stepNumber: number;
  /** Whether this step is revealed */
  isRevealed: boolean;
  /** Whether this is the most recently revealed step */
  isLatest: boolean;
  /** Whether this is the first step (no line above top half?) */
  isFirstStep: boolean;
  /** Whether this is the last step */
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
  /** Whether shake animation should trigger */
  shouldShake?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TimelineStepRow - Connects the timeline axis with the step card.
 *
 * Layout: [Axis Column] [CareerStepCard]
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
  testID,
}: TimelineStepRowProps) {
  const nodeScale = useSharedValue(isRevealed ? 1 : 0);
  const pulseScale = useSharedValue(1);

  const showAsRevealed = isRevealed || forceReveal;

  // Animate node entry
  useEffect(() => {
    if (showAsRevealed) {
      const delay = forceReveal ? revealDelay : 0;
      nodeScale.value = withDelay(
        delay,
        withSpring(1, { damping: 12, stiffness: 150 })
      );
    }
  }, [showAsRevealed, forceReveal, revealDelay, nodeScale]);

  // Pulse animation for current active step
  useEffect(() => {
    // Only pulse if it's the latest revealed step OR it's a "Current" club (based on logic)
    // The prompt says "Active State: The current level has a 'pulsing' glow effect."
    // Usually means the latest revealed step the player is guessing from.
    if (isLatest && !forceReveal) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1);
    }
  }, [isLatest, forceReveal, pulseScale]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(0, nodeScale.value * pulseScale.value) }], // Ensure non-negative
  }));

  const isCurrentClub = !step.endYear || step.endYear === new Date().getFullYear();
  // Active means it is the step we are currently focusing on (latest revealed)
  // OR it is the player's current club (end of career).
  const isActiveDot = isLatest && (isCurrentClub || !isLastStep); // Logic refinement: active if latest.

  // Pulse animation for current active step
  useEffect(() => {
    // Only pulse if it's the latest step active
    if (isActiveDot && !forceReveal) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1);
    }
  }, [isActiveDot, forceReveal, pulseScale]);



  // Dot Styles
  // Past/Revealed: Outlined Green with dark center? Or Filled Green? 
  // Ref: "Green flashing circle on clubs which aren't the players current one? That should only appear if it's a current club."
  // Implies: Non-current clubs should NOT be flashing.
  // Visuals: 
  // - Past: Static Green Outline / Dark Center
  // - Current/Active: Filled Green + Pulse
  
  return (
    <View style={styles.container} testID={testID}>
      {/* Axis Column */}
      <View style={styles.axisColumn}>
        {/* Continuous Line */}
        {!isFirstStep && (
            <View style={[styles.lineSegment, styles.lineTop]} />
        )}
        {!isLastStep && (
            <View style={[styles.lineSegment, styles.lineBottom]} />
        )}

        {/* Timeline Dot */}
        <View style={styles.dotContainer}>
           {/* Base Dot */}
           <View style={[
             styles.dotBase, 
             showAsRevealed ? styles.dotRevealedBase : styles.dotLockedBase,
             (isActiveDot && showAsRevealed) && styles.dotActiveBase // Special style for active pulsing dot
            ]}>
             
             {/* Inner Fill - Only for active? Or always? */}
             {/* If past, maybe just outline? */}
             {isActiveDot && (
                 <Animated.View style={[styles.dotFill, nodeStyle]} />
             )}
             
             {/* Use a smaller static fill for past steps if needed, or leave empty for outline look */}
             {!isActiveDot && showAsRevealed && (
                 <View style={styles.dotPastFill} />
             )}
             
           </View>
        </View>
      </View>

      {/* Card Column */}
      <View style={styles.cardColumn}>
        <CareerStepCard
          step={step}
          stepNumber={stepNumber}
          isRevealed={isRevealed}
          isLatest={isLatest}
          isWinningStep={isWinningStep}
          isMissedStep={isMissedStep}
          forceReveal={forceReveal}
          revealDelay={revealDelay}
          isVictoryReveal={isVictoryReveal}
          testID={testID ? `${testID}-card` : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  axisColumn: {
    width: 40, 
    alignItems: 'center',
    position: 'relative',
  },
  lineSegment: {
    position: 'absolute',
    width: 2,
    backgroundColor: colors.pitchGreen,
    left: 19, 
    opacity: 0.3,
  },
  lineTop: {
    top: 0,
    height: '50%',
  },
  lineBottom: {
    bottom: 0,
    height: '50%',
  },
  dotContainer: {
    position: 'absolute',
    top: 24, 
    left: 13, // Adjusted for slightly larger dot size (14px) -> Center 20 - 7 = 13
    zIndex: 2,
  },
  dotBase: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: colors.stadiumNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLockedBase: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dotRevealedBase: {
    borderColor: colors.pitchGreen, // Green Outline
    backgroundColor: colors.stadiumNavy, // Dark center
  },
  dotActiveBase: {
    borderColor: colors.pitchGreen,
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  dotFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pitchGreen,
    // Animated scale applies here
  },
  dotPastFill: {
    // Optional: could be empty for ring, or small dot. 
    // Reference left image suggests empty ring for past.
    // Let's leave it empty (transparent) or very subtle.
    width: 0,
    height: 0,
  },
  cardColumn: {
    flex: 1,
    paddingRight: spacing.sm,
  },
});
